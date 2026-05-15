import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, description, code, discount, imageUrl, isActive, startDate, endDate } = body
  if (!title) return NextResponse.json({ error: 'Başlık zorunludur' }, { status: 400 })

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description: description || null,
      code: code || null,
      discount: discount ? parseInt(discount) : null,
      imageUrl: imageUrl || null,
      isActive: isActive !== false,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  })
  return NextResponse.json(campaign, { status: 201 })
}
