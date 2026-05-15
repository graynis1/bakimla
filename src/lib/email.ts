import nodemailer from 'nodemailer'
import { prisma } from './prisma'

async function getSmtpConfig() {
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_from_name', 'smtp_from_email'] } },
  })
  const map: Record<string, string> = {}
  for (const c of configs) map[c.key] = c.value
  return map
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const cfg = await getSmtpConfig()
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    console.warn('[email] SMTP not configured, skipping email to', to)
    return
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
}
