export interface TroubleEntry {
  id: string
  keywords: string[]
  title: string
  symptom: string
  causes: string[]
  solutions: string[]
  difficulty: 'Mudah' | 'Sedang' | 'Sulit'
  canSelfFix: boolean
  serviceTypeId?: string
  serviceName?: string
}

export const motorcycleKnowledge: TroubleEntry[] = [
  {
    id: 'trouble-1',
    keywords: ['mogok', 'mati', 'macet', 'mesin mati', 'mendadak'],
    title: 'Mesin Mogok / Mati Mendadak',
    symptom: 'Mesin motor tiba-tiba mati saat sedang jalan atau tidak mau menyala sama sekali.',
    causes: [
      'Busi kotor, basah, atau sudah aus (renggang)',
      'Saluran bahan bakar tersumbat atau bensin habis',
      'Kompresi mesin hilang (loss compression)',
      'Filter udara terlalu kotor menyumbat aliran udara',
      'Sistem kelistrikan pengapian (CDI/Coil) bermasalah'
    ],
    solutions: [
      'Periksa indikator bensin di panel instrumen Anda.',
      'Coba buka busi menggunakan kunci busi, bersihkan ujungnya dari kerak hitam memakai sikat kawat/amplas, lalu pasang kembali.',
      'Bila kompresi hilang (kick starter terasa sangat ringan saat diengkol), masukkan sedikit oli mesin (sekitar 1 sendok teh) melalui lubang busi, pasang busi kembali, lalu engkol berkali-kali.',
      'Periksa apakah sekring (fuse) utama motor putus.'
    ],
    difficulty: 'Sedang',
    canSelfFix: true,
    serviceTypeId: 'service-3',
    serviceName: 'Servis Mesin Ringan'
  },
  {
    id: 'trouble-2',
    keywords: ['aki', 'soak', 'starter', 'double starter', 'cetek', 'mati total', 'klakson redup'],
    title: 'Aki Soak / Starter Tidak Berfungsi',
    symptom: 'Motor tidak bisa di-starter menggunakan tombol (double starter), suara klakson sangat pelan/redup, dan lampu speedometer redup.',
    causes: [
      'Tegangan aki (battery) sudah di bawah 12 Volt (soak)',
      'Konektor/kabel kutub aki kendur atau berkarat',
      'Dinamo starter bermasalah atau arang starter habis',
      'Sistem pengisian aki (kiprok/rectifier) rusak'
    ],
    solutions: [
      'Gunakan starter manual (kick starter/engkol) untuk menyalakan mesin.',
      'Buka penutup aki, periksa kabel kutub (+) dan (-) apakah kendur. Kencangkan jika longgar dan bersihkan kerak putih jika ada.',
      'Jika mesin bisa menyala dengan kick starter, biarkan mesin menyala sekitar 10-15 menit untuk mengisi ulang daya aki.',
      'Jika aki sudah berumur lebih dari 2 tahun, kemungkinan besar aki harus diganti baru.'
    ],
    difficulty: 'Mudah',
    canSelfFix: true,
    serviceTypeId: 'service-3',
    serviceName: 'Servis Mesin Ringan'
  },
  {
    id: 'trouble-3',
    keywords: ['ban', 'bocor', 'kempes', 'paku', 'gembos', 'bocor halus'],
    title: 'Ban Bocor / Kempes',
    symptom: 'Ban terasa oleng saat berkendara, kempes, atau terlihat ada paku/benda tajam menancap.',
    causes: [
      'Tertusuk paku, kawat, atau batu tajam',
      'Pentil ban bocor halus atau kendur',
      'Ban sudah terlalu tipis/aus sehingga mudah bocor'
    ],
    solutions: [
      'Jangan memaksakan berkendara dengan ban kempes karena dapat merusak velg dan membahayakan keselamatan.',
      'Tepikan motor ke tempat yang aman dan rata.',
      'Periksa permukaan ban untuk menemukan benda tajam yang menancap. Jangan mencabut paku jika Anda tidak memiliki alat tambal darurat karena udara akan langsung habis.'
    ],
    difficulty: 'Sulit',
    canSelfFix: false,
    serviceTypeId: 'service-1',
    serviceName: 'Tambal Ban (Motor)'
  },
  {
    id: 'trouble-4',
    keywords: ['rem', 'blong', 'pakem', 'meleset', 'bunyi decit', 'rem bunyi', 'kampas'],
    title: 'Rem Blong / Kurang Pakem',
    symptom: 'Tuas rem terasa sangat dalam saat ditekan, rem tidak mencengkeram dengan baik, atau timbul bunyi berdecit keras saat mengerem.',
    causes: [
      'Kampas rem (brake pads) sudah tipis atau habis',
      'Ada angin palsu masuk ke dalam sistem hidrolik rem (rem cakram)',
      'Minyak rem habis atau terjadi kebocoran pada selang rem',
      'Piringan cakram kotor terkena oli atau pelumas'
    ],
    solutions: [
      'Periksa ketebalan kampas rem secara visual.',
      'Periksa minyak rem pada tabung reservoir di stang motor, pastikan volumenya cukup.',
      'Bersihkan piringan cakram menggunakan cairan pembersih khusus rem (brake cleaner) atau sabun cuci piring untuk menghilangkan minyak/oli.',
      '**PERINGATAN:** Berkendara dengan rem blong sangat berbahaya! Segera panggil bantuan profesional.'
    ],
    difficulty: 'Sulit',
    canSelfFix: false,
    serviceTypeId: 'service-3',
    serviceName: 'Servis Mesin Ringan'
  },
  {
    id: 'trouble-5',
    keywords: ['panas', 'overheat', 'air radiator', 'radiator', 'mesin panas', 'mati sendiri'],
    title: 'Mesin Panas / Overheat',
    symptom: 'Indikator suhu di speedometer menyala merah, performa mesin tiba-tiba drop, atau tercium bau sangit dan mesin mati sendiri saat panas.',
    causes: [
      'Air radiator (coolant) habis atau bocor',
      'Kipas radiator tidak berputar/mati',
      'Oli mesin habis atau tidak bersirkulasi dengan baik',
      'Thermostat macet dalam posisi tertutup'
    ],
    solutions: [
      'Segera tepikan motor dan matikan mesin. Biarkan mesin dingin selama minimal 20-30 menit.',
      '**JANGAN** membuka tutup radiator saat mesin masih sangat panas karena air panas bertekanan bisa menyembur keluar.',
      'Setelah mesin dingin, periksa ketinggian air cadangan radiator (coolant reservoir) dan oli mesin lewat dipstick.',
      'Jika air radiator habis, isi kembali menggunakan air radiator coolant khusus.'
    ],
    difficulty: 'Sedang',
    canSelfFix: true,
    serviceTypeId: 'service-3',
    serviceName: 'Servis Mesin Ringan'
  }
]
