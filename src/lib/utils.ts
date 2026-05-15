import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { BusinessCategory } from '../generated/prisma'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'd MMMM yyyy EEEE', { locale: tr })
}

export function formatPrice(amount: number | { toNumber: () => number } | string): string {
  const num = typeof amount === 'object' && amount !== null && 'toNumber' in amount
    ? (amount as { toNumber: () => number }).toNumber()
    : Number(amount)
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatTime(time: string): string {
  return time.substring(0, 5)
}

export function generateTimeSlots(start: string, end: string, interval = 15): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let current = sh * 60 + sm
  const endMin = eh * 60 + em
  while (current < endMin) {
    const h = Math.floor(current / 60)
    const m = current % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    current += interval
  }
  return slots
}

export const categoryLabels: Record<BusinessCategory, string> = {
  BARBER: 'Berber',
  HAIR_SALON: 'Kuaför',
  NAIL_SALON: 'Nail Salon',
  BEAUTY_CENTER: 'Güzellik Merkezi',
  SKIN_CARE: 'Cilt Bakım',
  REFLEXOLOGY: 'Refleksoloji',
  MASSAGE: 'Masaj Salonu',
  EPILATION: 'Epilasyon',
  FITNESS: 'Fitness',
  TEETH_WHITENING: 'Diş Beyazlatma',
  BROW_LASH: 'Kaş & Kirpik',
  YOGA_PILATES: 'Yoga & Pilates',
  PET_GROOMING: 'Pet Kuaför',
  DIETITIAN: 'Diyetisyen',
  PHYSIOTHERAPY: 'Fizyoterapi',
  SPA: 'Spa & Masaj',
}

export const categoryEmojis: Record<BusinessCategory, string> = {
  BARBER: '✂️',
  HAIR_SALON: '💇',
  NAIL_SALON: '💅',
  BEAUTY_CENTER: '◎',
  SKIN_CARE: '🧴',
  REFLEXOLOGY: '🦶',
  MASSAGE: '💆',
  EPILATION: '⌁',
  FITNESS: '🏋️',
  TEETH_WHITENING: '🦷',
  BROW_LASH: '👁️',
  YOGA_PILATES: '🧘',
  PET_GROOMING: '🐾',
  DIETITIAN: '🥗',
  PHYSIOTHERAPY: '🏥',
  SPA: '🧖',
}
