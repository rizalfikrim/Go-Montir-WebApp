import { PrismaClient, Role, MechanicStatus, VehicleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Hash password default
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Buat Service Types (Layanan)
  console.log('Creating service types...');
  await prisma.serviceType.upsert({
    where: { id: 'service-1' },
    update: {},
    create: {
      id: 'service-1',
      name: 'Tambal Ban (Motor)',
      description: 'Layanan tambal ban untuk sepeda motor di lokasi.',
      basePrice: 25000,
      estimatedTime: 30,
    }
  });
  
  await prisma.serviceType.upsert({
    where: { id: 'service-2' },
    update: {},
    create: {
      id: 'service-2',
      name: 'Ganti Aki (Mobil)',
      description: 'Pemasangan aki baru untuk mobil Anda.',
      basePrice: 150000,
      estimatedTime: 45,
    }
  });

  await prisma.serviceType.upsert({
    where: { id: 'service-3' },
    update: {},
    create: {
      id: 'service-3',
      name: 'Servis Mesin Ringan',
      description: 'Pengecekan dan perbaikan ringan pada mesin.',
      basePrice: 100000,
      estimatedTime: 60,
    }
  });

  // 3. Buat Subscription Packages
  console.log('Creating subscription packages...');
  await prisma.subscriptionPackage.upsert({
    where: { id: 'pkg-starter' },
    update: {},
    create: {
      id: 'pkg-starter',
      name: 'Starter Mechanic',
      description: 'Paket untuk mekanik baru.',
      price: 50000,
      durationDay: 30,
      benefits: ['Prioritas Menengah', 'Laporan Mingguan'],
    }
  });

  await prisma.subscriptionPackage.upsert({
    where: { id: 'pkg-pro' },
    update: {},
    create: {
      id: 'pkg-pro',
      name: 'Professional Mechanic',
      description: 'Paket untuk mekanik ahli dengan banyak pesanan.',
      price: 150000,
      durationDay: 30,
      benefits: ['Prioritas Tinggi', 'Laporan Harian', 'Badge Pro'],
    }
  });

  // 4. Buat Admin
  console.log('Creating admin...');
  await prisma.user.upsert({
    where: { email: 'admin@gomontir.com' },
    update: {},
    create: {
      email: 'admin@gomontir.com',
      name: 'Super Admin',
      password: hashedPassword,
      phone: '081111111111',
      role: Role.ADMIN,
      isVerified: true,
    }
  });

  // 5. Buat Mekanik & Profilnya
  console.log('Creating mechanics...');
  await prisma.user.upsert({
    where: { email: 'mekanik1@gmail.com' },
    update: {},
    create: {
      email: 'mekanik1@gmail.com',
      name: 'Budi Mekanik',
      password: hashedPassword,
      phone: '082222222222',
      role: Role.MECHANIC,
      isVerified: true,
      mechanic: {
        create: {
          bio: 'Ahli spesialis ban dan mesin motor.',
          specializations: ['Ban', 'Mesin'],
          status: MechanicStatus.ACTIVE,
          isOnline: true,
          rating: 4.8,
          lastLatitude: -6.2088,
          lastLongitude: 106.8456,
        }
      }
    }
  });

  // 6. Buat User Biasa & Kendaraannya
  console.log('Creating regular user...');
  await prisma.user.upsert({
    where: { email: 'user1@gmail.com' },
    update: {},
    create: {
      email: 'user1@gmail.com',
      name: 'Rizky Pelanggan',
      password: hashedPassword,
      phone: '083333333333',
      role: Role.USER,
      isVerified: true,
      vehicles: {
        create: {
          brand: 'Honda',
          model: 'Vario 150',
          year: 2022,
          type: VehicleType.MOTOR,
          plateNumber: 'B 1234 ABC',
          isDefault: true,
        }
      }
    }
  });

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
