require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const nodemailer = require('nodemailer')
const { PrismaClient } = require('../src/generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Inline templates (mirrors src/lib/email-templates.ts)
const BASE = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#fffdf7;border:1px solid #e8e0d0;border-radius:16px;overflow:hidden">
    <div style="background:#1a1a1a;padding:24px 32px;text-align:center">
      <span style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:-0.5px">Bakımla</span>
    </div>
    <div style="padding:32px">
      {{BODY}}
    </div>
    <div style="padding:16px 32px;background:#f5f0e8;border-top:1px solid #e8e0d0;font-size:12px;color:#9ca3af;text-align:center">
      Bu e-posta Bakımla platformu tarafından gönderilmiştir. © 2025 Bakımla
    </div>
  </div>
`

function wrap(body) { return BASE.replace('{{BODY}}', body) }

async function main() {
  // Load SMTP config from DB
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from_name', 'smtp_from_email'] } },
  })
  const cfg = Object.fromEntries(configs.map(c => [c.key, c.value]))

  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    console.error('SMTP yapılandırması eksik! Önce setup-smtp.js çalıştırın.')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port ?? 587),
    secure: cfg.smtp_secure === 'true',
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
  })

  const from = `"${cfg.smtp_from_name ?? 'Bakımla'}" <${cfg.smtp_from_email ?? cfg.smtp_user}>`
  const to = cfg.smtp_user

  async function send(subject, html) {
    const info = await transporter.sendMail({ from, to, subject, html })
    const url = nodemailer.getTestMessageUrl(info)
    console.log(`  ✓ ${subject}`)
    if (url) console.log(`    Preview: ${url}`)
  }

  console.log('\n=== E-posta Akışı Testi ===\n')

  // 1. Welcome email - customer
  await send('Hoş Geldiniz - Müşteri', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Hoş Geldiniz, Ahmet!</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Bakımla ailesine katıldığınız için teşekkürler.</p>
    <p style="font-size:14px;color:#1a1a1a;margin-bottom:24px">Size en yakın kuaförü, güzellik merkezini ve daha fazlasını keşfetmek için hemen aramaya başlayın.</p>
    <a href="http://localhost:3000/search" style="display:inline-block;background:#c9a84c;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Keşfet</a>
  `))

  // 2. Welcome email - salon owner
  await send('Hoş Geldiniz - İşletme Sahibi', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Hoş Geldiniz, Elif!</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Bakımla ailesine katıldığınız için teşekkürler.</p>
    <p style="font-size:14px;color:#1a1a1a;margin-bottom:24px">İşletme panelinizi oluşturmak ve randevu almaya başlamak için aşağıdaki bağlantıyı kullanabilirsiniz.</p>
    <a href="http://localhost:3000/salon/dashboard" style="display:inline-block;background:#c9a84c;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Panelime Git</a>
  `))

  // 3. Appointment confirmed (customer)
  await send('Randevunuz Onaylandı', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Randevunuz Onaylandı ✓</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba Ahmet, randevunuz başarıyla onaylandı.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">İşletme</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Elit Kuaför</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Saç Kesimi</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Uzman</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Mehmet Usta</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">15 Mayıs 2026, Cuma</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">14:30</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#6b7280">Randevunuzu iptal etmek veya değiştirmek için lütfen işletmeyle iletişime geçin.</p>
  `))

  // 4. Appointment cancelled (customer)
  await send('Randevunuz İptal Edildi', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#b42318;margin:0 0 8px">Randevunuz İptal Edildi</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba Ahmet, randevunuz maalesef iptal edildi.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">İşletme</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Elit Kuaför</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Saç Kesimi</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">15 Mayıs 2026, Cuma</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">14:30</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Neden</td><td style="padding:8px 0;font-size:13px;color:#b42318">Uzman müsait değil</td></tr>
      </table>
    </div>
  `))

  // 5. New appointment notification (salon)
  await send('Yeni Randevu Talebi - İşletme', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Yeni Randevu Talebi</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Elit Kuaför için yeni bir randevu talebi geldi.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">Müşteri</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Ahmet Yılmaz</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Telefon</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">0532 123 45 67</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Saç Kesimi</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Uzman</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Mehmet Usta</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">15 Mayıs 2026, Cuma</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">14:30</td></tr>
      </table>
    </div>
    <a href="http://localhost:3000/salon/calendar" style="display:inline-block;background:#1a1a1a;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Takvimi Görüntüle</a>
  `))

  // 6. Appointment reminder
  await send('Randevu Hatırlatması', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Randevu Hatırlatması</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba Ahmet, randevunuz yaklaşıyor!</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">İşletme</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Elit Kuaför</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Saç Kesimi</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">15 Mayıs 2026, Cuma</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">14:30</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Adres</td><td style="padding:8px 0;font-size:13px;color:#1a1a1a">Bağcılar Mah. Atatürk Cad. No:12, İstanbul</td></tr>
      </table>
    </div>
  `))

  // 7. Payment approved
  await send('Ödemeniz Onaylandı', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#15803d;margin:0 0 8px">Ödemeniz Onaylandı ✓</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Elit Kuaför için abonelik ödemesi onaylandı.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">Plan</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Pro Plan</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tutar</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">299,00 ₺</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Geçerlilik</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">14 Haziran 2026 tarihine kadar</td></tr>
      </table>
    </div>
    <a href="http://localhost:3000/salon/dashboard" style="display:inline-block;background:#1a1a1a;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Panele Git</a>
  `))

  // 8. Payment rejected
  await send('Ödemeniz Reddedildi', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#b42318;margin:0 0 8px">Ödemeniz Reddedildi</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Elit Kuaför için abonelik ödemesi reddedildi.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">Plan</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">Pro Plan</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tutar</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">299,00 ₺</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Neden</td><td style="padding:8px 0;font-size:13px;color:#b42318">Dekont doğrulanamadı</td></tr>
      </table>
    </div>
    <a href="http://localhost:3000/salon/subscription" style="display:inline-block;background:#b42318;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Tekrar Dene</a>
  `))

  // 9. Password reset
  await send('Şifre Sıfırlama', wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Şifre Sıfırlama</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba Ahmet, şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
    <a href="http://localhost:3000/auth/reset-password/test-token-123" style="display:inline-block;background:#1a1a1a;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Şifremi Sıfırla</a>
    <p style="font-size:12px;color:#9ca3af;margin-top:24px">Bu bağlantı 1 saat boyunca geçerlidir.</p>
  `))

  console.log('\n=== Tüm e-postalar başarıyla gönderildi! ===')
  console.log('Ethereal girişi: https://ethereal.email/login')
  console.log('E-posta:', cfg.smtp_user)
  console.log('Şifre:', cfg.smtp_pass)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
