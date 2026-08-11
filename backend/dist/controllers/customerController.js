"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomers = getCustomers;
exports.getCustomerById = getCustomerById;
exports.createCustomer = createCustomer;
exports.updateCustomer = updateCustomer;
exports.addFollowUpNote = addFollowUpNote;
exports.deleteCustomer = deleteCustomer;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
// Zod schemas for input validation
const customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Customer name is required'),
    mobile: zod_1.z.string().min(10, 'Mobile number must be at least 10 digits'),
    email: zod_1.z.string().email('Invalid email address'),
    businessName: zod_1.z.string().min(1, 'Business name is required'),
    gstNumber: zod_1.z.string().optional().nullable(),
    type: zod_1.z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
    address: zod_1.z.string().min(1, 'Address is required'),
    status: zod_1.z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
    followUpDate: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
const noteSchema = zod_1.z.object({
    note: zod_1.z.string().min(1, 'Note content cannot be empty'),
});
async function getCustomers(req, res) {
    try {
        const search = req.query.search ? String(req.query.search) : '';
        const status = req.query.status ? String(req.query.status) : '';
        const type = req.query.type ? String(req.query.type) : '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build filter query
        const where = {};
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
        const [total, customers] = await db_1.default.$transaction([
            db_1.default.customer.count({ where }),
            db_1.default.customer.findMany({
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
    }
    catch (error) {
        console.error('Get customers error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getCustomerById(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        const customer = await db_1.default.customer.findUnique({
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
    }
    catch (error) {
        console.error('Get customer error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function createCustomer(req, res) {
    try {
        const validation = customerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }
        const customerData = validation.data;
        const followUpDate = customerData.followUpDate ? new Date(customerData.followUpDate) : null;
        const customer = await db_1.default.customer.create({
            data: {
                ...customerData,
                followUpDate,
                followUpNotes: {
                    create: {
                        note: customerData.notes || 'Customer profiles created',
                        createdById: req.user.id,
                    },
                },
            },
        });
        return res.status(201).json(customer);
    }
    catch (error) {
        console.error('Create customer error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateCustomer(req, res) {
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
        const existingCustomer = await db_1.default.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const updatedCustomer = await db_1.default.customer.update({
            where: { id },
            data: {
                ...customerData,
                followUpDate,
            },
        });
        // Add automated change log note
        await db_1.default.followUpNote.create({
            data: {
                customerId: id,
                note: `Profile updated by ${req.user.name}`,
                createdById: req.user.id,
            },
        });
        return res.status(200).json(updatedCustomer);
    }
    catch (error) {
        console.error('Update customer error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function addFollowUpNote(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        const validation = noteSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }
        const existingCustomer = await db_1.default.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const newNote = await db_1.default.followUpNote.create({
            data: {
                customerId: id,
                note: validation.data.note,
                createdById: req.user.id,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, role: true },
                },
            },
        });
        return res.status(201).json(newNote);
    }
    catch (error) {
        console.error('Add note error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteCustomer(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid customer ID' });
        }
        const existingCustomer = await db_1.default.customer.findUnique({ where: { id } });
        if (!existingCustomer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        await db_1.default.customer.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Customer deleted successfully' });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
