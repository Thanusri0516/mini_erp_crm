const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const challans = await prisma.challan.findMany({
    include: {
      customer: true
    }
  });
  console.log(JSON.stringify(challans, null, 2));
}

main().finally(() => prisma.$disconnect());
