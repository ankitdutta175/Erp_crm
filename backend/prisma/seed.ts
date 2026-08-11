import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create Users with Hashed Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const salesPasswordHash = await bcrypt.hash('Sales@123', 10);
  const warehousePasswordHash = await bcrypt.hash('Warehouse@123', 10);
  const accountsPasswordHash = await bcrypt.hash('Accounts@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@company.com',
      password: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Rahul Sharma (Sales Executive)',
      email: 'sales@company.com',
      password: salesPasswordHash,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Vikram Singh (Warehouse Manager)',
      email: 'warehouse@company.com',
      password: warehousePasswordHash,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Priya Patel (Accounts Lead)',
      email: 'accounts@company.com',
      password: accountsPasswordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Default users created:');
  console.log('   - admin@company.com / Admin@123');
  console.log('   - sales@company.com / Sales@123');
  console.log('   - warehouse@company.com / Warehouse@123');
  console.log('   - accounts@company.com / Accounts@123');

  // Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Amit Verma',
      mobile: '+91 9876543210',
      email: 'amit@vermatraders.com',
      businessName: 'Verma Traders & Hardware',
      gstNumber: '07AAAAA0000A1Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 45, Okhla Industrial Area Phase III, New Delhi',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 3),
      notes: 'Interested in bulk orders for Q3. Requested 5% volume discount.',
      followUpNotes: {
        create: [
          {
            note: 'Initial inquiry via phone call regarding wholesale pricing catalog.',
            createdBy: salesUser.name,
          },
          {
            note: 'Sent formal quotation for 500 units of Industrial Power Cables.',
            createdBy: salesUser.name,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Suresh Kumar',
      mobile: '+91 9123456789',
      email: 'suresh@apexretail.com',
      businessName: 'Apex Electronics Retail',
      gstNumber: '27BBBCA1234B1Z9',
      customerType: 'RETAIL',
      address: 'Shop #12, MG Road, Pune, Maharashtra',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 86400000 * 1),
      notes: 'New lead looking for monthly supply of wireless mice and keyboards.',
      followUpNotes: {
        create: [
          {
            note: 'Contacted customer via email with sample product brochure.',
            createdBy: salesUser.name,
          },
        ],
      },
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Neha Gupta',
      mobile: '+91 9988776655',
      email: 'neha@globaldistributors.in',
      businessName: 'Global Logistics & Distribution',
      gstNumber: '24CCCCD9876C1Z2',
      customerType: 'DISTRIBUTOR',
      address: 'B-201, GIDC Electronics Complex, Gandhinagar, Gujarat',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 7),
      notes: 'Key regional distributor for North & West zone.',
      followUpNotes: {
        create: [
          {
            note: 'Contract renewed for FY2026. Credit limit set to INR 5,000,000.',
            createdBy: adminUser.name,
          },
        ],
      },
    },
  });

  console.log('✅ Sample customers created.');

  // Create Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Industrial Heavy Duty Power Cable 10m',
      sku: 'ELE-CBL-001',
      category: 'Electronics & Cables',
      unitPrice: 1250.0,
      currentStock: 150,
      minStockAlert: 20,
      location: 'Warehouse A - Bay 04',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Ergonomic Wireless Mouse Pro',
      sku: 'PER-MSE-002',
      category: 'Computer Peripherals',
      unitPrice: 850.0,
      currentStock: 15,
      minStockAlert: 25,
      location: 'Warehouse B - Shelf 12',
      imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=400&q=80',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Mechanical Backlit Keyboard RGB',
      sku: 'PER-KBD-003',
      category: 'Computer Peripherals',
      unitPrice: 2400.0,
      currentStock: 80,
      minStockAlert: 15,
      location: 'Warehouse B - Shelf 14',
      imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'Smart Surge Protector Extension Box',
      sku: 'ELE-EXT-004',
      category: 'Electronics & Cables',
      unitPrice: 650.0,
      currentStock: 8,
      minStockAlert: 20,
      location: 'Warehouse A - Bay 02',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
    },
  });

  console.log('✅ Sample products created.');

  // Stock Movement Logs
  await prisma.stockLog.createMany({
    data: [
      {
        productId: prod1.id,
        quantityChanged: 150,
        movementType: 'IN',
        reason: 'Initial Inward Procurement Batch #INP-901',
        createdBy: warehouseUser.name,
      },
      {
        productId: prod2.id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Initial Stock Deposit',
        createdBy: warehouseUser.name,
      },
      {
        productId: prod2.id,
        quantityChanged: 35,
        movementType: 'OUT',
        reason: 'Order fulfillment to Retailer #89',
        createdBy: warehouseUser.name,
      },
      {
        productId: prod3.id,
        quantityChanged: 80,
        movementType: 'IN',
        reason: 'Import batch clearance',
        createdBy: warehouseUser.name,
      },
      {
        productId: prod4.id,
        quantityChanged: 8,
        movementType: 'IN',
        reason: 'Opening Balance',
        createdBy: warehouseUser.name,
      },
    ],
  });

  // Sales Challans
  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CHAL-2026-0001',
      customerId: customer1.id,
      totalQuantity: 10,
      totalAmount: 12500.0,
      status: 'CONFIRMED',
      createdBy: salesUser.name,
      items: {
        create: [
          {
            productId: prod1.id,
            productNameSnapshot: prod1.name,
            skuSnapshot: prod1.sku,
            unitPriceSnapshot: prod1.unitPrice,
            quantity: 10,
            totalPrice: 12500.0,
          },
        ],
      },
    },
  });

  await prisma.salesChallan.create({
    data: {
      challanNumber: 'CHAL-2026-0002',
      customerId: customer2.id,
      totalQuantity: 5,
      totalAmount: 4250.0,
      status: 'DRAFT',
      createdBy: salesUser.name,
      items: {
        create: [
          {
            productId: prod2.id,
            productNameSnapshot: prod2.name,
            skuSnapshot: prod2.sku,
            unitPriceSnapshot: prod2.unitPrice,
            quantity: 5,
            totalPrice: 4250.0,
          },
        ],
      },
    },
  });

  console.log('✅ Sample sales challans created.');
  console.log('🎉 Seed process completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
