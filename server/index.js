import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import { randomInt, createHmac, timingSafeEqual } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 8787)
const OTP_SECRET = process.env.OTP_SECRET ?? ''
const GMAIL_USER = process.env.GMAIL_USER ?? ''
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s/g, '')
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
const IS_PROD = process.env.NODE_ENV === 'production'

const OTP_TTL_MS = 5 * 60_000
const MAX_VERIFY_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60_000
const MAX_SENDS_PER_EMAIL_PER_HOUR = 3
const MAX_REQUESTS_PER_IP_PER_HOUR = 10
const HOUR_MS = 3_600_000

if (OTP_SECRET.length < 32) {
  console.error('OTP_SECRET wajib diisi, minimal 32 karakter.')
  process.exit(1)
}
if (IS_PROD && (!GMAIL_USER || !GMAIL_APP_PASSWORD)) {
  console.error('GMAIL_USER dan GMAIL_APP_PASSWORD wajib diisi di production.')
  process.exit(1)
}

const transporter = GMAIL_USER && GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } })
  : null

const otpStore = new Map()
const emailSendLog = new Map()
const ipRequestLog = new Map()

function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function hashCode(email, code) {
  return createHmac('sha256', OTP_SECRET).update(`${email}:${code}`).digest()
}

function withinLimit(log, key, limit, windowMs, now = Date.now()) {
  const recent = (log.get(key) ?? []).filter(ts => now - ts < windowMs)
  if (recent.length >= limit) {
    log.set(key, recent)
    return false
  }
  recent.push(now)
  log.set(key, recent)
  return true
}

async function sendEmail(to, code) {
  if (!transporter) {
    console.log(`[DEV] OTP untuk ${to}: ${code}`)
    return
  }
  await transporter.sendMail({
    from: `"La Casa Coffee & Space" <${GMAIL_USER}>`,
    to,
    subject: 'Kode OTP Reset Kata Sandi - La Casa Coffee & Space',
    text: `Kode OTP reset kata sandi Anda: ${code}\n\nBerlaku 5 menit. Jangan bagikan kode ini ke siapa pun.\nJika Anda tidak merasa memintanya, abaikan email ini.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e8ece7;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#244d41">La Casa Coffee &amp; Space</h2>
      <p style="margin:0 0 16px;color:#444">Kode OTP reset kata sandi Anda:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#17362e;text-align:center;padding:14px;background:#f7f8f5;border-radius:8px">${code}</div>
      <p style="margin:16px 0 0;color:#666;font-size:13px">Berlaku 5 menit. Jangan bagikan kode ini ke siapa pun. Jika Anda tidak merasa memintanya, abaikan email ini.</p></div>`
  })
}

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '1kb' }))
app.use(cors({ origin: CORS_ORIGIN, methods: ['POST'] }))

app.post('/api/otp/request', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (!email) return res.status(400).json({ ok: false, message: 'Alamat email tidak valid.' })

  if (!withinLimit(ipRequestLog, req.ip, MAX_REQUESTS_PER_IP_PER_HOUR, HOUR_MS)) {
    return res.status(429).json({ ok: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 1 jam.' })
  }

  const now = Date.now()
  const existing = otpStore.get(email)
  if (existing && now - existing.sentAt < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.sentAt)) / 1000)
    return res.status(429).json({ ok: false, message: `Tunggu ${wait} detik sebelum meminta kode lagi.`, retryAfter: wait })
  }
  if (!withinLimit(emailSendLog, email, MAX_SENDS_PER_EMAIL_PER_HOUR, HOUR_MS, now)) {
    return res.status(429).json({ ok: false, message: 'Batas permintaan kode tercapai. Coba lagi dalam 1 jam.' })
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  otpStore.set(email, { hash: hashCode(email, code), expiresAt: now + OTP_TTL_MS, sentAt: now, attempts: 0 })

  try {
    await sendEmail(email, code)
  } catch (err) {
    otpStore.delete(email)
    console.error('Gagal kirim email:', err.message)
    return res.status(502).json({ ok: false, message: 'Gagal mengirim email. Coba lagi nanti.' })
  }
  res.json({ ok: true, cooldown: RESEND_COOLDOWN_MS / 1000 })
})

app.post('/api/otp/verify', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const code = String(req.body?.code ?? '')
  const invalid = { ok: false, message: 'Kode salah atau sudah kedaluwarsa.' }
  if (!email || !/^\d{6}$/.test(code)) return res.status(400).json(invalid)

  const record = otpStore.get(email)
  if (!record || Date.now() > record.expiresAt) {
    otpStore.delete(email)
    return res.status(400).json(invalid)
  }

  record.attempts += 1
  if (record.attempts > MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(email)
    return res.status(429).json({ ok: false, message: 'Terlalu banyak percobaan. Minta kode baru.' })
  }

  const expected = record.hash
  const actual = hashCode(email, code)
  if (!timingSafeEqual(expected, actual)) return res.status(400).json(invalid)

  otpStore.delete(email)
  res.json({ ok: true })
})

setInterval(() => {
  const now = Date.now()
  for (const [email, record] of otpStore) if (now > record.expiresAt) otpStore.delete(email)
  for (const [key, log] of emailSendLog) if (!log.some(ts => now - ts < HOUR_MS)) emailSendLog.delete(key)
  for (const [key, log] of ipRequestLog) if (!log.some(ts => now - ts < HOUR_MS)) ipRequestLog.delete(key)
}, 60_000).unref()

app.listen(PORT, () => console.log(`OTP server aktif di :${PORT} (${transporter ? 'Gmail SMTP' : 'mode DEV, kode dicetak di terminal'})`))
