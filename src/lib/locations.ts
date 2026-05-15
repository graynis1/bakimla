export const cityList = [
  'Adana', 'Ankara', 'Antalya', 'Bursa', 'Diyarbakır', 'Eskişehir',
  'Gaziantep', 'İstanbul', 'İzmir', 'Kayseri', 'Konya', 'Mersin',
  'Samsun', 'Trabzon',
]

const districtMap: Record<string, string[]> = {
  İstanbul: [
    'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
    'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
    'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
    'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kâğıthane',
    'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
    'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
    'Ümraniye', 'Üsküdar', 'Zeytinburnu', 'Mecidiyeköy',
  ],
  Ankara: [
    'Altındağ', 'Çankaya', 'Etimesgut', 'Gölbaşı', 'Keçiören', 'Kızılcahamam',
    'Mamak', 'Polatlı', 'Pursaklar', 'Sincan', 'Yenimahalle',
  ],
  İzmir: [
    'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Bornova', 'Buca',
    'Çiğli', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karşıyaka',
    'Kemalpaşa', 'Konak', 'Menderes', 'Narlıdere', 'Torbalı', 'Urla',
  ],
  Bursa: ['Gemlik', 'Gürsu', 'İnegöl', 'Mudanya', 'Nilüfer', 'Osmangazi', 'Yıldırım'],
  Antalya: ['Aksu', 'Alanya', 'Döşemealtı', 'Kemer', 'Kepez', 'Konyaaltı', 'Manavgat', 'Muratpaşa'],
  Adana: ['Çukurova', 'Seyhan', 'Yüreğir'],
  Gaziantep: ['Nizip', 'Oğuzeli', 'Şahinbey', 'Şehitkâmil'],
  Konya: ['Beyşehir', 'Karatay', 'Meram', 'Selçuklu'],
  Kayseri: ['Kocasinan', 'Melikgazi', 'Talas'],
  Mersin: ['Akdeniz', 'Erdemli', 'Mezitli', 'Tarsus', 'Toroslar', 'Yenişehir'],
  Diyarbakır: ['Bağlar', 'Kayapınar', 'Sur', 'Yenişehir'],
  Eskişehir: ['Odunpazarı', 'Tepebaşı'],
  Samsun: ['Atakum', 'Canik', 'İlkadım', 'Tekkeköy'],
  Trabzon: ['Akçaabat', 'Araklı', 'Ortahisar'],
}

export function getDistricts(city: string): string[] {
  return districtMap[city] ?? []
}
