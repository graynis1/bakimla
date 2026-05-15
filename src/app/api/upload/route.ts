import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Dosya bulunamadı' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Sadece JPEG, PNG, WebP ve GIF desteklenir' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'Dosya 5MB\'dan büyük olamaz' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${randomUUID()}.${ext}`
    const uploadsDir = join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadsDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadsDir, filename), buffer)

    return NextResponse.json({ success: true, url: `/uploads/${filename}` })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ success: false, error: 'Yükleme başarısız' }, { status: 500 })
  }
}
