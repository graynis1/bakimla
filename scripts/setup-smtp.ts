import nodemailer from 'nodemailer'
import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Ethereal test hesabı oluşturuluyor...')
  const account = await nodemailer.createTestAccount()
  console.log('Hesap oluşturuldu:', account.user)

  const config: Record<string, string> = {
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
  console.log('\nEtheral e-postalarını görmek için: https://ethereal.email/login')
  console.log('E-posta:', account.user)
  console.log('Şifre:', account.pass)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
