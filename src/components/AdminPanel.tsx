import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  ShieldAlert,
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Key,
  Database,
  Lock,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { Product, User, Order, SecurityLog, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface AdminPanelProps {
  currentUser: User;
  products: Product[];
  users: User[];
  orders: Order[];
  securityLogs: SecurityLog[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddUser: (user: Omit<User, 'id'> & { password?: string }) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onProcessOrder: (orderId: string, status: OrderStatus, workerName: string) => void;
  onClearLogs?: () => void;
}

export default function AdminPanel({
  currentUser,
  products,
  users,
  orders,
  securityLogs,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onProcessOrder,
  onClearLogs,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'users' | 'security'>('dashboard');

  // Search/Filters states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  
  // Create / Edit Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Accesorios');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('');

  // Create / Edit User Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userUsername, setUserUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');
  const [userPassword, setUserPassword] = useState('');

  // Selected Order Detail Modal State
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  const isAdmin = currentUser.role === 'admin';

  // --- Calculations for Analytics ---
  const totalSalesAmount = orders
    .filter(o => o.status === 'confirmed')
    .reduce((acc, curr) => acc + curr.total, 0);

  const confirmedCount = orders.filter(o => o.status === 'confirmed').length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const canceledCount = orders.filter(o => o.status === 'canceled').length;

  const lowStockProducts = products.filter(p => p.stock <= 5);

  // Recharts Sales Chart Data Processing
  // Group orders by day
  const salesByDate: { [key: string]: number } = {};
  orders
    .filter(o => o.status === 'confirmed')
    .forEach(order => {
      const dateKey = order.date.split('T')[0];
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + order.total;
    });

  // Ensure we have at least 5 days representation
  const chartData = Object.keys(salesByDate)
    .sort()
    .map(key => ({
      fecha: formatDate(key).split(',')[0], // Extract day.month.year without hour
      ventas: Math.round(salesByDate[key] * 100) / 100
    }));

  if (chartData.length === 0) {
    chartData.push({ fecha: 'Sin Ventas', ventas: 0 });
  }

  // Recharts Inventory Chart Data
  const inventoryData = products.map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    stock: p.stock
  }));

  // --- Handlers ---
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productPrice || !productStock || !productImage) {
      alert('Todos los campos son obligatorios para guardar el producto.');
      return;
    }

    const payload = {
      name: productName,
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
      description: productDescription,
      imageUrl: productImage,
    };

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...payload
      });
    } else {
      onAddProduct(payload);
    }

    closeProductModal();
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory('Accesorios');
    setProductPrice('');
    setProductStock('');
    setProductDescription('');
    setProductImage('');
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductCategory(prod.category);
    setProductPrice(prod.price.toString());
    setProductStock(prod.stock.toString());
    setProductDescription(prod.description);
    setProductImage(prod.imageUrl);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUsername || !userFullName || (!editingUser && !userPassword)) {
      alert('Es obligatorio rellenar el usuario, el nombre completo y la contraseña.');
      return;
    }

    if (editingUser) {
      const updates: Partial<User> = {
        fullName: userFullName,
        role: userRole,
      };
      if (userPassword) {
        updates.password = userPassword;
      }
      onUpdateUser(editingUser.id, updates);
    } else {
      onAddUser({
        fullName: userFullName,
        username: userUsername,
        role: userRole,
        password: userPassword
      });
    }

    closeUserModal();
  };

  const openAddUser = () => {
    setEditingUser(null);
    setUserUsername('');
    setUserFullName('');
    setUserRole('employee');
    setUserPassword('');
    setIsUserModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserUsername(u.username);
    setUserFullName(u.fullName);
    setUserRole(u.role);
    setUserPassword(''); // Keep empty unless updating secret password
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Session Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Módulo Operativo de Trabajo
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Plataforma de procesamiento comercial, control de inventario y alertas en vivo.
          </p>
        </div>
        
        {/* User Identity Banner */}
        <div className="flex items-center gap-3.5 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 self-start md:self-auto">
          <div className="h-10 w-10 bg-indigo-650 text-white flex items-center justify-center font-extrabold text-sm rounded-xl">
            {currentUser.fullName ? currentUser.fullName[0] : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{currentUser.fullName}</span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-300">
                {currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}
              </span>
            </div>
            <span className="text-[11px] text-slate-450 font-medium">Sesión iniciada vía OmniStore</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-900 pb-px">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'orders'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Pedidos</span>
          {pendingCount > 0 && (
            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-extrabold text-white shadow-lg border border-amber-500/30">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'products'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Productos</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'users'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Usuarios</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'security'
              ? 'border-indigo-400 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Alertas</span>
          {securityLogs.length > 0 && (
            <span className="ml-1.5 h-2.5 w-2.5 rounded-full bg-red-655 ring-4 ring-red-950/45 animate-pulse" />
          )}
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="mt-8">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Sales Sum */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-950/40 border border-emerald-900/30 text-emerald-450 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Ventas Confirmadas</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {formatCurrency(totalSalesAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-450 mt-0.5 block font-medium">De {confirmedCount} facturas procesadas</span>
                </div>
              </div>

              {/* Total Orders Status */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-950/40 border border-amber-900/30 text-amber-500 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-455 uppercase tracking-wider block">Pedidos Pendientes</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {pendingCount}
                  </span>
                  <span className="text-[10px] text-amber-400 mt-0.5 block font-medium">Requieren confirmación</span>
                </div>
              </div>

              {/* Critical Stock */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex items-center gap-4">
                <div className="h-12 w-12 bg-rose-955/40 border border-rose-900/30 text-rose-400 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Stock Crítico (≤ 5)</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {lowStockProducts.length}
                  </span>
                  <span className="text-[10px] text-rose-455 mt-0.5 block font-bold">Productos bajo mínimo</span>
                </div>
              </div>

              {/* Total Users/Emp */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Equipo de Trabajo</span>
                  <span className="text-xl font-extrabold text-white mt-1 block">
                    {users.length}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-medium">Asignados a cobros y compras</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Sales Chart */}
              <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-white text-sm">Evolución de Ventas Diarias</h3>
                    <p className="text-[11px] text-slate-455">Sumatoria progresiva de ingresos comerciales facturados.</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-950/45 border border-emerald-900/35 text-emerald-400 px-2.5 py-0.5 rounded-lg">En vivo</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="105%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <YAxis stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <Tooltip 
                        contentStyle={{ background: '#020617', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }}
                        itemStyle={{ color: '#34d399' }}
                      />
                      <Area type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory Chart */}
              <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-white text-sm">Estado de Stock de Inventario</h3>
                    <p className="text-[11px] text-slate-455">Control visual de existencias de cada artículo de la tienda.</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="105%">
                    <BarChart data={inventoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" height={45} strokeWidth={0} />
                      <YAxis stroke="#64748b" fontSize={11} strokeWidth={0} />
                      <Tooltip 
                        contentStyle={{ background: '#020617', borderRadius: '12px', border: '1px solid #1e293b', color: '#fff' }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Bar dataKey="stock" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                        {inventoryData.map((entry, index) => {
                          const stockNum = entry.stock;
                          return (
                            <Cell key={`cell-${index}`} fill={stockNum <= 3 ? '#ef4444' : stockNum <= 5 ? '#f59e0b' : '#312e81'} />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Critical Stock list alert warnings */}
            {lowStockProducts.length > 0 && (
              <div className="p-4 bg-amber-950/20 border border-amber-900/15 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">Advertencia de Inventario Mínimo</h4>
                  <p className="text-xs text-amber-400 mt-0.5 leading-relaxed">
                    Hay {lowStockProducts.length} productos cuyas existencias están por debajo del mínimo de seguridad. Considera aprovisionar existencias para evitar desabastecimientos:
                  </p>
                  <ul className="flex flex-wrap gap-2 mt-2.5">
                    {lowStockProducts.map(p => (
                      <li key={p.id} className="bg-slate-900 px-3/5 py-1.5 rounded-lg border border-amber-900/40 text-[10px] font-bold text-slate-300">
                        {p.name} • <span className="text-red-400 font-extrabold">{p.stock} pzas</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS (PEDIDOS) */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrar por Estado:</span>
                <div className="flex gap-1.5">
                  {['all', 'pending', 'confirmed', 'canceled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`text-[11px] font-bold uppercase rounded-lg px-3 py-1.5 transition-all ${
                        orderStatusFilter === st
                          ? 'bg-indigo-650 text-white shadow-md border border-indigo-500/20'
                          : 'bg-slate-905 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-850'
                      }`}
                    >
                      {st === 'all' && 'Todos'}
                      {st === 'pending' && 'Pendientes'}
                      {st === 'confirmed' && 'Confirmados'}
                      {st === 'canceled' && 'Cancelados'}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">{filteredOrders.length} pedidos encontrados</span>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-850 bg-slate-950 shadow-xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-900/20 text-[11px] font-bold uppercase tracking-wider text-slate-450">
                    <th className="py-4 px-5">Nº Factura / ID</th>
                    <th className="py-4 px-5">Cliente</th>
                    <th className="py-4 px-5">Fecha / Hora</th>
                    <th className="py-4 px-5 text-right">Monto Total</th>
                    <th className="py-4 px-5 text-center">Estado</th>
                    <th className="py-4 px-5">Operador Responsable</th>
                    <th className="py-4 px-5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs text-slate-300">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        No se encontraron registros de pedidos para la búsqueda seleccionada.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-4 px-5 font-mono font-bold text-indigo-400">{ord.invoiceNumber}</td>
                        <td className="py-4 px-5">
                          <span className="font-bold block text-white">{ord.clientDetails.name}</span>
                          <span className="text-[10px] text-slate-500">{ord.clientDetails.phone}</span>
                        </td>
                        <td className="py-4 px-5 text-slate-400">{formatDate(ord.date)}</td>
                        <td className="py-4 px-5 text-right font-extrabold text-white">
                          {formatCurrency(ord.total)}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            ord.status === 'confirmed'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                              : ord.status === 'canceled'
                              ? 'bg-rose-955/40 text-rose-400 border-rose-900/30'
                              : 'bg-amber-950/40 text-amber-400 border-amber-900/30'
                          }`}>
                            {ord.status === 'confirmed' && 'Confirmado'}
                            {ord.status === 'canceled' && 'Cancelado'}
                            {ord.status === 'pending' && 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-300">
                          {ord.processedBy ? (
                            <span>{ord.processedBy}</span>
                          ) : (
                            <span className="text-slate-500 font-normal italic">Sin procesar</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center font-bold">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedOrderDetail(ord)}
                              className="p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg border border-transparent hover:border-slate-800 transition-colors"
                              title="Detalles de Factura"
                            >
                              <FileText className="h-4 w-4" />
                            </button>

                            {ord.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => onProcessOrder(ord.id, 'confirmed', currentUser.fullName)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Confirmar Pedido"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('¿Estás seguro de cancelar este pedido de cliente?')) {
                                      onProcessOrder(ord.id, 'canceled', currentUser.fullName);
                                    }
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Cancelar Pedido"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS (PRODUCTOS CRUD) */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            {/* search and add controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nombre o categoría..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-medium"
                />
              </div>

              <button
                onClick={openAddProduct}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {/* Products interactive list */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-5">Imagen</th>
                    <th className="py-4 px-5">Nombre / ID</th>
                    <th className="py-4 px-5">Categoría</th>
                    <th className="py-4 px-5 text-right">Precio Unitario</th>
                    <th className="py-4 px-5 text-center">Stock Registrado</th>
                    <th className="py-4 px-5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        No se encontraron productos registrados en el inventario.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="py-3 px-5">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-10 w-10 object-cover rounded-lg border border-gray-100 bg-slate-50"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="py-3 px-5">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                        </td>
                        <td className="py-3 px-5 text-slate-500">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-extrabold text-slate-900">
                          {formatCurrency(p.price)}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className={`inline-flex rounded-lg px-2.5 py-1 font-sans text-xs font-bold leading-none ${
                            p.stock <= 5 
                              ? 'bg-rose-50 text-rose-600' 
                              : p.stock <= 10 
                              ? 'bg-amber-50 text-amber-600' 
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {p.stock} pzas
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="p-1 px-2 border border-gray-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Estás completamente seguro de borrar el artículo "${p.name}"?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className="p-1 px-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-[11px] font-bold flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Borrar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USERS / EMPS (USUARIOS CRUD - ADMIN ONLY RESTRICTION) */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
            {/* Restriction Warning if employee */}
            {!isAdmin ? (
              <div className="bg-slate-50 border border-gray-200 rounded-3xl p-8 max-w-xl mx-auto text-center mt-6">
                <div className="h-14 w-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Acceso del Administrador Restringido</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Por motivos de control de seguridad interna en el portal, únicamente el perfil del administrador principal (<span className="font-mono text-slate-900 font-bold bg-white px-1 border rounded-sm">admin</span>) posee las facultades requeridas para consultar el listado de nómina, crear cuentas, modificar credenciales o desvincular operarios de la tienda.
                </p>
                <div className="mt-5 p-3.5 bg-amber-50/70 border border-amber-50 rounded-2xl text-xs text-amber-700">
                  ⚠️ Por favor contacta al administrador de TI para realizar modificaciones.
                </div>
              </div>
            ) : (
              <>
                {/* Header Action panel */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-5 bg-white border border-gray-100 rounded-2xl gap-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Gestión de Personal de Ventas y Despacho</h3>
                    <p className="text-[11px] text-slate-400">Solo tú como Administrador Principal tienes acceso a este módulo.</p>
                  </div>
                  <button
                    onClick={openAddUser}
                    className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar Miembro</span>
                  </button>
                </div>

                {/* Team member tables */}
                <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-4 px-5">ID / Usuario</th>
                        <th className="py-4 px-5">Nombre Completo</th>
                        <th className="py-4 px-5">Rol Operativo</th>
                        <th className="py-4 px-5">Estado de Seguridad</th>
                        <th className="py-4 px-5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/10 transition-colors">
                          <td className="py-4 px-5">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">@{u.username}</span>
                          </td>
                          <td className="py-4 px-5 font-semibold text-slate-900">{u.fullName}</td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role === 'admin' ? 'Administrador' : 'Empleado'}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Operativo y Seguro
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditUser(u)}
                                className="p-1 px-2 border border-gray-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1.5"
                              >
                                <Key className="h-3 w-3" />
                                <span>Clave / Editar</span>
                              </button>
                              
                              {/* Cannot delete the default administrator admin */}
                              {u.username === 'admin' ? (
                                <span className="text-[10px] text-slate-400 italic font-semibold border border-transparent px-2">
                                  Sistema Principal
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Estás seguro de que quieres eliminar al usuario @${u.username} (${u.fullName})?`)) {
                                      onDeleteUser(u.id);
                                    }
                                  }}
                                  className="p-1 px-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Desvincular</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: SECURITY LOGS (ALERTAS DE SEGURIDAD) */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header controls with Clean-logs function */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-5 bg-white border border-gray-100 rounded-2xl gap-4 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Alertas e Intentos Fallidos de Autenticación</h3>
                <p className="text-[11px] text-slate-400">Control de anomalías, ataques de fuerza bruta y logins denegados.</p>
              </div>

              {onClearLogs && securityLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="flex items-center justify-center gap-1.5 border border-gray-250 text-slate-600 hover:bg-slate-50 font-semibold py-2 px-3.5 rounded-xl text-xs transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Vaciar Registro de Alertas</span>
                </button>
              )}
            </div>

            {/* Logs detail lists */}
            <div className="space-y-3.5">
              {securityLogs.length === 0 ? (
                <div className="border border-gray-100 bg-white rounded-3xl p-8 text-center max-w-sm mx-auto">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <h4 className="text-slate-850 font-bold text-sm">Registro de alertas completamente limpio</h4>
                  <p className="text-xs text-slate-400 mt-1">No se han registrado intentos fallidos de autenticación en las últimas sesiones.</p>
                </div>
              ) : (
                securityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border-l-4 border-rose-500 border-y border-r border-gray-150 p-4 rounded-r-2xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all hover:bg-slate-50/50"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded">
                            ACCESO DENEGADO
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            Usuario: <span className="font-mono text-slate-900 font-bold">"{log.username}"</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 items-center">
                          <span>Fecha: <b>{formatDate(log.timestamp)}</b></span>
                          <span className="hidden sm:inline">•</span>
                          <span>Dispositivo: <b>{log.device}</b></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end justify-center">
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg font-mono tracking-tight self-start md:self-auto">
                        IP: {log.ipAddress}
                      </span>
                      <span className="text-[10px] text-red-500 font-semibold mt-1">
                        Motivo: {log.failureReason}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- FORM MODALS --- */}

      {/* 1. PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Editar Producto del Inventario' : 'Añadir Nuevo Producto'}
              </h3>
              <button
                onClick={closeProductModal}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej. Mochila Premium Alquimia"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-800"
                />
              </div>

              {/* Category / price grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Categoría</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="Accesorios">Accesorios</option>
                    <option value="Audio">Audio</option>
                    <option value="Viaje">Viaje</option>
                    <option value="Periféricos">Periféricos</option>
                    <option value="Hogar">Hogar</option>
                  </select>
                </div>
                
                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="24.99"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unidades en Stock</label>
                <input
                  type="number"
                  required
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Descripción</label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve explicación para el cliente..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              {/* Image URL with standard placeholder options */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL de Imagen</label>
                <input
                  type="text"
                  required
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="flex-1 bg-white border border-gray-250 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Editar Clave / Perfil' : 'Dar de Alta Nuevo Miembro'}
              </h3>
              <button
                onClick={closeUserModal}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-5 space-y-4">
              {/* Username (Locked if editing) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre de Usuario (@)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="sofia.r"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none disabled:bg-slate-150 disabled:text-slate-500"
                />
              </div>

              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre y Apellidos</label>
                <input
                  type="text"
                  required
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  placeholder="Sofía Rodríguez Pérez"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rol de Sistema</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'admin' | 'employee')}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                >
                  <option value="employee">Empleado operativo</option>
                  <option value="admin">Administrador Principal</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {editingUser ? 'Contraseña Nueva (Dejar en blanco para no cambiar)' : 'Contraseña de Acceso'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeUserModal}
                  className="flex-1 bg-white border border-gray-255 text-slate-700 py-2.5 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ORDER INVOICE DETAILS MODAL */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-150 p-5 bg-slate-50">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Detalles de Factura Comercial</span>
                <h3 className="text-base font-mono font-bold text-slate-900 mt-0.5">
                  {selectedOrderDetail.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Bill Info and Items details list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Order status banner */}
              <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between font-semibold ${
                selectedOrderDetail.status === 'confirmed'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : selectedOrderDetail.status === 'canceled'
                  ? 'bg-rose-50 border-rose-100 text-rose-800'
                  : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                <span>Estado actual de la orden:</span>
                <span className="uppercase tracking-wider font-extrabold text-[10px] bg-white px-2.5 py-1 rounded-lg border shadow-xs inline-block">
                  {selectedOrderDetail.status === 'confirmed' && 'CONFIRMADO'}
                  {selectedOrderDetail.status === 'canceled' && 'CANCELADO'}
                  {selectedOrderDetail.status === 'pending' && 'PENDIENTE'}
                </span>
              </div>

              {/* Owner Info & Addresses */}
              <div className="space-y-3">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Detalles del Destinatario</span>
                <div className="bg-slate-50/50 p-4 border border-gray-100 rounded-2xl space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Cliente:</span>
                    <span className="text-slate-900 font-bold block mt-0.5">{selectedOrderDetail.clientDetails.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                    <div>
                      <span className="text-slate-400 block font-medium">Teléfono:</span>
                      <span className="text-slate-900 font-bold block mt-0.5">{selectedOrderDetail.clientDetails.phone}</span>
                    </div>
                    {selectedOrderDetail.clientDetails.nickname && (
                      <div>
                        <span className="text-slate-400 block font-medium">Apodo:</span>
                        <span className="text-emerald-700 font-bold block mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          {selectedOrderDetail.clientDetails.nickname}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-slate-400 block font-medium">Dirección de Entrega:</span>
                    <span className="text-slate-800 block mt-0.5 leading-relaxed font-semibold">
                      {selectedOrderDetail.clientDetails.address}
                    </span>
                  </div>
                  {selectedOrderDetail.clientDetails.reference && (
                    <div className="pt-2 border-t border-gray-100 text-[11px]">
                      <span className="text-slate-400 block font-medium">Punto de Referencia:</span>
                      <span className="text-slate-600 block mt-0.5 bg-amber-50 border border-amber-100/40 p-2 rounded-lg italic">
                        "{selectedOrderDetail.clientDetails.reference}"
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table inside invoice */}
              <div className="space-y-3">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Artículos Facturados</span>
                <div className="border border-gray-100 rounded-2xl overflow-hidden text-xs">
                  <div className="bg-slate-50 p-3 font-bold text-slate-500 border-b border-gray-100 grid grid-cols-12 gap-2 uppercase tracking-wide text-[9px]">
                    <span className="col-span-6">Descripción</span>
                    <span className="col-span-2 text-center">Cant.</span>
                    <span className="col-span-2 text-right">Unit.</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  
                  <div className="divide-y divide-gray-50">
                    {selectedOrderDetail.items.map((it) => (
                      <div key={it.product.id} className="p-3 grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-6 font-semibold text-slate-800 truncate">{it.product.name}</span>
                        <span className="col-span-2 text-center font-bold text-slate-600">{it.quantity} x</span>
                        <span className="col-span-2 text-right text-slate-500">{formatCurrency(it.product.price)}</span>
                        <span className="col-span-2 text-right font-bold text-slate-900">{formatCurrency(it.product.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50/50 p-3 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Monto Total de Compra:</span>
                    <span className="font-extrabold text-slate-950 text-base">{formatCurrency(selectedOrderDetail.total)}</span>
                  </div>
                </div>
              </div>

              {/* Operator details history if processed */}
              {selectedOrderDetail.processedBy && (
                <div className="p-3 bg-slate-50 border border-gray-150 rounded-xl text-xs text-slate-500 text-center font-medium">
                  💳 Pedido procesado por el operario: <span className="text-slate-900 font-bold">{selectedOrderDetail.processedBy}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 border-t border-gray-150 p-5 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="flex-1 bg-white border border-gray-250 text-slate-700 font-bold py-2.5 rounded-xl text-xs"
              >
                Cerrar Detalle
              </button>

              {selectedOrderDetail.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    onProcessOrder(selectedOrderDetail.id, 'confirmed', currentUser.fullName);
                    setSelectedOrderDetail(null);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm"
                >
                  Confirmar Cobro
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
