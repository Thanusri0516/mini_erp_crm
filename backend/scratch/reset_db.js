const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  try {
    console.log('Resetting Challan CH-2026-0001 back to DRAFT...');
    await prisma.challan.update({
      where: { id: 4 },
      data: { status: 'DRAFT' }
    });

    console.log('Restoring products stock levels...');
    await prisma.product.update({
      where: { sku: 'SKU-MKB-002' },
      data: { currentStock: 120 }
    });
    
    await prisma.product.update({
      where: { sku: 'SKU-UHM-004' },
      data: { currentStock: 15 }
    });

    console.log('Deleting stock movement logs associated with confirmation...');
    await prisma.stockLog.deleteMany({
      where: {
        reason: { contains: 'CH-2026-0001' }
      }
    });

    console.log('Database state reset successfully! You can now test the buttons fresh.');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
