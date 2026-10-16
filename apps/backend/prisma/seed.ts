import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  { name: 'Wireless Mouse', price: 24.99, stock: 85 },
  { name: 'Gaming Keyboard', price: 79.99, stock: 42 },
  { name: 'USB-C Cable', price: 9.99, stock: 150 },
  { name: 'Laptop Stand', price: 34.99, stock: 37 },
  { name: 'Wireless Keyboard', price: 49.99, stock: 56 },
  { name: 'Gaming Mouse Pad', price: 19.99, stock: 92 },
  { name: 'USB Hub 4-Port', price: 18.50, stock: 64 },
  { name: 'USB-C Hub 7-in-1', price: 45.99, stock: 31 },
  { name: 'Laptop Cooling Pad', price: 29.99, stock: 28 },
  { name: 'Webcam Full HD', price: 59.99, stock: 40 },
  { name: 'Wireless Presenter', price: 27.99, stock: 23 },
  { name: 'Bluetooth Adapter', price: 12.99, stock: 77 },
  { name: 'HDMI Cable 2m', price: 8.99, stock: 130 },
  { name: 'DisplayPort Cable', price: 14.99, stock: 68 },
  { name: 'Laptop Sleeve 15-inch', price: 22.99, stock: 49 },
  { name: 'Mechanical Keyboard', price: 99.99, stock: 25 },
  { name: 'Ergonomic Mouse', price: 39.99, stock: 44 },
  { name: 'USB Flash Drive 64GB', price: 12.50, stock: 115 },
  { name: 'External SSD 1TB', price: 109.99, stock: 19 },
  { name: 'External Hard Drive 2TB', price: 89.99, stock: 22 },
  { name: 'Wireless Headphones', price: 69.99, stock: 35 },
  { name: 'Bluetooth Earbuds', price: 39.99, stock: 70 },
  { name: 'Gaming Headset', price: 64.99, stock: 32 },
  { name: 'USB Condenser Microphone', price: 79.99, stock: 18 },
  { name: 'Bluetooth Speaker', price: 44.99, stock: 47 },
  { name: 'Portable Mini Speaker', price: 24.99, stock: 61 },
  { name: 'Studio Headphones', price: 119.99, stock: 14 },
  { name: 'Soundbar', price: 149.99, stock: 12 },
  { name: 'USB Desktop Speakers', price: 34.99, stock: 29 },
  { name: 'Wireless Lavalier Microphone', price: 49.99, stock: 21 },
  { name: '16GB DDR4 RAM', price: 39.99, stock: 33 },
  { name: '32GB DDR5 RAM Kit', price: 99.99, stock: 17 },
  { name: '1TB NVMe SSD', price: 74.99, stock: 26 },
  { name: '2TB NVMe SSD', price: 139.99, stock: 13 },
  { name: '650W Power Supply', price: 79.99, stock: 16 },
  { name: 'PC Case Mid Tower', price: 89.99, stock: 11 },
  { name: 'CPU Air Cooler', price: 42.99, stock: 24 },
  { name: '120mm Case Fan', price: 14.99, stock: 80 },
  { name: 'PCIe Wi-Fi Adapter', price: 29.99, stock: 36 },
  { name: 'Graphics Card Support Bracket', price: 15.99, stock: 43 },
  { name: 'Fast USB-C Charger 30W', price: 19.99, stock: 90 },
  { name: 'Fast USB-C Charger 65W', price: 39.99, stock: 45 },
  { name: 'Wireless Charger Stand', price: 24.99, stock: 58 },
  { name: 'Phone Case MagSafe', price: 29.99, stock: 73 },
  { name: 'Phone Stand Aluminum', price: 18.99, stock: 88 },
  { name: 'Car Mount Wireless Charger', price: 34.99, stock: 34 },
  { name: 'Screen Protector Tempered Glass', price: 9.99, stock: 200 },
  { name: 'USB-C to Lightning Cable', price: 14.99, stock: 120 },
  { name: 'Portable Power Bank 20000mAh', price: 49.99, stock: 38 },
  { name: 'Bluetooth Tracker Tag', price: 24.99, stock: 65 },
];

async function main() {
  console.log('🌱 Seeding database...');

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: product,
      });
    } else {
      await prisma.product.create({
        data: product,
      });
    }
  }

  console.log(`✅ Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });