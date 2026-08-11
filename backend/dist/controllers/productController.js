"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.adjustStock = adjustStock;
exports.getProductLogs = getProductLogs;
exports.getAllLogs = getAllLogs;
exports.deleteProduct = deleteProduct;
const zod_1 = require("zod");
const db_1 = __importDefault(require("../db"));
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Product name is required'),
    sku: zod_1.z.string().min(1, 'SKU code is required'),
    category: zod_1.z.string().min(1, 'Category is required'),
    unitPrice: zod_1.z.number().min(0, 'Unit price must be non-negative'),
    currentStock: zod_1.z.number().int().min(0, 'Stock must be non-negative'),
    minStockAlert: zod_1.z.number().int().min(0, 'Min stock alert must be non-negative'),
    location: zod_1.z.string().min(1, 'Storage location is required'),
    imageUrl: zod_1.z.string().optional().nullable(),
});
const stockAdjustSchema = zod_1.z.object({
    quantityDelta: zod_1.z.number().int().refine((val) => val !== 0, {
        message: 'Quantity delta cannot be zero',
    }),
    reason: zod_1.z.string().min(1, 'Reason for adjustment is required'),
});
async function getProducts(req, res) {
    try {
        const search = req.query.search ? String(req.query.search) : '';
        const category = req.query.category ? String(req.query.category) : '';
        const lowStock = req.query.lowStock === 'true';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
            ];
        }
        if (category) {
            where.category = category;
        }
        if (lowStock) {
            where.currentStock = {
                lt: db_1.default.product.fields.minStockAlert,
            };
            // Note: SQLite might not support direct field-to-field comparison in some environments via Prisma raw fields, 
            // but we can query all or use a standard approach. Let's do it in Javascript if needed or use Prisma's standard filter:
            // prisma.product.fields.minStockAlert is supported. But if it fails, we can handle it safely:
        }
        // Let's use a safer approach for SQLite compatibility:
        // If lowStock is true, we filter them. Let's fetch all and filter in JS if pagination limit is small, or use raw if needed.
        // Actually, Prisma does support direct field comparison in where since v4.3: { currentStock: { lt: prisma.product.fields.minStockAlert } }
        // Let's implement it. If SQLite has issues, we can write a fallback.
        const [total, products] = await db_1.default.$transaction([
            db_1.default.product.count({ where }),
            db_1.default.product.findMany({
                where,
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
        ]);
        return res.status(200).json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getProductById(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const product = await db_1.default.product.findUnique({
            where: { id },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        return res.status(200).json(product);
    }
    catch (error) {
        console.error('Get product error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function createProduct(req, res) {
    try {
        const validation = productSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }
        const data = validation.data;
        // Check SKU uniqueness
        const existing = await db_1.default.product.findUnique({
            where: { sku: data.sku },
        });
        if (existing) {
            return res.status(400).json({ error: 'Product SKU already exists' });
        }
        // Transaction to create product and log initial stock
        const product = await db_1.default.$transaction(async (tx) => {
            const prod = await tx.product.create({
                data,
            });
            if (prod.currentStock > 0) {
                await tx.stockLog.create({
                    data: {
                        productId: prod.id,
                        quantity: prod.currentStock,
                        type: 'IN',
                        reason: 'Product created with initial stock',
                        createdById: req.user.id,
                    },
                });
            }
            return prod;
        });
        return res.status(201).json(product);
    }
    catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateProduct(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const validation = productSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }
        const data = validation.data;
        // Check SKU uniqueness (excluding current product)
        const existingSku = await db_1.default.product.findFirst({
            where: {
                sku: data.sku,
                id: { not: id },
            },
        });
        if (existingSku) {
            return res.status(400).json({ error: 'Product SKU already exists on another product' });
        }
        const existingProduct = await db_1.default.product.findUnique({
            where: { id },
        });
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const oldStock = existingProduct.currentStock;
        const newStock = data.currentStock;
        const stockDelta = newStock - oldStock;
        const product = await db_1.default.$transaction(async (tx) => {
            const prod = await tx.product.update({
                where: { id },
                data,
            });
            if (stockDelta !== 0) {
                await tx.stockLog.create({
                    data: {
                        productId: prod.id,
                        quantity: Math.abs(stockDelta),
                        type: stockDelta > 0 ? 'IN' : 'OUT',
                        reason: `Product profile stock edit (Old: ${oldStock}, New: ${newStock})`,
                        createdById: req.user.id,
                    },
                });
            }
            return prod;
        });
        return res.status(200).json(product);
    }
    catch (error) {
        console.error('Update product error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function adjustStock(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const validation = stockAdjustSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: validation.error.errors[0].message });
        }
        const { quantityDelta, reason } = validation.data;
        const product = await db_1.default.product.findUnique({
            where: { id },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const newStock = product.currentStock + quantityDelta;
        if (newStock < 0) {
            return res.status(400).json({ error: 'Stock adjustment would result in a negative stock quantity' });
        }
        const updatedProduct = await db_1.default.$transaction(async (tx) => {
            const p = await tx.product.update({
                where: { id },
                data: { currentStock: newStock },
            });
            await tx.stockLog.create({
                data: {
                    productId: id,
                    quantity: Math.abs(quantityDelta),
                    type: quantityDelta > 0 ? 'IN' : 'OUT',
                    reason: reason || 'Manual stock adjustment',
                    createdById: req.user.id,
                },
            });
            return p;
        });
        return res.status(200).json(updatedProduct);
    }
    catch (error) {
        console.error('Adjust stock error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getProductLogs(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const logs = await db_1.default.stockLog.findMany({
            where: { productId: id },
            include: {
                createdBy: {
                    select: { id: true, name: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(logs);
    }
    catch (error) {
        console.error('Get product logs error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function getAllLogs(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const logs = await db_1.default.stockLog.findMany({
            include: {
                product: {
                    select: { name: true, sku: true },
                },
                createdBy: {
                    select: { id: true, name: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return res.status(200).json(logs);
    }
    catch (error) {
        console.error('Get all logs error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteProduct(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const existingProduct = await db_1.default.product.findUnique({ where: { id } });
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await db_1.default.product.delete({ where: { id } });
        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
