import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
})

const baseCustomerFields = {
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  surname: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  passwordConfirm: z.string(),
}

export const customerRegisterSchema = z
  .object(baseCustomerFields)
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Şifreler eşleşmiyor',
    path: ['passwordConfirm'],
  })

export const salonRegisterSchema = z
  .object({
    ...baseCustomerFields,
    businessName: z.string().min(2, 'İşletme adı en az 2 karakter olmalıdır'),
    category: z.string().min(1, 'Kategori seçiniz'),
    city: z.string().min(1, 'Şehir seçiniz'),
    district: z.string().min(1, 'İlçe seçiniz'),
    businessPhone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Şifreler eşleşmiyor',
    path: ['passwordConfirm'],
  })

export const appointmentSchema = z.object({
  businessId: z.string().min(1, 'İşletme seçiniz'),
  employeeId: z.string().min(1, 'Çalışan seçiniz'),
  serviceId: z.string().min(1, 'Hizmet seçiniz'),
  date: z.string().min(1, 'Tarih seçiniz'),
  startTime: z.string().min(1, 'Saat seçiniz'),
  note: z.string().optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Puan giriniz').max(5, 'Maksimum 5 puan'),
  comment: z.string().max(500, 'Yorum en fazla 500 karakter olabilir').optional(),
})

export const businessUpdateSchema = z.object({
  name: z.string().min(2, 'İşletme adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  address: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
  city: z.string().min(1, 'Şehir seçiniz'),
  district: z.string().min(1, 'İlçe seçiniz'),
  workingHours: z.any(),
})

export const serviceSchema = z.object({
  name: z.string().min(2, 'Hizmet adı en az 2 karakter olmalıdır'),
  duration: z
    .number()
    .min(5, 'Süre en az 5 dakika olmalıdır')
    .max(480, 'Süre en fazla 480 dakika olabilir'),
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalıdır'),
  description: z.string().optional(),
})

export const employeeSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  surname: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  title: z.string().optional(),
  specialties: z.array(z.string()).optional(),
})

export const paymentSchema = z.object({
  amount: z.number().min(1, 'Tutar giriniz'),
  bankAccountId: z.string().min(1, 'Banka hesabı seçiniz'),
  transferDate: z.string().min(1, 'Havale tarihi seçiniz'),
  senderName: z.string().min(2, 'Gönderen adı giriniz'),
  referenceNote: z.string().optional(),
  receiptUrl: z.string().optional(),
})

export const subscriptionPlanSchema = z.object({
  name: z.string().min(2, 'Plan adı en az 2 karakter olmalıdır'),
  basePrice: z.number().min(0, 'Baz fiyat 0 veya daha büyük olmalıdır'),
  maxEmployees: z.number().nullable().optional(),
  maxServices: z.number().nullable().optional(),
  maxGalleryImages: z.number().nullable().optional(),
  features: z.array(z.string()),
  trialDays: z.number().min(0, 'Deneme süresi 0 veya daha büyük olmalıdır'),
  description: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export const staffPricingTierSchema = z.object({
  minStaff: z.number().min(2, 'Minimum personel sayısı 2 olmalıdır'),
  maxStaff: z.number().nullable().optional(),
  pricePerStaff: z.number().min(0, 'Personel başı fiyat 0 veya daha büyük olmalıdır'),
})

export const bankAccountSchema = z.object({
  bankName: z.string().min(2, 'Banka adı giriniz'),
  accountName: z.string().min(2, 'Hesap sahibi adı giriniz'),
  iban: z.string().min(26, 'Geçerli bir IBAN giriniz'),
  branchCode: z.string().optional(),
  accountNo: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})
