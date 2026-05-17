import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Star, Shield, Trophy, X, ArrowRight, Wrench, Package } from 'lucide-react'
import { useState } from 'react'

interface PartnershipPopupProps {
  isOpen: boolean
  onClose: () => void
}

const packages = [
  {
    id: 'starter',
    name: 'Starter Mechanic',
    level: 'Paket D',
    price: 'Rp 299.000',
    color: 'from-slate-600 to-slate-800',
    badgeColor: 'bg-slate-500',
    icon: <Wrench className="w-6 h-6 text-slate-300" />,
    target: 'Cocok untuk mekanik pemula atau freelance kecil',
    features: [
      'Tambal ban & Ganti oli',
      'Aki soak & Tune up ringan',
      'Bisa menerima order basic',
      'Maksimal radius order tertentu'
    ],
    items: ['Rompi & ID Card', 'Toolbox basic', 'Kunci pas & Obeng set', 'Dongkrak kecil']
  },
  {
    id: 'advance',
    name: 'Advance Mechanic',
    level: 'Paket C',
    price: 'Rp 599.000',
    color: 'from-blue-600 to-blue-900',
    badgeColor: 'bg-blue-500',
    icon: <Star className="w-6 h-6 text-blue-300" />,
    target: 'Mekanik menengah yang ingin order lebih banyak',
    features: [
      'Prioritas order lebih tinggi',
      'Servis motor & mobil ringan',
      'Badge "Verified Mechanic"',
      'Troubleshooting & kelistrikan dasar'
    ],
    items: ['Kunci shock & Kunci T', 'Kompresor portable', 'Jumper aki', 'Scanner OBD basic']
  },
  {
    id: 'professional',
    name: 'Professional Mechanic',
    level: 'Paket B',
    price: 'Rp 1.500.000',
    color: 'from-amber-500 to-amber-700',
    badgeColor: 'bg-amber-500',
    icon: <Shield className="w-6 h-6 text-amber-200" />,
    target: 'Untuk mekanik serius full-time di platform',
    features: [
      'Prioritas order premium',
      'Fee aplikasi lebih kecil',
      'Order emergency malam & fleet',
      'Profil tampil lebih atas & Rating boost'
    ],
    items: ['Scanner OBD pro', 'Impact wrench', 'Hydraulic jack', 'Toolset lengkap bengkel']
  },
  {
    id: 'master',
    name: 'Master / Platinum',
    level: 'Paket A',
    price: 'Rp 2jt - 5jt',
    color: 'from-purple-600 to-purple-900',
    badgeColor: 'bg-purple-500',
    icon: <Trophy className="w-6 h-6 text-purple-300" />,
    target: 'Mekanik expert, bengkel partner, tim rescue',
    features: [
      'Order prioritas tertinggi',
      'Terima order premium/high-end car',
      'Asuransi kerja & Bonus bulanan',
      'Bisa rekrut helper & Bagi hasil besar'
    ],
    items: ['Mesin portable mini', 'Scanner ECU advanced', 'Box motor branding', 'Seragam premium & GPS']
  }
]

export default function PartnershipPopup({ isOpen, onClose }: PartnershipPopupProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-700"
          >
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-700 relative shrink-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-4 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-ping" />
                <Package className="w-8 h-8" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Bergabung Menjadi <span className="text-primary">Mitra Go-Montir!</span>
              </h2>
              <p className="text-slate-400 max-w-lg mx-auto text-sm md:text-base">
                Tingkatkan penghasilanmu dan dapatkan fasilitas eksklusif dengan memilih paket kemitraan yang sesuai untukmu.
              </p>
            </div>

            {/* Packages Grid */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative rounded-3xl p-1 cursor-pointer transition-all duration-300 ${
                      selectedPackage === pkg.id 
                        ? 'bg-gradient-to-b from-primary to-primary-dark scale-105 shadow-[0_0_30px_rgba(249,115,22,0.3)]' 
                        : 'bg-slate-700/50 hover:bg-slate-700 hover:-translate-y-1'
                    }`}
                  >
                    <div className="h-full bg-slate-800 rounded-[1.4rem] p-5 flex flex-col relative overflow-hidden">
                      {/* Badge */}
                      <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl font-bold text-[10px] uppercase tracking-wider text-white ${pkg.badgeColor}`}>
                        {pkg.level}
                      </div>

                      <div className="mb-4 pt-2">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center shadow-lg mb-3`}>
                          {pkg.icon}
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">{pkg.name}</h3>
                        <div className="mt-2 text-2xl font-black text-white">
                          {pkg.price}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 font-medium mb-4 min-h-[32px]">
                        {pkg.target}
                      </p>

                      <div className="space-y-4 flex-1">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Benefit Utama</p>
                          <ul className="space-y-2">
                            {pkg.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Termasuk Alat</p>
                          <ul className="space-y-2">
                            {pkg.items.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-700/50">
                        <button 
                          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                            selectedPackage === pkg.id
                              ? 'bg-primary text-white shadow-glow'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          Pilih Paket Ini
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer action */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/80 backdrop-blur-md text-center shrink-0">
              <button 
                onClick={onClose}
                className="text-slate-400 text-sm hover:text-white transition-colors font-medium underline-offset-4 hover:underline"
              >
                Nanti saja, saya ingin melihat dashboard dulu
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
