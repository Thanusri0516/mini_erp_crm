import { Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

const challanItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const createChallanSchema = z.object({
  customerId: z.number().int(),
  status: z.enum(['DRAFT', 'CONFIRMED']),
  items: z.array(challanItemSchema).min(1, 'At least one product must be added to the challan'),
});

const updateStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export async function getChallans(req: AuthRequest, res: Response) {
  try {
    const search = req.query.search ? String(req.query.search) : '';
    const status = req.query.status ? String(req.query.status) : '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        {
          customer: {
            OR: [
              { name: { contains: search } },
              { businessName: { contains: search } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, challans] = await prisma.$transaction([
      prisma.challan.count({ where }),
      prisma.challan.findMany({
        where,
        include: {
          customer: {
            select: { name: true, businessName: true },
          },
          createdBy: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      challans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get challans error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getChallanById(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid challan ID' });
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    return res.status(200).json(challan);
  } catch (error: any) {
    console.error('Get challan error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createChallan(req: AuthRequest, res: Response) {
  try {
    const validation = createChallanSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { customerId, status, items } = validation.data;

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Resolve products and calculate prices
    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return res.status(404).json({ error: 'One or more products were not found' });
    }

    // Check stock if status is CONFIRMED
    if (status === 'CONFIRMED') {
      const stockErrors: string[] = [];
      for (const item of items) {
        const prod = dbProducts.find((p) => p.id === item.productId)!;
        if (prod.currentStock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for '${prod.name}'. Available: ${prod.currentStock}, Requested: ${item.quantity}`
          );
        }
      }

      if (stockErrors.length > 0) {
        const errorMsg = stockErrors.join('. ');
        return res.status(400).json({ 
          success: false, 
          message: errorMsg,
          error: errorMsg 
        });
      }
    }

    // Execute in a transaction to guarantee atomic execution and sequential numbering
    const newChallan = await prisma.$transaction(async (tx) => {
      // 1. Generate Challan Number
      const year = new Date().getFullYear();
      const count = await tx.challan.count();
      const challanNumber = `CH-${year}-${String(count + 1).padStart(4, '0')}`;

      // 2. Prepare items with snapshot details
      let totalQuantity = 0;
      let totalAmount = 0;
      const challanItemsData = items.map((item) => {
        const prod = dbProducts.find((p) => p.id === item.productId)!;
        const subtotal = prod.unitPrice * item.quantity;
        totalQuantity += item.quantity;
        totalAmount += subtotal;

        return {
          productId: prod.id,
          productName: prod.name,
          productSku: prod.sku,
          unitPrice: prod.unitPrice,
          quantity: item.quantity,
          subtotal,
        };
      });

      // 3. Create Challan record
      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          status,
          totalQuantity,
          totalAmount,
          createdById: req.user!.id,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. If CONFIRMED, update inventory and log movements
      if (status === 'CONFIRMED') {
        for (const item of items) {
          const prod = dbProducts.find((p) => p.id === item.productId)!;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: 'OUT',
              reason: `Sales Challan Confirmed: ${challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return challan;
    });

    return res.status(201).json(newChallan);
  } catch (error: any) {
    console.error('Create challan error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateChallanStatus(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid challan ID' });
    }

    const validation = updateStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const newStatus = validation.data.status;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    if (challan.status === newStatus) {
      return res.status(400).json({ error: `Challan is already in '${newStatus}' status` });
    }

    // Business Logic Transitions
    if (challan.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cancelled challans cannot be updated' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Transition: DRAFT -> CONFIRMED
      if (challan.status === 'DRAFT' && newStatus === 'CONFIRMED') {
        // Validate stock
        for (const item of challan.items) {
          if (!item.productId) {
            throw new Error(`Cannot confirm. Product references are missing for item: ${item.productName}`);
          }

          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod) {
            throw new Error(`Product '${item.productName}' does not exist anymore`);
          }

          if (prod.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for '${prod.name}'. Available: ${prod.currentStock}, Required: ${item.quantity}`
            );
          }
        }

        // Deduct stock and log
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId! },
            data: {
              currentStock: { decrement: item.quantity },
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId!,
              quantity: item.quantity,
              type: 'OUT',
              reason: `Sales Challan Confirmed (Draft Transition): ${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      // Transition: CONFIRMED -> CANCELLED
      if (challan.status === 'CONFIRMED' && newStatus === 'CANCELLED') {
        // Restore stock and log
        for (const item of challan.items) {
          if (item.productId) {
            const prod = await tx.product.findUnique({ where: { id: item.productId } });
            if (prod) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  currentStock: { increment: item.quantity },
                },
              });

              await tx.stockLog.create({
                data: {
                  productId: item.productId,
                  quantity: item.quantity,
                  type: 'IN',
                  reason: `Challan Cancelled - Stock Restored: ${challan.challanNumber}`,
                  createdById: req.user!.id,
                },
              });
            }
          }
        }
      }

      // Update status
      return await tx.challan.update({
        where: { id },
        data: { status: newStatus },
        include: { 
          items: true,
          customer: true,
          createdBy: {
            select: { id: true, name: true, role: true }
          }
        },
      });
    });

    return res.status(200).json(updated);
  } catch (error: any) {
    console.error('Update challan status error:', error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      error: error.message || 'Internal server error' 
    });
  }
}

export async function confirmChallan(req: AuthRequest, res: Response) {
  req.body.status = 'CONFIRMED';
  return updateChallanStatus(req, res);
}

export async function cancelChallan(req: AuthRequest, res: Response) {
  req.body.status = 'CANCELLED';
  return updateChallanStatus(req, res);
}
