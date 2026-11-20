const OTP_API = import.meta.env.VITE_OTP_API_URL ?? '/api/otp'

async function post(path, body) {
  try {
    const res = await fetch(`${OTP_API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json().catch(() => ({}))
    return { ...data, ok: res.ok && data.ok === true, status: res.status }
  } catch (e) {
    return { ok: false, status: 0, message: 'Server OTP tidak dapat dihubungi. Coba lagi nanti.' }
  }
}

export const requestOtp = (email) => post('/request', { email })
export const verifyOtp = (email, code) => post('/verify', { email, code })
