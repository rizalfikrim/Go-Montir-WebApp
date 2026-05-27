import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MapPin, Navigation, Star, ChevronLeft, Loader2, Wrench, Car, Info, Zap, CheckCircle2 } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation as SwiperNavigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import { mechanicApi, orderApi, serviceApi, userApi } from '@/services'
import toast from 'react-hot-toast'
import Map from '@/components/common/Map'

export default function SearchMechanicPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [vehicleFilter, setVehicleFilter] = useState<'MOTOR' | 'MOBIL' | ''>('')
  const [selectedMechanic, setSelectedMechanic] = useState<any>(null)
  const [selectedService, setSelectedService] = useState<string>(state?.serviceTypeId || '')
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')

  const [description, setDescription] = useState('')
  const [coords, setCoords] = useState<[number, number]>([state?.lat || -6.2, state?.lon || 106.8])
  const [address, setAddress] = useState(state?.address || 'Lokasi Terdeteksi')

  // Ambil lokasi user secara real-time saat halaman dibuka jika tidak dari home
  useEffect(() => {
    if (!state?.lat && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude])
        },
        () => {
          console.log('GPS denied or failed, using default')
        }
      )
    }
  }, [state])

  // Queries
  const { data: mechanics, isLoading: loadingMechanics } = useQuery({
    queryKey: ['nearby-mechanics', coords[0], coords[1]],
    queryFn: () => mechanicApi.getNearby(coords[0], coords[1]).then(r => r.data.data),
    enabled: true,
  })

  const { data: services } = useQuery({
    queryKey: ['services', vehicleFilter],
    queryFn: () => serviceApi.getAll(vehicleFilter).then(r => r.data.data),
  })

  const filteredServices = (services ?? []).filter((svc: any) =>
    vehicleFilter === '' || svc.vehicleType === vehicleFilter
  )

  const { data: vehicles } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => userApi.getVehicles().then(r => r.data.data),
  })

  // Reset selected service if it's no longer in the filtered services list
  useEffect(() => {
    if (services && selectedService) {
      const exists = services.some((s: any) => s.id === selectedService)
      if (!exists) setSelectedService('')
    }
  }, [services, selectedService])

  // Mutation
  const createOrder = useMutation({
    mutationFn: (data: any) => orderApi.create(data),
    onSuccess: (res) => {
      toast.success('Pesanan berhasil dibuat! Mencari montir...')
      navigate(`/order/${res.data.data.id}`)
    },
  })

  const handleConfirmOrder = () => {
    if (!selectedService) return toast.error('Pilih jenis layanan.')
    if (!selectedVehicle.trim()) return toast.error('Masukkan nama kendaraan Anda.')
    if (!selectedMechanic) return toast.error('Pilih montir yang ingin Anda pesan.')

    createOrder.mutate({
      serviceTypeId: selectedService,
      vehicleName: selectedVehicle,
      mechanicId: selectedMechanic.id,
      description,
      userLatitude: coords[0],
      userLongitude: coords[1],
      userAddress: address,
    })
  }

  return (
    <div className="min-h-full bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Cari Montir</h1>
      </div>

      {/* Map Picker */}
      <div className="h-72 relative">
        <Map 
          center={coords} 
          zoom={16}
          onCenterChange={(lat, lon) => setCoords([lat, lon])}
          className="h-full w-full rounded-none"
        />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="relative -top-4">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
            <MapPin className="text-primary w-10 h-10 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-30 card-glass p-3 py-2 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-slate-200 truncate">{address}</span>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8 animate-fade-in">
        {/* Step 1: Services */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-white">Pilih Layanan</h2>
            </div>
            
            {/* Filter Tipe Kendaraan */}
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setVehicleFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vehicleFilter === ''
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('MOTOR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vehicleFilter === 'MOTOR'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Motor
              </button>
              <button
                type="button"
                onClick={() => setVehicleFilter('MOBIL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vehicleFilter === 'MOBIL'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mobil
              </button>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {services?.length > 0 ? (
              services.map((svc: any) => (
                <button
                  key={svc.id}
                  onClick={() => setSelectedService(svc.id)}
                  className={`flex-shrink-0 p-4 rounded-2xl border-2 transition-all duration-200 text-left w-36 ${
                    selectedService === svc.id
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{svc.iconUrl || '🔧'}</div>
                  <p className="font-bold text-sm text-white line-clamp-1">{svc.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      svc.vehicleType === 'MOBIL' 
                        ? 'bg-info/10 text-info border border-info/20' 
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {svc.vehicleType || 'MOTOR'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-semibold">Mulai Rp {svc.basePrice.toLocaleString('id-ID')}</p>
                </button>
              ))
            ) : (
              <div className="w-full text-center py-4 text-xs text-slate-500">
                Tidak ada layanan yang ditemukan.
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Vehicle Name */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-white">Nama Kendaraan</h2>
          </div>
          <div className="relative">
            <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              placeholder="Contoh: Honda Vario Hitam (B 1234 ABC)"
              className="input pl-10"
              id="vehicle-input"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">* Masukkan merk, tipe, atau plat nomor kendaraan Anda.</p>
        </section>

        {/* Step 3: Description */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-white">Detail Masalah</h2>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Ban belakang bocor kena paku, lokasi di depan Alfamart..."
            className="input min-h-[120px] resize-none"
          />
        </section>

        {/* Mechanic Carousel */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-white">Montir Terdekat</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">{mechanics?.length || 0} Tersedia</span>
          </div>

          {loadingMechanics ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : (
            <Swiper
              modules={[SwiperNavigation]}
              navigation
              slidesPerView={3}
              spaceBetween={16}
              className="mySwiper"
            >
              {mechanics?.length > 0 ? (
                mechanics.map((m: any) => (
                  <SwiperSlide key={m.id}>
                    <button
                      onClick={() => setSelectedMechanic(m)}
                      className={`w-full p-4 flex flex-col items-center gap-4 text-center transition-all rounded-2xl border-2 ${selectedMechanic?.id === m.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-slate-800 bg-slate-800/50 hover:border-slate-700'}`}
                    >
                      <div className="w-64 h-64 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 mb-2 relative">
                        {m.user.avatarUrl ? (
                          <img src={m.user.avatarUrl} alt={m.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary font-bold text-xl">
                            {m.user.name.charAt(0)}
                          </div>
                        )}
                        {selectedMechanic?.id === m.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="text-white w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-center">
                        <p className="font-bold text-white text-lg mt-2">{m.user.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-warning">
                            <Star className="w-3 h-3 fill-current" />
                            {m.rating.toFixed(1)}
                          </div>
                          <span className="text-slate-600">•</span>
                          <div className="flex items-center gap-1 text-primary">
                            <MapPin className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{m.distanceKm.toFixed(1)} KM</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="px-2 py-1 rounded-lg bg-success/10 border border-success/20">
                          <span className="text-[10px] font-bold text-success uppercase tracking-wider">Tersedia</span>
                        </div>
                      </div>
                    </button>
                  </SwiperSlide>
                ))
              ) : (
                <div className="w-full p-8 rounded-2xl bg-danger/5 border border-danger/10 text-center">
                  <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-slate-300">Wah, belum ada montir di sekitarmu.</p>
                  <p className="text-xs text-slate-500 mt-1">Coba perluas pencarian atau tunggu sebentar.</p>
                </div>
              )}
            </Swiper>
          )}
          
          {/* Cancel selection button */}
          {selectedMechanic && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setSelectedMechanic(null)}
                className="btn-ghost text-sm text-slate-400 hover:text-slate-200"
              >
                Batal Pilih Montir
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-20 left-0 right-0 p-4 z-[100]">
        <div className="max-w-lg mx-auto">
          {!selectedMechanic && (
            <div className="mb-3 text-center animate-bounce">
              <span className="px-4 py-2 bg-warning text-slate-900 text-[10px] font-black rounded-full shadow-xl uppercase tracking-widest">
                👇 Silakan pilih montir di atas
              </span>
            </div>
          )}
          <button
            id="confirm-order-btn"
            onClick={handleConfirmOrder}
            disabled={createOrder.isPending}
            className={`w-full py-4 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex items-center justify-center gap-3 text-lg font-black transition-all ${
              selectedMechanic 
                ? 'bg-primary text-white shadow-primary/40 hover:scale-[1.02] active:scale-95' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {createOrder.isPending ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] opacity-70 uppercase tracking-widest font-bold">Total Estimasi</span>
                  <span>Rp {services?.find((s: any) => s.id === selectedService)?.basePrice.toLocaleString('id-ID') || '0'}</span>
                </div>
                <div className="w-px h-8 bg-white/20 mx-2" />
                <Zap className={`w-5 h-5 ${selectedMechanic ? 'fill-current' : ''}`} />
                {selectedMechanic ? 'PESAN SEKARANG' : 'PILIH MONTIR'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
