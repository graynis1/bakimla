import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: 'Yetkisiz' }, { status: 401 })

  const business = await prisma.business.findFirst({ where: { ownerId: session.user.id } })
  if (!business) return NextResponse.json({ success: false, error: 'İşletme bulunamadı' }, { status: 404 })

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const thisMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const [
    thisMonthAppts, lastMonthAppts,
    thisMonthRevenue, lastMonthRevenue,
    weekAppts, totalCustomers,
    statusCounts, topServices,
    monthlyTrend,
  ] = await Promise.all([
    prisma.appointment.count({ where: { businessId: business.id, date: { gte: thisMonthStart, lte: thisMonthEnd } } }),
    prisma.appointment.count({ where: { businessId: business.id, date: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.appointment.aggregate({ where: { businessId: business.id, status: 'COMPLETED', date: { gte: thisMonthStart, lte: thisMonthEnd } }, _sum: { price: true } }),
    prisma.appointment.aggregate({ where: { businessId: business.id, status: 'COMPLETED', date: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { price: true } }),
    prisma.appointment.count({ where: { businessId: business.id, date: { gte: weekStart, lte: weekEnd } } }),
    prisma.appointment.findMany({ where: { businessId: business.id }, select: { customerId: true }, distinct: ['customerId'] }).then((r) => r.length),
    prisma.appointment.groupBy({ by: ['status'], where: { businessId: business.id }, _count: true }),
    prisma.appointment.groupBy({
      by: ['serviceId'],
      where: { businessId: business.id },
      _count: true,
      orderBy: { _count: { serviceId: 'desc' } },
      take: 5,
    }).then(async (groups) => {
      const serviceIds = groups.map((g) => g.serviceId)
      const services = await prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } })
      return groups.map((g) => ({ ...g, name: services.find((s) => s.id === g.serviceId)?.name ?? 'Bilinmiyor' }))
    }),
    // Last 6 months trend
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(now, 5 - i)
        const start = startOfMonth(monthDate)
        const end = endOfMonth(monthDate)
        return prisma.appointment.count({ where: { businessId: business.id, date: { gte: start, lte: end } } }).then((count) => ({
          month: monthDate.toISOString(),
          count,
        }))
      })
    ),
  ])

  return NextResponse.json({
    success: true,
    data: {
      thisMonthAppts, lastMonthAppts,
      thisMonthRevenue: thisMonthRevenue._sum.price?.toNumber() ?? 0,
      lastMonthRevenue: lastMonthRevenue._sum.price?.toNumber() ?? 0,
      weekAppts, totalCustomers,
      statusCounts,
      topServices,
      monthlyTrend,
      rating: business.rating,
      reviewCount: business.reviewCount,
    },
  })
}
