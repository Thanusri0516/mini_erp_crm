import { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck,
  TrendingUp,
  ShoppingBag,
  Package
} from 'lucide-react';
import { api } from '../api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalLeads: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [confirmedChallans, setConfirmedChallans] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchDashboardData(showLoading = false) {
      try {
        if (showLoading) setLoading(true);
        // 1. Fetch Customers
        const customersRes = await api.get('/customers?limit=100');
        if (!active) return;
        const customersList = customersRes.customers || [];
        const totalCustomers = customersList.filter((c: any) => c.status === 'ACTIVE').length;
        const totalLeads = customersList.filter((c: any) => c.status === 'LEAD').length;

        // 2. Fetch Products
        const productsRes = await api.get('/products?limit=100');
        if (!active) return;
        const productsList = productsRes.products || [];
        const lowStockItems = productsList.filter((p: any) => p.currentStock < p.minStockAlert);
        const totalProducts = productsList.length;

        // 3. Fetch Challans
        const challansRes = await api.get('/challans?limit=3');
        if (!active) return;
        const allChallansRes = await api.get('/challans?limit=1000');
        if (!active) return;
        const allChallans = allChallansRes.challans || [];
        const confirmedChallans = allChallans.filter((c: any) => c.status === 'CONFIRMED');
        const totalRevenue = confirmedChallans.reduce((sum: number, c: any) => sum + c.totalAmount, 0);

        setStats({
          totalRevenue,
          totalCustomers,
          totalLeads,
          totalProducts,
          lowStockCount: lowStockItems.length,
        });

        setConfirmedChallans(confirmedChallans);
        setLowStockProducts(lowStockItems);
        setRecentChallans(challansRes.challans || []);
      } catch (err: any) {
        console.error(err);
        setError('Failed to load dashboard metrics');
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    fetchDashboardData(true);

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Generate daily revenue based on timeRange
  const daysCount = timeRange === 'week' ? 7 : 30;
  const dates = [];
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(todayMidnight);
    d.setDate(todayMidnight.getDate() - i);
    dates.push(d);
  }

  const formatDateLocal = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatYLabel = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  const dailyRevenues = dates.map((date) => {
    const dateStr = formatDateLocal(date);
    const matchingChallans = confirmedChallans.filter((c: any) => {
      const formattedC = formatDateLocal(new Date(c.createdAt));
      return formattedC === dateStr;
    });
    const revenue = matchingChallans.reduce((sum: number, c: any) => sum + c.totalAmount, 0);
    return {
      date,
      dateStr,
      label: timeRange === 'week' 
        ? date.toLocaleDateString('en-US', { weekday: 'short' })
        : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      timeLabel: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      revenue,
    };
  });

  const maxRevenue = Math.max(...dailyRevenues.map((r) => r.revenue), 1000);

  const points = dailyRevenues.map((item, idx) => {
    const x = 45 + (idx * 440) / (dailyRevenues.length - 1);
    const y = 160 - (item.revenue * 140) / maxRevenue;
    return { x, y, ...item };
  });

  const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`
    : '';

  const labelIndices = timeRange === 'week' 
    ? [0, 1, 2, 3, 4, 5, 6] 
    : [0, 6, 12, 18, 24, 29];

  return (
    <div>
      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '20px', border: '1px solid #e9e7df' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '8px', 
            background: '#4d6e5d', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹</span>
          </div>
          <div className="metric-details" style={{ flexGrow: 1 }}>
            <span className="metric-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Revenue</span>
            <span className="metric-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', margin: '2px 0' }}>
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="metric-trend" style={{ color: 'var(--success)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <TrendingUp size={10} /> + 12.5% vs last week
            </span>
          </div>
          {/* Sparkline */}
          <div style={{ width: '60px', height: '28px', opacity: 0.7, flexShrink: 0 }}>
            <svg viewBox="0 0 60 28" width="100%" height="100%">
              <path d="M 0 20 L 15 22 L 30 14 L 45 10 L 60 5" fill="none" stroke="#3b5944" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '20px', border: '1px solid #e9e7df' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '8px', 
            background: '#d9e2db', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#3b5944',
            flexShrink: 0
          }}>
            <Users size={20} />
          </div>
          <div className="metric-details" style={{ flexGrow: 1 }}>
            <span className="metric-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Customers</span>
            <span className="metric-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', margin: '2px 0' }}>
              {stats.totalCustomers}
            </span>
            <span className="metric-trend" style={{ color: 'var(--success)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <TrendingUp size={10} /> + 8.3% vs last week
            </span>
          </div>
          {/* Sparkline */}
          <div style={{ width: '60px', height: '28px', opacity: 0.7, flexShrink: 0 }}>
            <svg viewBox="0 0 60 28" width="100%" height="100%">
              <path d="M 0 18 L 15 22 L 30 12 L 45 15 L 60 8" fill="none" stroke="#3b5944" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '20px', border: '1px solid #e9e7df' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '8px', 
            background: '#e2e5e1', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#3b5944',
            flexShrink: 0
          }}>
            <UserCheck size={20} />
          </div>
          <div className="metric-details" style={{ flexGrow: 1 }}>
            <span className="metric-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Leads</span>
            <span className="metric-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'block', margin: '2px 0' }}>
              {stats.totalLeads}
            </span>
            <span className="metric-trend" style={{ color: 'var(--success)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <TrendingUp size={10} /> + 5.2% vs last week
            </span>
          </div>
          {/* Sparkline */}
          <div style={{ width: '60px', height: '28px', opacity: 0.7, flexShrink: 0 }}>
            <svg viewBox="0 0 60 28" width="100%" height="100%">
              <path d="M 0 20 L 15 15 L 30 18 L 45 10 L 60 6" fill="none" stroke="#3b5944" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '20px', border: '1px solid #e9e7df' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '8px', 
            background: '#cca04c', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <Package size={20} />
          </div>
          <div className="metric-details" style={{ flexGrow: 1 }}>
            <span className="metric-title" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Low Stock Items</span>
            <span className="metric-value" style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.lowStockCount > 0 ? '#b91c1c' : 'var(--text-main)', display: 'block', margin: '2px 0' }}>
              {stats.lowStockCount}
            </span>
            <span className="metric-trend" style={{ color: stats.lowStockCount > 0 ? '#b91c1c' : '#cca04c', fontSize: '0.72rem', fontWeight: 600 }}>
              {stats.lowStockCount > 0 ? 'Requires attention' : 'All Stock Normal'}
            </span>
          </div>
          {/* Sparkline */}
          <div style={{ width: '60px', height: '28px', opacity: 0.7, flexShrink: 0 }}>
            <svg viewBox="0 0 60 28" width="100%" height="100%">
              <path d="M 0 22 L 15 18 L 30 20 L 45 10 L 60 12" fill="none" stroke="#cca04c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="dashboard-two-col" style={{ marginBottom: '24px' }}>
        {/* Revenue Overview Line Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Revenue Overview</h3>
            <select 
              className="form-control" 
              style={{ width: '120px', padding: '6px 10px', fontSize: '0.8rem', marginBottom: 0 }}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div style={{ height: '200px', flexGrow: 1, position: 'relative' }}>
            <svg viewBox="0 0 500 200" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b5944" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b5944" stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="45" y1="20" x2="485" y2="20" stroke="#f1f5f9" strokeWidth="1"/>
              <line x1="45" y1="66" x2="485" y2="66" stroke="#f1f5f9" strokeWidth="1"/>
              <line x1="45" y1="113" x2="485" y2="113" stroke="#f1f5f9" strokeWidth="1"/>
              <line x1="45" y1="160" x2="485" y2="160" stroke="#e2e8f0" strokeWidth="1.5"/>
              
              {/* Y Labels */}
              <text x="35" y="23" fill="#94a3b8" fontSize="8" fontWeight="500" textAnchor="end">{formatYLabel(maxRevenue)}</text>
              <text x="35" y="69" fill="#94a3b8" fontSize="8" fontWeight="500" textAnchor="end">{formatYLabel(maxRevenue * 2 / 3)}</text>
              <text x="35" y="116" fill="#94a3b8" fontSize="8" fontWeight="500" textAnchor="end">{formatYLabel(maxRevenue * 1 / 3)}</text>
              <text x="35" y="163" fill="#94a3b8" fontSize="8" fontWeight="500" textAnchor="end">₹0</text>

              {/* Curve area and stroke */}
              {points.length > 0 && (
                <>
                  <path d={areaD} fill="url(#chart-grad)" />
                  <path d={pathD} fill="none" stroke="#3b5944" strokeWidth="2.5" />
                </>
              )}
              
              {/* Markers */}
              {points.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r={timeRange === 'week' ? "3.5" : "1.5"} 
                  fill="#ffffff" 
                  stroke="#3b5944" 
                  strokeWidth={timeRange === 'week' ? "1.5" : "1"}
                />
              ))}

              {/* Hover guide & active point */}
              {hoveredPoint && (
                <>
                  <line
                    x1={hoveredPoint.x}
                    y1={20}
                    x2={hoveredPoint.x}
                    y2={160}
                    stroke="#3b5944"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="5.5"
                    fill="#3b5944"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                </>
              )}
              
              {/* X Labels */}
              {points.map((p, idx) => {
                if (!labelIndices.includes(idx)) return null;
                let textAnchor: "inherit" | "end" | "start" | "middle" | undefined = "middle";
                if (idx === 0) textAnchor = "start";
                if (idx === points.length - 1) textAnchor = "end";
                return (
                  <text 
                    key={idx} 
                    x={p.x} 
                    y="190" 
                    fill="#94a3b8" 
                    fontSize="8.5" 
                    fontWeight="500"
                    textAnchor={textAnchor}
                  >
                    {p.label}
                  </text>
                );
              })}

              {/* Hover overlay slices */}
              {points.map((p, idx) => {
                const interval = 440 / (points.length - 1);
                const rectX = p.x - interval / 2;
                const rectWidth = interval;
                return (
                  <rect
                    key={idx}
                    x={rectX}
                    y={0}
                    width={rectWidth}
                    height={200}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseMove={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </svg>

            {/* Tooltip Overlay */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(hoveredPoint.x / 500) * 100}%`,
                  top: `${(hoveredPoint.y / 200) * 100}%`,
                  transform: 'translate(-50%, -125%)',
                  background: '#344e41',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '500',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <div style={{ color: '#d8e2dc', fontSize: '0.65rem', opacity: 0.9 }}>{hoveredPoint.timeLabel}</div>
                <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.82rem' }}>₹{hoveredPoint.revenue.toLocaleString('en-IN')}</div>
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '8px',
                    height: '8px',
                    background: '#344e41',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category Donut Chart */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Sales by Category</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', position: 'relative' }}>
            <svg viewBox="0 0 200 200" width="130px" height="130px">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#cbd5e1" strokeWidth="16" opacity="0.1"/>
              {/* Electronics 45% */}
              <circle cx="100" cy="100" r="70" fill="none" stroke="#4d6e5d" strokeWidth="16" strokeDasharray="197.9 241.9" strokeDashoffset="0" />
              {/* Accessories 30% */}
              <circle cx="100" cy="100" r="70" fill="none" stroke="#99af9e" strokeWidth="16" strokeDasharray="132 307.8" strokeDashoffset="-197.9" />
              {/* Office Supplies 25% */}
              <circle cx="100" cy="100" r="70" fill="none" stroke="#c29a4a" strokeWidth="16" strokeDasharray="110 329.8" strokeDashoffset="-329.9" />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <ShoppingBag size={24} style={{ color: '#4d6e5d' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#4d6e5d' }}></span>
                Electronics
              </span>
              <span style={{ fontWeight: 700 }}>45%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#99af9e' }}></span>
                Accessories
              </span>
              <span style={{ fontWeight: 700 }}>30%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c29a4a' }}></span>
                Office Supplies
              </span>
              <span style={{ fontWeight: 700 }}>25%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        {/* Recent Challans Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Sales Challans</h3>
            <button className="btn-view-all">View All</button>
          </div>
          {recentChallans.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '16px 0' }}>No challans recorded yet.</p>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ padding: '8px 16px' }}>Challan No.</th>
                    <th style={{ padding: '8px 16px' }}>Customer</th>
                    <th style={{ padding: '8px 16px' }}>Amount</th>
                    <th style={{ padding: '8px 16px' }}>Status</th>
                    <th style={{ padding: '8px 16px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChallans.map((challan) => (
                    <tr key={challan.id}>
                      <td style={{ fontWeight: 700, padding: '12px 16px' }}>{challan.challanNumber}</td>
                      <td style={{ padding: '12px 16px' }}>{challan.customer?.businessName || challan.customer?.name}</td>
                      <td style={{ fontWeight: 600, padding: '12px 16px' }}>₹{challan.totalAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-${challan.status.toLowerCase()}`}>
                          {challan.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '12px 16px' }}>
                        {new Date(challan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory Alerts Panel */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Inventory Alerts</h3>
            <button className="btn-view-all">View All</button>
          </div>
          {lowStockProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '170px', padding: '10px 0' }}>
              <div style={{ marginBottom: '12px' }}>
                <svg viewBox="0 0 100 100" width="80" height="80">
                  {/* Isometric Box */}
                  {/* Top Face */}
                  <polygon points="50,15 80,30 50,45 20,30" fill="#e3b574" />
                  {/* Left Face */}
                  <polygon points="20,30 50,45 50,75 20,60" fill="#b08b54" />
                  {/* Right Face */}
                  <polygon points="50,45 80,30 80,60 50,75" fill="#cca04c" />
                  {/* Tape details */}
                  <polygon points="50,15 50,45" stroke="#a7814b" strokeWidth="2.5" />
                  <polygon points="35,22.5 65,37.5" stroke="#cca04c" strokeWidth="1.5" opacity="0.6" />
                  {/* Green Check Badge overlay at bottom right */}
                  <circle cx="75" cy="70" r="14" fill="#3b5944" />
                  <path d="M 69 70 L 73 74 L 81 66" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: '700', marginBottom: '2px' }}>All products are fully stocked</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Great! There are no low stock items at the moment.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lowStockProducts.slice(0, 3).map((p) => (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fecaca',
                    background: '#fef2f2'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--danger-text)', fontSize: '0.88rem' }}>
                      Stock: {p.currentStock}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Min: {p.minStockAlert}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
