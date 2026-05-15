interface SubscriptionLike {
  status: string
  endDate?: Date | string | null
  trialEndsAt?: Date | string | null
}

export function isSubscriptionActive(sub: SubscriptionLike): boolean {
  if (sub.status === 'ACTIVE') {
    if (!sub.endDate) return true
    return new Date(sub.endDate) > new Date()
  }
  if (sub.status === 'TRIAL') {
    if (!sub.trialEndsAt) return true
    return new Date(sub.trialEndsAt) > new Date()
  }
  return false
}
