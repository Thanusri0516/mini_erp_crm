import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  MapPin, 
  Clock, 
  X,
  PlusCircle,
  MinusCircle,
  AlertTriangle,
  Laptop,
  Keyboard,
  Mouse,
  Layers
} from 'lucide-react';
import { api } from '../api';

interface ProductsProps {
  currentUser: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
}

export default function Products({ currentUser }: ProductsProps) {
  const isWritable = ['ADMIN', 'WAREHOUSE'].includes(currentUser.role);

  // States
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [formModal, setFormModal] = useState<any | null>(null); // null, {}, or product
  const [adjustModal, setAdjustModal] = useState<any | null>(null); // null or product
  const [logsModal, setLogsModal] = useState<any | null>(null); // null or product
  const [productLogs, setProductLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Form Fields
  const [formFields, setFormFields] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 0,
    location: '',
  });
  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Adjust Stock Fields
  const [adjustFields, setAdjustFields] = useState({
    delta: 1,
    isIncrement: true,
    reason: '',
  });
  const [adjustError, setAdjustError] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        search,
        category: categoryFilter,
        lowStock: lowStockFilter ? 'true' : '',
        page: page.toString(),
        limit: '8',
      });
      const data = await api.get(`/products?${queryParams}`);
      setProducts(data.products || []);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockFilter, page]);

  // Open Create Form
  const openCreateModal = () => {
    setFormFields({
      name: '',
      sku: '',
      category: 'Electronics',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 5,
      location: '',
    });
    setFormError('');
    setFormModal({});
  };

  // Open Edit Form
  const openEditModal = (product: any) => {
    setFormFields({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || '',
      unitPrice: product.unitPrice || 0,
      currentStock: product.currentStock || 0,
      minStockAlert: product.minStockAlert || 0,
      location: product.location || '',
    });
    setFormError('');
    setFormModal(product);
  };

  // Save Product Form
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.name || !formFields.sku || !formFields.category || !formFields.location) {
      setFormError('Please fill in all required fields');
      return;
    }

    setFormSaving(true);
    setFormError('');

    try {
      if (formModal.id) {
        await api.put(`/products/${formModal.id}`, formFields);
      } else {
        await api.post('/products', formFields);
      }
      setFormModal(null);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setFormSaving(false);
    }
  };

  // Open Adjust Stock Modal
  const openAdjustModal = (product: any) => {
    setAdjustFields({
      delta: 5,
      isIncrement: true,
      reason: '',
    });
    setAdjustError('');
    setAdjustModal(product);
  };

  // Save Stock Adjustment
  const saveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustFields.reason.trim()) {
      setAdjustError('Reason for stock adjustment is required');
      return;
    }

    setAdjustSaving(true);
    setAdjustError('');

    const quantityDelta = adjustFields.isIncrement ? adjustFields.delta : -adjustFields.delta;
    const projectNewStock = adjustModal.currentStock + quantityDelta;

    if (projectNewStock < 0) {
      setAdjustError('Total stock quantity cannot drop below 0');
      setAdjustSaving(false);
      return;
    }

    try {
      await api.post(`/products/${adjustModal.id}/adjust`, {
        quantityDelta,
        reason: adjustFields.reason
      });
      setAdjustModal(null);
      fetchProducts();
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock');
    } finally {
      setAdjustSaving(false);
    }
  };

  // View Stock Logs Modal
  const openLogsModal = async (product: any) => {
    setLogsModal(product);
    setLoadingLogs(true);
    setProductLogs([]);
    try {
      const data = await api.get(`/products/${product.id}/logs`);
      setProductLogs(data || []);
    } catch (err: any) {
      alert(err.message || 'Failed to load logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Helper to pick Category Icons
  const renderCategoryIcon = (productName: string) => {
    const lower = productName.toLowerCase();
    
    if (lower.includes('keyboard')) {
      return <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Keyboard size={16} /></div>;
    }
    if (lower.includes('mouse')) {
      return <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mouse size={16} /></div>;
    }
    if (lower.includes('laptop') || lower.includes('book') || lower.includes('monitor') || lower.includes('screen')) {
      return <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Laptop size={16} /></div>;
    }
    return <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={16} /></div>;
  };

  return (
    <div>
      <div className="page-header-row">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage products and inventory stock levels.</p>
        {isWritable && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Search & Filter Bar */}
      <div className="glass-panel filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '8px 12px' }}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          >
            <option value="">Category: All</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
            <option value="Office Supplies">Office Supplies</option>
          </select>
        </div>

        <button 
          className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => { setLowStockFilter(!lowStockFilter); setPage(1); }}
          style={{ gap: '6px', height: '38px' }}
        >
          <AlertTriangle size={15} /> Low Stock Warnings
        </button>
      </div>

      {/* Products Table List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No products found.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU / Code</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isAlert = p.currentStock < p.minStockAlert;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {renderCategoryIcon(p.name)}
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={10} /> {p.location}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--text-main)' }}>{p.sku}</td>
                      <td>
                        <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{p.category}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{p.unitPrice.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: isAlert ? 'var(--danger-text)' : 'var(--text-main)' }}>
                        {p.currentStock}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.minStockAlert}</td>
                      <td>
                        <span className={`badge ${isAlert ? 'badge-inactive' : 'badge-active'}`}>
                          {isAlert ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ padding: '6px' }} 
                            onClick={() => openLogsModal(p)}
                            title="Stock history logs"
                          >
                            <Clock size={14} />
                          </button>
                          
                          {isWritable && (
                            <>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => openAdjustModal(p)}
                              >
                                Adjust Stock
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '6px' }}
                                onClick={() => openEditModal(p)}
                              >
                                <Edit size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination" style={{ padding: '16px 24px' }}>
            <span className="page-info">Showing page {page} of {totalPages}</span>
            <div className="page-controls">
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Add / Edit Product Form Modal */}
      {formModal && (
        <div className="modal-overlay" onClick={() => setFormModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formModal.id ? 'Edit Product Catalog' : 'Add New Product'}</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }} onClick={() => setFormModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveProduct}>
              <div className="modal-body">
                {formError && <div className="alert alert-danger">{formError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    placeholder="e.g. Mechanical Keyboard"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">SKU Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formFields.sku}
                      onChange={(e) => setFormFields({ ...formFields, sku: e.target.value })}
                      placeholder="e.g. SKU-KEY-001"
                      disabled={!!formModal.id}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={formFields.category}
                      onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Office Supplies">Office Supplies</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Unit Price (INR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formFields.unitPrice}
                      onChange={(e) => setFormFields({ ...formFields, unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Alert Level *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formFields.minStockAlert}
                      onChange={(e) => setFormFields({ ...formFields, minStockAlert: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Storage Warehouse/Location *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formFields.location}
                      onChange={(e) => setFormFields({ ...formFields, location: e.target.value })}
                      placeholder="e.g. Warehouse-A1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Current Stock Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formFields.currentStock}
                      onChange={(e) => setFormFields({ ...formFields, currentStock: parseInt(e.target.value) || 0 })}
                      disabled={!!formModal.id}
                    />
                    {formModal.id && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        To edit stock count, use the "Adjust Stock" tool.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFormModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formSaving}>
                  {formSaving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Adjust Stock Modal */}
      {adjustModal && (
        <div className="modal-overlay" onClick={() => setAdjustModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Adjust Stock: {adjustModal.name}</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }} onClick={() => setAdjustModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveAdjustment}>
              <div className="modal-body">
                {adjustError && <div className="alert alert-danger">{adjustError}</div>}
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div 
                    className={`role-select-btn ${adjustFields.isIncrement ? 'selected' : ''}`}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                    onClick={() => setAdjustFields({ ...adjustFields, isIncrement: true })}
                  >
                    <PlusCircle size={20} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Stock IN</span>
                  </div>

                  <div 
                    className={`role-select-btn ${!adjustFields.isIncrement ? 'selected' : ''}`}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                    onClick={() => setAdjustFields({ ...adjustFields, isIncrement: false })}
                  >
                    <MinusCircle size={20} />
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Stock OUT</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Delta</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={adjustFields.delta}
                    onChange={(e) => setAdjustFields({ ...adjustFields, delta: parseInt(e.target.value) || 1 })}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Current stock level: <strong>{adjustModal.currentStock} units</strong>
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for adjustment *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Audit audit discrepancy, damages"
                    value={adjustFields.reason}
                    onChange={(e) => setAdjustFields({ ...adjustFields, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={adjustSaving}>
                  {adjustSaving ? 'Updating...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Stock logs Modal */}
      {logsModal && (
        <div className="modal-overlay" onClick={() => setLogsModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Stock Movement Logs: {logsModal.name}</h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }} onClick={() => setLogsModal(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading transaction logs...</div>
              ) : productLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.88rem' }}>No stock movements recorded for this product.</p>
              ) : (
                <div className="table-container" style={{ marginTop: 0, maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Created By</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productLogs.map((log) => {
                        const isIN = log.type === 'IN';
                        return (
                          <tr key={log.id}>
                            <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                              {new Date(log.createdAt).toLocaleString('en-GB')}
                            </td>
                            <td>
                              <span className={`badge badge-${isIN ? 'active' : 'inactive'}`} style={{ minWidth: '45px', textAlign: 'center' }}>
                                {log.type}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: isIN ? 'var(--success-text)' : 'var(--danger-text)' }}>
                              {isIN ? '+' : '-'}{log.quantity}
                            </td>
                            <td style={{ fontSize: '0.82rem' }}>{log.createdBy?.name}</td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{log.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setLogsModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
