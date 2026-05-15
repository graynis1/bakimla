const BASE = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;background:#fffdf7;border:1px solid #e8e0d0;border-radius:16px;overflow:hidden">
    <div style="background:#1a1a1a;padding:24px 32px;text-align:center">
      <span style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:-0.5px">Bakımla</span>
    </div>
    <div style="padding:32px">
      {{BODY}}
    </div>
    <div style="padding:16px 32px;background:#f5f0e8;border-top:1px solid #e8e0d0;font-size:12px;color:#9ca3af;text-align:center">
      Bu e-posta Bakımla platformu tarafından gönderilmiştir. © 2025 Bakımla
    </div>
  </div>
`

function wrap(body: string) {
  return BASE.replace('{{BODY}}', body)
}

export function appointmentConfirmedCustomer(data: {
  customerName: string
  businessName: string
  serviceName: string
  employeeName: string
  date: string
  time: string
}) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Randevunuz Onaylandı ✓</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba ${data.customerName}, randevunuz başarıyla onaylandı.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">İşletme</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.businessName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.serviceName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Uzman</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.employeeName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.date}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.time}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#6b7280">Randevunuzu iptal etmek veya değiştirmek için lütfen işletmeyle iletişime geçin.</p>
  `)
}

export function appointmentCancelledCustomer(data: {
  customerName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  reason?: string
}) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#b42318;margin:0 0 8px">Randevunuz İptal Edildi</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba ${data.customerName}, randevunuz maalesef iptal edildi.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">İşletme</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.businessName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.serviceName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.date}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.time}</td></tr>
        ${data.reason ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Neden</td><td style="padding:8px 0;font-size:13px;color:#b42318">${data.reason}</td></tr>` : ''}
      </table>
    </div>
    <p style="font-size:13px;color:#6b7280">Yeni randevu almak için <a href="${process.env.NEXTAUTH_URL}/search" style="color:#c9a84c;font-weight:700">Bakımla</a>'yı ziyaret edebilirsiniz.</p>
  `)
}

export function newAppointmentSalon(data: {
  businessName: string
  customerName: string
  customerPhone?: string
  serviceName: string
  employeeName: string
  date: string
  time: string
}) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Yeni Randevu Talebi</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">${data.businessName} için yeni bir randevu talebi geldi.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">Müşteri</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.customerName}</td></tr>
        ${data.customerPhone ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Telefon</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.customerPhone}</td></tr>` : ''}
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.serviceName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Uzman</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.employeeName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.date}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.time}</td></tr>
      </table>
    </div>
    <a href="${process.env.NEXTAUTH_URL}/salon/calendar" style="display:inline-block;background:#1a1a1a;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Takvimi Görüntüle</a>
  `)
}

export function appointmentReminder(data: {
  customerName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  address: string
}) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Randevu Hatırlatması</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba ${data.customerName}, randevunuz yaklaşıyor!</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">İşletme</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.businessName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Hizmet</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.serviceName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tarih</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.date}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Saat</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.time}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Adres</td><td style="padding:8px 0;font-size:13px;color:#1a1a1a">${data.address}</td></tr>
      </table>
    </div>
  `)
}

export function paymentApproved(data: {
  businessName: string
  planName: string
  amount: string
  validUntil: string
}) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#15803d;margin:0 0 8px">Ödemeniz Onaylandı ✓</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">${data.businessName} için abonelik ödemesi onaylandı.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">Plan</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.planName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tutar</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.amount}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Geçerlilik</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.validUntil} tarihine kadar</td></tr>
      </table>
    </div>
    <a href="${process.env.NEXTAUTH_URL}/salon/dashboard" style="display:inline-block;background:#1a1a1a;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Panele Git</a>
  `)
}

export function paymentRejected(data: {
  businessName: string
  planName: string
  amount: string
  reason?: string
}) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#b42318;margin:0 0 8px">Ödemeniz Reddedildi</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">${data.businessName} için abonelik ödemesi reddedildi.</p>
    <div style="background:white;border:1px solid #e8e0d0;border-radius:12px;padding:20px;margin-bottom:24px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280;width:40%">Plan</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.planName}</td></tr>
        <tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Tutar</td><td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a">${data.amount}</td></tr>
        ${data.reason ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280">Neden</td><td style="padding:8px 0;font-size:13px;color:#b42318">${data.reason}</td></tr>` : ''}
      </table>
    </div>
    <a href="${process.env.NEXTAUTH_URL}/salon/subscription" style="display:inline-block;background:#b42318;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Tekrar Dene</a>
  `)
}

export function welcomeEmail(data: { name: string; role: 'CUSTOMER' | 'SALON_OWNER' }) {
  const isOwner = data.role === 'SALON_OWNER'
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Hoş Geldiniz, ${data.name}!</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Bakımla ailesine katıldığınız için teşekkürler.</p>
    ${isOwner
      ? `<p style="font-size:14px;color:#1a1a1a;margin-bottom:24px">İşletme panelinizi oluşturmak ve randevu almaya başlamak için aşağıdaki bağlantıyı kullanabilirsiniz.</p>
         <a href="${process.env.NEXTAUTH_URL}/salon/dashboard" style="display:inline-block;background:#c9a84c;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Panelime Git</a>`
      : `<p style="font-size:14px;color:#1a1a1a;margin-bottom:24px">Size en yakın kuaförü, güzellik merkezini ve daha fazlasını keşfetmek için hemen aramaya başlayın.</p>
         <a href="${process.env.NEXTAUTH_URL}/search" style="display:inline-block;background:#c9a84c;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Keşfet</a>`
    }
  `)
}

export function passwordResetEmail(data: { name: string; resetUrl: string }) {
  return wrap(`
    <h2 style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 8px">Şifre Sıfırlama</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px">Merhaba ${data.name}, şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
    <a href="${data.resetUrl}" style="display:inline-block;background:#1a1a1a;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none">Şifremi Sıfırla</a>
    <p style="font-size:12px;color:#9ca3af;margin-top:24px">Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı dikkate almayınız.</p>
  `)
}
