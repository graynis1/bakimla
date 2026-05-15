require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const nodemailer = require('nodemailer')
const { PrismaClient } = require('../src/generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Ethereal test hesabı oluşturuluyor...')
  const account = await nodemailer.createTestAccount()
  console.log('Hesap oluşturuldu:', account.user)

  const config = {
    smtp_host: account.smtp.host,
    smtp_port: String(account.smtp.port),
    smtp_user: account.user,
    smtp_pass: account.pass,
    smtp_secure: String(account.smtp.secure),
    smtp_from_name: 'Bakımla',
    smtp_from_email: account.user,
  }

  for (const [key, value] of Object.entries(config)) {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  console.log('\nSMTP ayarları DB ye kaydedildi:')
  console.log('  Host:', config.smtp_host)
  console.log('  Port:', config.smtp_port)
  console.log('  User:', config.smtp_user)
  console.log('  Pass:', config.smtp_pass)

  // Send a test email immediately
  console.log('\nTest e-postası gönderiliyor...')
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  })

  const info = await transporter.sendMail({
    from: '"Bakımla" <' + account.user + '>',
    to: account.user,
    subject: 'Bakımla SMTP Test - Başarılı!',
    html: `<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto">
      <div style="background:#1a1a1a;padding:24px 32px;text-align:center;border-radius:16px 16px 0 0">
        <span style="color:#c9a84c;font-size:22px;font-weight:900">Bakımla</span>
      </div>
      <div style="padding:32px;background:#fffdf7;border:1px solid #e8e0d0">
        <h2 style="color:#15803d">SMTP Yapılandırması Başarılı!</h2>
        <p>Bakımla platformu artık e-posta gönderebilir durumda.</p>
        <p style="color:#6b7280;font-size:13px">Bu bir Ethereal test e-postasıdır. Gerçek kullanıcılara gönderilmez.</p>
      </div>
    </div>`,
  })

  console.log('\nTest e-postası gönderildi!')
  console.log('>>> Preview URL:', nodemailer.getTestMessageUrl(info))
  console.log('\nEthereal giriş bilgileri (e-postanızı tarayıcıda görmek için):')
  console.log('  https://ethereal.email/login')
  console.log('  E-posta:', account.user)
  console.log('  Şifre:', account.pass)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
