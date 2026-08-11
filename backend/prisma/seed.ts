import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@company.com',
      role: 'ADMIN',
    },
    {
      name: 'Sales User',
      email: 'sales@company.com',
      role: 'SALES',
    },
    {
      name: 'Warehouse User',
      email: 'warehouse@company.com',
      role: 'WAREHOUSE',
    },
    {
      name: 'Accounts User',
      email: 'accounts@company.com',
      role: 'ACCOUNTS',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        role: user.role,
        password,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        password,
      },
    });
  }

  console.log('Demo users created successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });