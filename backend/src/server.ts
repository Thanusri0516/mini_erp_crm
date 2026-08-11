import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { login, getMe } from './controllers/authController';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
  deleteCustomer,
} from './controllers/customerController';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getAllLogs,
  getProductLogs,
  deleteProduct,
} from './controllers/productController';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  confirmChallan,
  cancelChallan,
} from './controllers/challanController';
import { authenticateJWT, requireRole } from './middlewares/authMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());

// Base health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Authentication Routes
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticateJWT, getMe);

// Customer CRM Routes
// - All authenticated users can view/search customer list or details.
// - Admin and Sales can create, edit, or add follow-up notes.
app.get('/api/customers', authenticateJWT, getCustomers);
app.get('/api/customers/:id', authenticateJWT, getCustomerById);
app.post('/api/customers', authenticateJWT, requireRole(['ADMIN', 'SALES']), createCustomer);
app.put('/api/customers/:id', authenticateJWT, requireRole(['ADMIN', 'SALES']), updateCustomer);
app.post('/api/customers/:id/notes', authenticateJWT, requireRole(['ADMIN', 'SALES']), addFollowUpNote);
app.delete('/api/customers/:id', authenticateJWT, requireRole(['ADMIN', 'SALES']), deleteCustomer);

// Product Inventory Routes
// - All authenticated users can view the product catalog.
// - Admin and Warehouse can create, edit, adjust stock, or view stock logs.
app.get('/api/products', authenticateJWT, getProducts);
app.get('/api/products/:id', authenticateJWT, getProductById);
app.post('/api/products', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE']), createProduct);
app.put('/api/products/:id', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE']), updateProduct);
app.post('/api/products/:id/adjust', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE']), adjustStock);
app.get('/api/products/logs', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), getAllLogs);
app.get('/api/products/:id/logs', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), getProductLogs);
app.get('/api/products/:id/stock-movements', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), getProductLogs);
app.delete('/api/products/:id', authenticateJWT, requireRole(['ADMIN', 'WAREHOUSE']), deleteProduct);

// Sales Challan Routes
// - All authenticated users can view/list challans.
// - Admin and Sales can create drafts or confirm them.
// - Admin, Sales, and Accounts can cancel or update statuses.
app.get('/api/challans', authenticateJWT, getChallans);
app.get('/api/challans/:id', authenticateJWT, getChallanById);
app.post('/api/challans', authenticateJWT, requireRole(['ADMIN', 'SALES']), createChallan);
app.put('/api/challans/:id/status', authenticateJWT, requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), updateChallanStatus);
app.put('/api/challans/:id/confirm', authenticateJWT, requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), confirmChallan);
app.put('/api/challans/:id/cancel', authenticateJWT, requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), cancelChallan);

// Error Handler Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
