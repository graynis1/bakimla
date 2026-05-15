'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'

export async function loginAction(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await signIn('credentials', { email, password, redirect: false })
    return { success: true }
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: 'E-posta veya şifre hatalı' }
    }
    console.error('[loginAction]', err)
    return { success: false, error: 'Sunucu hatası, tekrar deneyin' }
  }
}
