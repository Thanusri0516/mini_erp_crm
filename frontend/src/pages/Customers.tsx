import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  X,
  MessageSquare,
  ChevronLeft,
  Eye
} from 'lucide-react';
import { api } from '../api';

interface CustomersProps {
  currentUser: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
}

export default function Customers({ currentUser }: CustomersProps) {
  const isWritable = ['ADMIN', 'SALES'].includes(currentUser.role);

  // States
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Workspace toggles
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  
  const [formModal, setFormModal] = useState<any | null>(null); // null = closed, {} = add new, {id} = edit
  const [noteContent, setNoteContent] = useState('');

  // Form Fields State
  const [formFields, setFormFields] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'RETAIL',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        type: typeFilter,
        page: page.toString(),
        limit: '8',
      });
      const data = await api.get(`/customers?${queryParams}`);
      setCustomers(data.customers || []);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter, page]);

  // Handle Search Input Change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Open Form Modal for Create
  const openCreateModal = () => {
    setFormFields({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      type: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
    setFormError('');
    setFormModal({});
  };

  // Open Form Modal for Edit
  const openEditModal = (customer: any) => {
    setFormFields({
      name: customer.name || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
      businessName: customer.businessName || '',
      gstNumber: customer.gstNumber || '',
      type: customer.type || 'RETAIL',
      address: customer.address || '',
      status: customer.status || 'LEAD',
      followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '',
      notes: customer.notes || '',
    });
    setFormError('');
    setFormModal(customer);
  };

  // Save Customer Form
  const saveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.name || !formFields.mobile || !formFields.email || !formFields.businessName || !formFields.address) {
      setFormError('Please fill in all required fields');
      return;
    }

    setFormSaving(true);
    setFormError('');

    try {
      if (formModal.id) {
        // Edit Mode
        const updated = await api.put(`/customers/${formModal.id}`, formFields);
        if (selectedCustomerId === formModal.id) {
          // Update details workspace inline if viewing it
          setDetailData({
            ...detailData,
            ...updated
          });
        }
      } else {
        // Create Mode
        await api.post('/customers', formFields);
      }
      setFormModal(null);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer');
    } finally {
      setFormSaving(false);
    }
  };

  // Open inline detailed view
  const openDetailView = async (id: number) => {
    try {
      setLoading(true);
      const customer = await api.get(`/customers/${id}`);
      setDetailData(customer);
      setSelectedCustomerId(id);

      // Fetch recent challans for this customer
      const challansRes = await api.get('/challans?limit=100');
      const filtered = (challansRes.challans || []).filter((c: any) => c.customerId === id);
      setRecentChallans(filtered.slice(0, 5));
    } catch (err: any) {
      alert(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  // Add Follow-up Note
  const submitFollowUpNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !detailData) return;

    try {
      const newNote = await api.post(`/customers/${detailData.id}/notes`, { note: noteContent });
      setDetailData({
        ...detailData,
        followUpNotes: [newNote, ...(detailData.followUpNotes || [])],
      });
      setNoteContent('');
    } catch (err: any) {
      alert(err.message || 'Failed to add follow-up note');
    }
  };

  // Render detailed workspace
  if (selectedCustomerId && detailData) {
    return (
      <div>
        {/* Detail Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCustomerId(null)} style={{ padding: '8px 12px' }}>
              <ChevronLeft size={16} /> Back to List
            </button>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{detailData.name}</h2>
            <span className={`badge badge-${detailData.status.toLowerCase()}`}>{detailData.status}</span>
          </div>

          {isWritable && (
            <button className="btn btn-primary" onClick={() => openEditModal(detailData)}>
              <Edit size={16} /> Edit Customer
            </button>
          )}
        </div>

        {/* Split details workspace */}
        <div className="split-layout">
          {/* Left Column: Follow-ups */}
          <div className="glass-panel">
            <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '1rem' }}>
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              Communication & Follow-up History
            </h4>

            {isWritable && (
              <form onSubmit={submitFollowUpNote} style={{ marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Log summary of call, client instructions or next steps..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    style={{ resize: 'none' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', height: '40px' }}>
                  Log Note
                </button>
              </form>
            )}

            {(!detailData.followUpNotes || detailData.followUpNotes.length === 0) ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No communications logged yet.</p>
            ) : (
              <div className="timeline">
                {detailData.followUpNotes.map((note: any) => (
                  <div key={note.id} className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-header">
                      <span className="timeline-user">{note.createdBy?.name} ({note.createdBy?.role})</span>
                      <span className="timeline-date">{new Date(note.createdAt).toLocaleString('en-GB')}</span>
                    </div>
                    <div className="timeline-note">{note.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Customer Details Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Customer Overview
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Business Name:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{detailData.businessName}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>GST Registration:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{detailData.gstNumber || 'Not Provided'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Customer Type:</span>
                  <div style={{ marginTop: '4px' }}><span className={`badge badge-${detailData.type.toLowerCase()}`}>{detailData.type}</span></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <div style={{ marginTop: '4px' }}><span className={`badge badge-${detailData.status.toLowerCase()}`}>{detailData.status}</span></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Mobile Number:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} style={{ color: 'var(--primary)' }} /> {detailData.mobile}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} style={{ color: 'var(--primary)' }} /> {detailData.email}
                  </div>
                </div>
                {detailData.followUpDate && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Next Follow-up Date:</span>
                    <div style={{ fontWeight: 600, color: 'var(--warning-text)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> {new Date(detailData.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Delivery Address:</span>
                  <div style={{ fontWeight: 500, color: 'var(--text-main)', marginTop: '2px', lineHeight: '1.4' }}>{detailData.address}</div>
                </div>
              </div>
            </div>

            {/* Recent Challans Card */}
            <div className="glass-panel">
              <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Recent Challans
              </h4>
              {recentChallans.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No challans issued yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentChallans.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{c.challanNumber}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>{new Date(c.createdAt).toLocaleDateString('en-GB')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{c.totalAmount.toLocaleString('en-IN')}</span>
                        <div style={{ marginTop: '2px' }}><span className={`badge badge-${c.status.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 4px' }}>{c.status}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Modal popup if edit clicked in details */}
        {formModal && renderFormModal()}
      </div>
    );
  }

  // Render customer list workspace
  return (
    <div>
      <div className="page-header-row">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your customers and follow-ups.</p>
        {isWritable && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter and search bar */}
      <div className="glass-panel filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="form-control"
            placeholder="Search customers..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-control" 
            style={{ width: '140px', padding: '8px 12px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Status: All</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-control" 
            style={{ width: '140px', padding: '8px 12px' }}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">Type: All</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No customers found.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Business Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow Up</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#eef2ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{c.mobile}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.businessName}</td>
                    <td>
                      <span className={`badge badge-${c.type.toLowerCase()}`}>{c.type}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '6px' }}
                          onClick={() => openDetailView(c.id)}
                          title="View CRM Profile"
                        >
                          <Eye size={14} />
                        </button>
                        {isWritable && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px' }}
                            onClick={() => openEditModal(c)}
                            title="Edit customer fields"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                      </div>
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

      {/* Form Modal popup */}
      {formModal && renderFormModal()}
    </div>
  );

  // Form modal renderer
  function renderFormModal() {
    return (
      <div className="modal-overlay" onClick={() => setFormModal(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
          <div className="modal-header">
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formModal.id ? 'Edit Customer Profile' : 'Add New Customer'}</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer' }} onClick={() => setFormModal(null)}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={saveCustomer}>
            <div className="modal-body">
              {formError && <div className="alert alert-danger">{formError}</div>}
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Person Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    placeholder="e.g. Ankit Sharma"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formFields.businessName}
                    onChange={(e) => setFormFields({ ...formFields, businessName: e.target.value })}
                    placeholder="e.g. ABC Traders"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formFields.mobile}
                    onChange={(e) => setFormFields({ ...formFields, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formFields.email}
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                    placeholder="e.g. ankit@abctraders.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Customer Type *</label>
                  <select
                    className="form-control"
                    value={formFields.type}
                    onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-control"
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                  >
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">GSTIN (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formFields.gstNumber}
                    onChange={(e) => setFormFields({ ...formFields, gstNumber: e.target.value })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Scheduled Follow-up Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formFields.followUpDate}
                    onChange={(e) => setFormFields({ ...formFields, followUpDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery/Billing Address *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formFields.address}
                  onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                  placeholder="Enter complete address..."
                  style={{ resize: 'none' }}
                />
              </div>

              {!formModal.id && (
                <div className="form-group">
                  <label className="form-label">Initial Communication Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formFields.notes}
                    onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                    placeholder="First contact details, customer requests..."
                    style={{ resize: 'none' }}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setFormModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={formSaving}>
                {formSaving ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
