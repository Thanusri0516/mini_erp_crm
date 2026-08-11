import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset database before seeding to guarantee idempotency
  await prisma.stockLog.deleteMany({});
  await prisma.challanItem.deleteMany({});
  await prisma.challan.deleteMany({});
  await prisma.followUpNote.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const salesPassword = await bcrypt.hash('sales123', 10);
  const warehousePassword = await bcrypt.hash('warehouse123', 10);
  const accountsPassword = await bcrypt.hash('accounts123', 10);

  // 1. Create Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { username: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User (Email)',
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.upsert({
    where: { username: 'sales' },
    update: {},
    create: {
      username: 'sales',
      password: salesPassword,
      name: 'Sales Manager',
      role: 'SALES',
    },
  });

  await prisma.user.upsert({
    where: { username: 'sales@example.com' },
    update: {},
    create: {
      username: 'sales@example.com',
      password: salesPassword,
      name: 'Sales Manager (Email)',
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.upsert({
    where: { username: 'warehouse' },
    update: {},
    create: {
      username: 'warehouse',
      password: warehousePassword,
      name: 'Warehouse Keeper',
      role: 'WAREHOUSE',
    },
  });

  await prisma.user.upsert({
    where: { username: 'warehouse@example.com' },
    update: {},
    create: {
      username: 'warehouse@example.com',
      password: warehousePassword,
      name: 'Warehouse Keeper (Email)',
      role: 'WAREHOUSE',
    },
  });

  const accounts = await prisma.user.upsert({
    where: { username: 'accounts' },
    update: {},
    create: {
      username: 'accounts',
      password: accountsPassword,
      name: 'Accounts Executive',
      role: 'ACCOUNTS',
    },
  });

  await prisma.user.upsert({
    where: { username: 'accounts@example.com' },
    update: {},
    create: {
      username: 'accounts@example.com',
      password: accountsPassword,
      name: 'Accounts Executive (Email)',
      role: 'ACCOUNTS',
    },
  });

  console.log('Users seeded successfully!');

  // 2. Create Customers
  const customerData = [
    {
      name: 'Alice Johnson',
      mobile: '9876543210',
      email: 'alice@retailcorp.com',
      businessName: 'Retail Corp Inc.',
      gstNumber: '29ABCDE1234F1Z5',
      type: 'RETAIL',
      address: '123 Main St, Bangalore, India',
      status: 'ACTIVE',
      notes: 'Prefers weekly updates on stock availability.',
    },
    {
      name: 'Bob Smith',
      mobile: '8765432109',
      email: 'bob@wholesaledirect.com',
      businessName: 'Wholesale Direct Ltd',
      gstNumber: '27GHIJK5678L2Z6',
      type: 'WHOLESALE',
      address: '456 industrial Area, Mumbai, India',
      status: 'ACTIVE',
      notes: 'Bulk discount contracts signed.',
    },
    {
      name: 'Charlie Brown',
      mobile: '7654321098',
      email: 'charlie@distributors.com',
      businessName: 'Apex Distribution Hub',
      gstNumber: '',
      type: 'DISTRIBUTOR',
      address: '789 Logistics Way, Chennai, India',
      status: 'LEAD',
      notes: 'Initial contact made. Review follow-up next week.',
    },
  ];

  for (const cust of customerData) {
    await prisma.customer.create({
      data: {
        ...cust,
        followUpNotes: {
          create: {
            note: 'Account initialized in CRM',
            createdById: admin.id,
          },
        },
      },
    });
  }
  console.log('Customers seeded successfully!');

  // 3. Create Products
  const products = [
    {
      name: 'Ultra Book Pro X',
      sku: 'SKU-UBP-001',
      category: 'Electronics',
      unitPrice: 75000.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Warehouse-A2',
    },
    {
      name: 'Mechanical Keyboard Blue Switch',
      sku: 'SKU-MKB-002',
      category: 'Accessories',
      unitPrice: 4500.0,
      currentStock: 120,
      minStockAlert: 15,
      location: 'Warehouse-B1',
    },
    {
      name: 'Wireless Ergonomic Mouse 2.4G',
      sku: 'SKU-WEM-003',
      category: 'Accessories',
      unitPrice: 2200.0,
      currentStock: 8, // Below alert limit (10) to showcase warnings
      minStockAlert: 10,
      location: 'Warehouse-B1',
    },
    {
      name: '4K UltraHD Monitor 27"',
      sku: 'SKU-UHM-004',
      category: 'Electronics',
      unitPrice: 28000.0,
      currentStock: 15,
      minStockAlert: 5,
      location: 'Warehouse-A1',
    },
  ];

  for (const prod of products) {
    const p = await prisma.product.create({
      data: prod,
    });
    // Create initial stock movement log
    await prisma.stockLog.create({
      data: {
        productId: p.id,
        quantity: prod.currentStock,
        type: 'IN',
        reason: 'Initial stock seeding',
        createdById: admin.id,
      },
    });
  }

  console.log('Products seeded successfully!');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
