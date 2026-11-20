# Server OTP La Casa (Email Gmail)

1. `cd server && npm install`
2. `cp .env.example .env`, isi `OTP_SECRET` (32+ karakter), `GMAIL_USER`, dan `GMAIL_APP_PASSWORD`
3. `npm run dev` (Node 20.6+). Tanpa `GMAIL_USER`/`GMAIL_APP_PASSWORD`, kode OTP dicetak di terminal.
4. Di folder utama: `npm install && npm run dev`. Vite meneruskan `/api` ke port 8787.

## Membuat App Password Gmail
1. Aktifkan Verifikasi 2 Langkah di akun Google pengirim.
2. Buka https://myaccount.google.com/apppasswords dan buat sandi aplikasi (16 karakter).
3. Isi `GMAIL_USER` dengan alamat Gmail, `GMAIL_APP_PASSWORD` dengan 16 karakter tadi (bukan password Gmail asli).

Production: set `NODE_ENV=production`, `CORS_ORIGIN=https://domain-anda`, dan `VITE_OTP_API_URL=https://api-anda/api/otp` saat build frontend.
