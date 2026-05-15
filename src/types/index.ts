import { Prisma } from '../generated/prisma'

export type BusinessWithDetails = Prisma.BusinessGetPayload<{
  include: {
    employees: {
      include: {
        services: { include: { service: true } }
        schedule: true
      }
    }
    services: true
    gallery: true
    reviews: {
      include: { customer: true }
    }
  }
}>

export type AppointmentWithDetails = Prisma.AppointmentGetPayload<{
  include: {
    business: true
    employee: true
    service: true
    customer: true
  }
}>

export type EmployeeWithServices = Prisma.EmployeeGetPayload<{
  include: {
    services: { include: { service: true } }
    schedule: true
  }
}>

export type ReviewWithCustomer = Prisma.ReviewGetPayload<{
  include: {
    customer: true
    appointment: { include: { service: true } }
  }
}>

export type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{
  include: {
    plan: true
  }
}>

export type PaymentWithDetails = Prisma.PaymentGetPayload<{
  include: {
    business: true
    plan: true
  }
}>
