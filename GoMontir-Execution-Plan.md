# Dokumen Perencanaan Eksekusi Proyek: GoMontir

**Versi:** 1.0
**Status:** Siap Eksekusi
**Arsitek Sistem:** AI Design Specialist
**Target Platform:** Web-based (PWA), Admin Dashboard, Mechanic Portal

---

## 1. Visi UI/UX: Segar, Modern, & Trendy
Aplikasi harus memiliki kesan *high-tech* namun tetap *user-friendly* bagi pengguna yang sedang panik.
* **Warna Dasar:** *Deep Slate Blue* (#1E293B) untuk kesan profesional, dipadukan dengan *Vibrant Orange* (#F97316) sebagai warna aksi (montir/darurat).
* **Tipografi:** Menggunakan font Sans-serif modern (seperti Inter atau Montserrat) dengan bobot *Bold* pada elemen kunci.
* **Gaya Visual:**
    * **Bento Grid Layout:** Untuk dasbor admin dan montir guna menyajikan informasi secara modular dan bersih.
    * **Glassmorphism:** Efek transparansi pada kartu notifikasi untuk kesan futuristik.
    * **Micro-interactions:** Animasi halus saat transisi antar status (misal: ikon kunci inggris yang berputar saat montir dalam perjalanan).
    * **Dark Mode First:** Prioritas tampilan gelap yang nyaman di mata, terutama untuk penggunaan malam hari di jalan.

---

## 2. Spesifikasi Tech Stack
Integrasi teknologi yang dipilih untuk memastikan keamanan, kecepatan, dan kemudahan skalabilitas.

* **Frontend:** React.js (Vite) + Tailwind CSS + Lucide Icons (untuk ikon yang konsisten).
* **Backend:** Express.js (Node.js).
* **ORM:** Prisma ORM.
* **Database:** PostgreSQL (Mendukung data spasial/lokasi lebih baik melalui PostGIS).
* **Authentication:** JWT (JSON Web Token) dengan strategi *Access & Refresh Token* via *HttpOnly Cookies*.
* **Real-time:** Socket.io (Untuk tracking lokasi montir hidup/live).
* **Deployment:** Docker + Nginx + Ubuntu Server.

---

## 3. Arsitektur Basis Data (Prisma Schema)
Entitas utama yang harus tersedia dalam sistem:

1.  **User:** ID, Email, Password (Hashed), Name, Phone, Role (USER, MECHANIC, ADMIN).
2.  **MechanicProfile:** ID, UserID, Keahlian, Status (Active/Inactive), LokasiTerakhir (Point), Rating.
3.  **SubscriptionPackage:** ID, NamaPaket, Harga, Durasi, Benefit (Untuk mitra montir).
4.  **Order:** ID, UserID, MechanicID, Status (PENDING, OTW, PROCESS, COMPLETED), LokasiUser, TotalBiaya.

---

## 4. Rencana Tahapan Eksekusi (Milestones)

### Fase 1: Fondasi & Backend (Minggu 1-2)
* Setup Project (Express + Prisma + TypeScript).
* Implemetasi JWT Authentication & Role-based Access Control (RBAC).
* Pembuatan API CRUD untuk Manajemen User & Paket Berlangganan Montir.
* Integrasi Database Schema.

### Fase 2: Fitur Utama & Real-time (Minggu 3-4)
* Integrasi Socket.io untuk komunikasi dua arah.
* Implementasi logika "Cari Montir Terdekat" berbasis radius (Geospatial Query).
* Sistem Order State Machine (Alur pesanan dari masuk hingga selesai).
* Integrasi Payment Gateway (untuk beli paket & bayar jasa).

### Fase 3: Frontend PWA & UI/UX (Minggu 5-6)
* Slicing UI dari desain (React + Tailwind).
* Implementasi Google Maps API/Mapbox untuk visualisasi lokasi.
* Transformasi Web ke PWA agar bisa "Install to Home Screen".
* Optimasi performa (Lighthouse Score > 90).

### Fase 4: QA & Deployment (Minggu 7)
* Unit Testing & Integrasi Testing.
* Setup Docker & Nginx di Server.
* Final Security Audit.

---

## 5. Catatan Penting (Noted for Success)
* **Location Privacy:** Pastikan akses GPS hanya diminta saat aplikasi aktif atau saat user mencari montir untuk menjaga privasi.
* **Offline Support:** Gunakan Service Workers agar user tetap bisa melihat nomor kontak montir meski sinyal tidak stabil di tengah jalan.
* **Scalability:** Walaupun menggunakan satu server Express, pastikan logika *Tracking* dibuat dalam modul terpisah agar jika trafik membludak, modul tersebut mudah dipindah ke Microservice.
* **Modern Touch:** Gunakan *Skeleton Screen* saat data sedang dimuat daripada *Loading Spinner* tradisional agar aplikasi terasa lebih cepat.

---
*Dokumen ini dirancang untuk segera dieksekusi oleh tim pengembang tanpa ambiguitas.*
