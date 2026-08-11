import { Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

// Zod schemas for input validation
const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const noteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty'),
});

export async function getCustomers(req: AuthRequest, res: Response) {
  try {
    const search = req.query.search ? String(req.query.search) : '';
    const status = req.query.status ? String(req.query.status) : '';
    const type = req.query.type ? String(req.query.type) : '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
        { businessName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Get total count and records in parallel
    const [total, customers] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get customers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCustomerById(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUpNotes: {
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(200).json(customer);
  } catch (error: any) {
    console.error('Get customer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCustomer(req: AuthRequest, res: Response) {
  try {
    const validation = customerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const customerData = validation.data;
    const followUpDate = customerData.followUpDate ? new Date(customerData.followUpDate) : null;

    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        followUpDate,
        followUpNotes: {
          create: {
            note: customerData.notes || 'Customer profiles created',
            createdById: req.user!.id,
          },
        },
      },
    });

    return res.status(201).json(customer);
  } catch (error: any) {
    console.error('Create customer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCustomer(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const validation = customerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const customerData = validation.data;
    const followUpDate = customerData.followUpDate ? new Date(customerData.followUpDate) : null;

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...customerData,
        followUpDate,
      },
    });

    // Add automated change log note
    await prisma.followUpNote.create({
      data: {
        customerId: id,
        note: `Profile updated by ${req.user!.name}`,
        createdById: req.user!.id,
      },
    });

    return res.status(200).json(updatedCustomer);
  } catch (error: any) {
    console.error('Update customer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addFollowUpNote(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const validation = noteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const newNote = await prisma.followUpNote.create({
      data: {
        customerId: id,
        note: validation.data.note,
        createdById: req.user!.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json(newNote);
  } catch (error: any) {
    console.error('Add note error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid customer ID' });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await prisma.customer.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
