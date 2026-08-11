"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const authController_1 = require("./controllers/authController");
const customerController_1 = require("./controllers/customerController");
const productController_1 = require("./controllers/productController");
const challanController_1 = require("./controllers/challanController");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
}));
app.use(express_1.default.json());
// Base health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});
// Authentication Routes
app.post('/api/auth/login', authController_1.login);
app.get('/api/auth/me', authMiddleware_1.authenticateJWT, authController_1.getMe);
// Customer CRM Routes
// - All authenticated users can view/search customer list or details.
// - Admin and Sales can create, edit, or add follow-up notes.
app.get('/api/customers', authMiddleware_1.authenticateJWT, customerController_1.getCustomers);
app.get('/api/customers/:id', authMiddleware_1.authenticateJWT, customerController_1.getCustomerById);
app.post('/api/customers', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES']), customerController_1.createCustomer);
app.put('/api/customers/:id', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES']), customerController_1.updateCustomer);
app.post('/api/customers/:id/notes', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES']), customerController_1.addFollowUpNote);
app.delete('/api/customers/:id', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES']), customerController_1.deleteCustomer);
// Product Inventory Routes
// - All authenticated users can view the product catalog.
// - Admin and Warehouse can create, edit, adjust stock, or view stock logs.
app.get('/api/products', authMiddleware_1.authenticateJWT, productController_1.getProducts);
app.get('/api/products/:id', authMiddleware_1.authenticateJWT, productController_1.getProductById);
app.post('/api/products', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE']), productController_1.createProduct);
app.put('/api/products/:id', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE']), productController_1.updateProduct);
app.post('/api/products/:id/adjust', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE']), productController_1.adjustStock);
app.get('/api/products/logs', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), productController_1.getAllLogs);
app.get('/api/products/:id/logs', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), productController_1.getProductLogs);
app.get('/api/products/:id/stock-movements', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), productController_1.getProductLogs);
app.delete('/api/products/:id', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'WAREHOUSE']), productController_1.deleteProduct);
// Sales Challan Routes
// - All authenticated users can view/list challans.
// - Admin and Sales can create drafts or confirm them.
// - Admin, Sales, and Accounts can cancel or update statuses.
app.get('/api/challans', authMiddleware_1.authenticateJWT, challanController_1.getChallans);
app.get('/api/challans/:id', authMiddleware_1.authenticateJWT, challanController_1.getChallanById);
app.post('/api/challans', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES']), challanController_1.createChallan);
app.put('/api/challans/:id/status', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES', 'ACCOUNTS']), challanController_1.updateChallanStatus);
app.put('/api/challans/:id/confirm', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES', 'ACCOUNTS']), challanController_1.confirmChallan);
app.put('/api/challans/:id/cancel', authMiddleware_1.authenticateJWT, (0, authMiddleware_1.requireRole)(['ADMIN', 'SALES', 'ACCOUNTS']), challanController_1.cancelChallan);
// Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error occurred.' });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
