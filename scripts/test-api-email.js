// Tests the /api/admin/settings test email action directly (bypassing HTTP)
require('dotenv').config({ path: require('path').join(__dirname, '../.env') })

const { PrismaClient } = require('../src/generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')
const nodemailer = require('nodemailer')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function sendEmail({ to, subject, html }) {
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from_name', 'smtp_from_email'] } },
  })
  const cfg = Object.fromEntries(configs.map(c => [c.key, c.value]))

  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    throw new Error('SMTP yapılandırması eksik')
  }

  const transporter = nodemailer.createTransport({
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port ?? 587),
    secure: cfg.smtp_secure === 'true',
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
  })

  const fromName = cfg.smtp_from_name ?? 'Bakımla'
  const fromEmail = cfg.smtp_from_email ?? cfg.smtp_user

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  })

  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) console.log('[email] Preview URL:', previewUrl)
  return info
}

async function main() {
  console.log('Admin ayarlar test e-postası simülasyonu...\n')

  // Simulate what /api/admin/settings does for action='test'
  const testEmail = 'test@example.com'
  await sendEmail({
    to: testEmail,
    subject: 'Bakımla SMTP Test E-postası',
    html: '<p>Bu bir test e-postasıdır. SMTP yapılandırmanız başarılı!</p>',
  })

  console.log('\nAdmin settings test e-postası başarıyla gönderildi!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
