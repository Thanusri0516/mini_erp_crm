const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    console.log('--- Current Products Stock ---');
    const products = await prisma.product.findMany();
    for (const p of products) {
      console.log(`Product: ${p.name} | SKU: ${p.sku} | Stock: ${p.currentStock} | MinAlert: ${p.minStockAlert}`);
    }

    console.log('\n--- Current Challans ---');
    const challans = await prisma.challan.findMany({
      include: { items: true }
    });
    for (const c of challans) {
      console.log(`Challan ID: ${c.id} | Number: ${c.challanNumber} | Status: ${c.status} | Total Amount: ₹${c.totalAmount}`);
      for (const item of c.items) {
        console.log(`  - Item: ${item.productName} | Qty: ${item.quantity} | Snapshot Price: ₹${item.unitPrice}`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
