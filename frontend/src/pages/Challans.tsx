import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  AlertTriangle,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Printer
} from 'lucide-react';
import { api } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ChallansProps {
  currentUser: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
}

export default function Challans({ currentUser }: ChallansProps) {
  const isSalesAdmin = ['ADMIN', 'SALES'].includes(currentUser.role);
  const isStatusWritable = ['ADMIN', 'SALES', 'ACCOUNTS'].includes(currentUser.role);

  // Lists
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dropdowns for builder
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Toggles for inline workspaces
  const [selectedChallanId, setSelectedChallanId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [viewingBuilder, setViewingBuilder] = useState(false);

  // Challan Builder Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [builderItems, setBuilderItems] = useState<Array<{ productId: number; quantity: number }>>([
    { productId: 0, quantity: 1 }
  ]);
  const [builderStatus, setBuilderStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [builderDiscount, setBuilderDiscount] = useState<number>(0);
  const [builderError, setBuilderError] = useState('');
  const [builderSaving, setBuilderSaving] = useState(false);

  // Fetch Challans
  const fetchChallans = async () => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        page: page.toString(),
        limit: '8',
      });
      const data = await api.get(`/challans?${queryParams}`);
      setChallans(data.challans || []);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challans');
    } finally {
      setLoading(false);
    }
  };

  // Fetch active customers and products list for builder dropdowns
  const fetchBuilderData = async () => {
    try {
      const customersRes = await api.get('/customers?limit=100');
      const activeCustomers = (customersRes.customers || []).filter((c: any) => c.status === 'ACTIVE');
      setCustomers(activeCustomers);

      const productsRes = await api.get('/products?limit=100');
      setProducts(productsRes.products || []);
    } catch (err) {
      console.error('Failed to load customers/products for builder:', err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter, page]);

  useEffect(() => {
    if (viewingBuilder) {
      fetchBuilderData();
    }
  }, [viewingBuilder]);

  // Open Details Workspace
  const openDetailView = async (id: number) => {
    try {
      setLoading(true);
      const data = await api.get(`/challans/${id}`);
      setDetailData(data);
      setSelectedChallanId(id);
    } catch (err: any) {
      alert(err.message || 'Failed to load challan detail');
    } finally {
      setLoading(false);
    }
  };

  // Open Challan Builder
  const openBuilder = () => {
    setSelectedCustomerId('');
    setBuilderItems([{ productId: 0, quantity: 1 }]);
    setBuilderStatus('DRAFT');
    setBuilderDiscount(0);
    setBuilderError('');
    setViewingBuilder(true);
  };

  // Add Item to Builder List
  const addBuilderItem = () => {
    setBuilderItems([...builderItems, { productId: 0, quantity: 1 }]);
  };

  // Remove Item from Builder List
  const removeBuilderItem = (index: number) => {
    const updated = [...builderItems];
    updated.splice(index, 1);
    setBuilderItems(updated);
  };

  // Update Item in Builder
  const updateBuilderItem = (index: number, field: 'productId' | 'quantity', value: number) => {
    const updated = [...builderItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setBuilderItems(updated);
    setBuilderError('');
  };

  // Calculate totals in UI
  const calculateBuilderTotal = () => {
    let totalQty = 0;
    let subTotal = 0;
    
    for (const item of builderItems) {
      if (item.productId > 0) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          totalQty += item.quantity;
          subTotal += prod.unitPrice * item.quantity;
        }
      }
    }
    
    const tax = Math.round(subTotal * 0.18);
    const grandTotal = subTotal + tax - builderDiscount;
    return { totalQty, subTotal, tax, grandTotal };
  };

  // Save Challan
  const saveChallan = async (statusOverride?: 'DRAFT' | 'CONFIRMED') => {
    if (!selectedCustomerId) {
      setBuilderError('Please select a customer');
      return;
    }

    const validItems = builderItems.filter((i) => i.productId > 0);
    if (validItems.length === 0) {
      setBuilderError('Please add at least one product with positive quantity');
      return;
    }

    setBuilderSaving(true);
    setBuilderError('');

    const targetStatus = statusOverride || builderStatus;

    try {
      await api.post('/challans', {
        customerId: selectedCustomerId,
        status: targetStatus,
        items: validItems
      });
      setViewingBuilder(false);
      fetchChallans();
    } catch (err: any) {
      setBuilderError(err.message || 'Failed to generate sales challan');
    } finally {
      setBuilderSaving(false);
    }
  };

  // Change Challan Status (Confirm / Cancel)
  const handleStatusChange = async (id: number, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const updated = await api.put(`/challans/${id}/status`, { status });
      setDetailData(updated);
      fetchChallans();
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  // PDF Generation function
  const exportToPDF = (challan: any) => {
    const doc = new jsPDF();

    // 1. Header (Indigo Bar)
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 36, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('Helvetica', 'bold');
    doc.text('SALES CHALLAN / INVOICE', 15, 22);
    
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Mini ERP + CRM Operations Portal', 15, 29);

    // Company Info
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('ISSUED BY:', 150, 12);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text('ERP Distribution Hub India', 150, 17);
    doc.setFont('Helvetica', 'normal');
    doc.text('12B Logistics Center, Bangalore', 150, 22);
    doc.text('GSTIN: 29MMERP9876E1Z9', 150, 27);

    // 2. Metadata Columns
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('BILL TO:', 15, 48);
    doc.text('CHALLAN DETAILS:', 130, 48);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text(challan.customer.businessName, 15, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Contact: ${challan.customer.name}`, 15, 60);
    doc.text(`Phone: ${challan.customer.mobile}`, 15, 66);
    doc.text(`Email: ${challan.customer.email}`, 15, 72);
    doc.text(`GSTIN: ${challan.customer.gstNumber || 'N/A'}`, 15, 78);

    doc.setFont('Helvetica', 'bold');
    doc.text(`Challan No: ${challan.challanNumber}`, 130, 54);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-GB')}`, 130, 60);
    doc.text(`Created By: ${challan.createdBy?.name || 'Portal User'}`, 130, 66);
    
    // Status text color
    let statusColor = [100, 116, 139];
    if (challan.status === 'CONFIRMED') statusColor = [4, 120, 87];
    if (challan.status === 'CANCELLED') statusColor = [185, 28, 28];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Status: ${challan.status}`, 130, 72);
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'normal');

    // 3. Items Table
    const tableBody = challan.items.map((item: any, index: number) => [
      index + 1,
      item.productName,
      item.productSku,
      `INR ${item.unitPrice.toLocaleString('en-IN')}`,
      item.quantity,
      `INR ${item.subtotal.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: 86,
      head: [['#', 'Description', 'SKU', 'Unit Price', 'Qty', 'Subtotal']],
      body: tableBody,
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 70 },
        2: { cellWidth: 25 },
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'right' }
      }
    });

    // 4. Summaries
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'normal');
    doc.text('Total Quantity:', 130, finalY);
    doc.text(`${challan.totalQuantity} items`, 185, finalY, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.text('Grand Total:', 130, finalY + 8);
    doc.text(`INR ${challan.totalAmount.toLocaleString('en-IN')}`, 185, finalY + 8, { align: 'right' });

    // Footer
    doc.line(15, finalY + 25, 195, finalY + 25);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('Helvetica', 'italic');
    doc.text('This is a computer generated document and does not require a physical signature.', 15, finalY + 31);
    doc.text('Mini ERP + CRM Operations Portal India Corp. 2026', 15, finalY + 35);

    // Save
    doc.save(`Invoice_${challan.challanNumber}.pdf`);
  };

  // Render Inline Challan Details Workspace
  if (selectedChallanId && detailData) {
    const status = detailData.status;
    const subTotal = detailData.items.reduce((sum: number, i: any) => sum + i.subtotal, 0);
    const tax = Math.round(subTotal * 0.18);
    const discount = subTotal + tax - detailData.totalAmount;

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedChallanId(null)} style={{ padding: '8px 12px' }}>
              <ChevronLeft size={16} /> Back to Register
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Challan: {detailData.challanNumber}</h2>
            <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => exportToPDF(detailData)} style={{ gap: '6px' }}>
              <Printer size={16} /> Print / Export PDF
            </button>
            {isStatusWritable && status === 'DRAFT' && (
              <button className="btn btn-primary" onClick={() => handleStatusChange(detailData.id, 'CONFIRMED')} style={{ gap: '6px' }}>
                <CheckCircle size={16} /> Confirm Challan
              </button>
            )}
            {isStatusWritable && status !== 'CANCELLED' && (
              <button className="btn btn-danger" onClick={() => handleStatusChange(detailData.id, 'CANCELLED')} style={{ gap: '6px' }}>
                <XCircle size={16} /> Cancel Challan
              </button>
            )}
          </div>
        </div>

        {/* Split details layout */}
        <div className="split-layout">
          {/* Left Column: metadata and items table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Metadata Card */}
            <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Customer</span>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '2px' }}>{detailData.customer.businessName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {detailData.customer.mobile}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Challan Date</span>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>
                  {new Date(detailData.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Created By</span>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginTop: '2px' }}>{detailData.createdBy?.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Role: {detailData.createdBy?.role}</div>
              </div>
            </div>

            {/* Items Table Card */}
            <div className="glass-panel" style={{ padding: 0 }}>
              <div className="table-container" style={{ border: 'none' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product</th>
                      <th>SKU Code</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.items.map((item: any, idx: number) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{item.productName}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.productSku}</td>
                        <td>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.subtotal.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing address note */}
            <div className="glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Delivery Info & Terms
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                Deliver to: <strong>{detailData.customer.address}</strong> <br />
                Terms: Goods once confirmed are deducted from live warehouse stock inventory logs immediately.
              </p>
            </div>
          </div>

          {/* Right Column: Summaries Card */}
          <div className="glass-panel">
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Summary details
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Quantity:</span>
                <span style={{ fontWeight: 700 }}>{detailData.totalQuantity} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sub Total:</span>
                <span style={{ fontWeight: 600 }}>₹{subTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Discount:</span>
                <span style={{ color: 'var(--danger-text)' }}>- ₹{discount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax (18% GST):</span>
                <span style={{ fontWeight: 600 }}>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, marginTop: '8px' }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--primary)' }}>₹{detailData.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Inline Challan Builder Workspace
  if (viewingBuilder) {
    const { totalQty, subTotal, tax, grandTotal } = calculateBuilderTotal();
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setViewingBuilder(false)} style={{ padding: '8px 12px' }}>
              <ChevronLeft size={16} /> Back to Register
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Create Sales Challan</h2>
          </div>
        </div>

        {builderError && <div className="alert alert-danger">{builderError}</div>}

        {/* Split layout */}
        <div className="split-layout">
          {/* Left Column: selection forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Select Customer Card */}
            <div className="glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Select Customer
              </h4>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-control"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(parseInt(e.target.value) || '')}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId && (
                <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  {(() => {
                    const cust = customers.find(c => c.id === selectedCustomerId);
                    if (!cust) return null;
                    return (
                      <div>
                        <strong>{cust.businessName}</strong> <br />
                        GSTIN: {cust.gstNumber || 'N/A'} <br />
                        Delivery: {cust.address}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Add Products Card */}
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Add Products
                </h4>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addBuilderItem}>
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {builderItems.map((item, index) => {
                  const prod = products.find((p) => p.id === item.productId);
                  const isStockAlert = prod && prod.currentStock < item.quantity && builderStatus === 'CONFIRMED';
                  
                  return (
                    <div key={index} style={{ borderBottom: index < builderItems.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: index < builderItems.length - 1 ? '16px' : 0 }}>
                      <div className="builder-item-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <select
                            className="form-control"
                            value={item.productId}
                            onChange={(e) => updateBuilderItem(index, 'productId', parseInt(e.target.value) || 0)}
                          >
                            <option value="0">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={item.quantity}
                            onChange={(e) => updateBuilderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                          />
                        </div>

                        <div style={{ fontSize: '0.88rem', fontWeight: 600, paddingLeft: '8px' }}>
                          {prod ? `₹${(prod.unitPrice * item.quantity).toLocaleString('en-IN')}` : '₹0'}
                          {prod && (
                            <div style={{ fontSize: '0.7rem', color: isStockAlert ? 'var(--danger-text)' : 'var(--text-muted)', marginTop: '2px' }}>
                              Stock: {prod.currentStock}
                            </div>
                          )}
                        </div>

                        <div>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '8px' }}
                            onClick={() => removeBuilderItem(index)}
                            disabled={builderItems.length <= 1}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {isStockAlert && (
                        <div style={{ color: 'var(--danger-text)', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} />
                          <span>Insufficient warehouse stock. Please choose a lower quantity or save as Draft.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Builder Summaries */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Summary
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Quantity:</span>
                <span style={{ fontWeight: 700 }}>{totalQty} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sub Total:</span>
                <span style={{ fontWeight: 600 }}>₹{subTotal.toLocaleString('en-IN')}</span>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Discount (INR)</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  value={builderDiscount}
                  onChange={(e) => setBuilderDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tax (18%):</span>
                <span style={{ fontWeight: 600 }}>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => saveChallan('CONFIRMED')}
                disabled={builderSaving}
              >
                Confirm Challan
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                onClick={() => saveChallan('DRAFT')}
                disabled={builderSaving}
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Challans main Register table list
  return (
    <div>
      <div className="page-header-row">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create and manage sales challans.</p>
        {isSalesAdmin && (
          <button className="btn btn-primary" onClick={openBuilder}>
            <Plus size={16} /> Create Challan
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Bar */}
      <div className="glass-panel filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Search challans..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-control" 
            style={{ width: '150px', padding: '8px 12px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Status: All</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading sales register...</div>
      ) : challans.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No sales challans found.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.challanNumber}</td>
                    <td>{c.customer?.businessName || c.customer?.name}</td>
                    <td style={{ fontWeight: 500 }}>{c.totalQuantity} items</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{c.totalAmount.toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{c.createdBy?.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetailView(c.id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
