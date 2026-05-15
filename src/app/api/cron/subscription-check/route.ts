import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'

// Called daily — expires stale subscriptions, sends expiry warnings
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in3Days = addDays(now, 3)

  // 1. Mark expired subscriptions
  const expired = await prisma.subscription.updateMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL'] },
      endDate: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  // 2. Mark expired trials (trialEndsAt past)
  const expiredTrials = await prisma.subscription.updateMany({
    where: {
      status: 'TRIAL',
      trialEndsAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  // 3. Send warning emails for subscriptions expiring in ≤3 days
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: { in: ['ACTIVE', 'TRIAL'] },
      endDate: { gte: now, lte: in3Days },
    },
    include: {
      business: {
        select: {
          name: true,
          ownerId: true,
          owner: { select: { email: true, name: true } },
        },
      },
      plan: { select: { name: true } },
    },
  })

  let warned = 0
  for (const sub of expiringSoon) {
    try {
      const endLabel = format(sub.endDate!, 'd MMMM yyyy', { locale: tr })
      await sendEmail({
        to: sub.business.owner.email,
        subject: `Bakımla – Aboneliğiniz ${endLabel} tarihinde bitiyor`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#fffdf7;border:1px solid #e8e0d0;border-radius:16px;overflow:hidden">
            <div style="background:#1a1a1a;padding:24px 32px;text-align:center">
              <span style="color:#c9a84c;font-size:22px;font-weight:900">Bakımla</span>
            </div>
            <div style="padding:32px">
              <h2 style="font-size:18px;font-weight:800;color:#92400e;margin:0 0 12px">Aboneliğiniz Sona Eriyor</h2>
              <p style="color:#6b7280;font-size:14px;margin:0 0 20px">
                Merhaba ${sub.business.owner.name}, <strong>${sub.business.name}</strong> işletmenizin
                <strong>${sub.plan.name}</strong> aboneliği <strong>${endLabel}</strong> tarihinde sona eriyor.
              </p>
              <p style="color:#6b7280;font-size:14px;margin:0 0 24px">
                Aboneliğinizi yenilemezseniz yeni randevu kabul etmeniz engellenecektir.
              </p>
              <a href="${process.env.NEXTAUTH_URL ?? 'https://bakimla.com'}/salon/subscription"
                 style="display:inline-block;background:#c9a84c;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">
                Aboneliği Yenile
              </a>
            </div>
            <div style="padding:16px 32px;background:#f5f0e8;border-top:1px solid #e8e0d0;font-size:12px;color:#9ca3af;text-align:center">
              © 2025 Bakımla
            </div>
          </div>
        `,
      })
      warned++
    } catch (err) {
      console.error('Warning email failed for subscription', sub.id, err)
    }
  }

  return NextResponse.json({
    success: true,
    expiredCount: expired.count + expiredTrials.count,
    warned,
  })
}
