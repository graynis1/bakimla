import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Sadece dev'de ve admin yokken çalışır
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@bakimla.com' } })
    if (existing) {
      // Şifreyi sıfırla
      const hash = await bcrypt.hash('Admin123!', 12)
      await prisma.user.update({ where: { email: 'admin@bakimla.com' }, data: { password: hash, isActive: true } })
      return NextResponse.json({ ok: true, message: 'Admin şifresi sıfırlandı: Admin123!' })
    }
    const hash = await bcrypt.hash('Admin123!', 12)
    await prisma.user.create({
      data: { name: 'Admin', surname: 'Bakimla', email: 'admin@bakimla.com', password: hash, role: 'ADMIN', isActive: true },
    })
    return NextResponse.json({ ok: true, message: 'Admin oluşturuldu: admin@bakimla.com / Admin123!' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
