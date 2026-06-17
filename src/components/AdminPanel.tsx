import React, { useState, useEffect } from 'react';
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
  DollarSign,
  Settings,
  History,
  Sparkles,
  Upload,
  ArrowRight
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
import { Product, User, Order, SecurityLog, OrderStatus, VisitorLog } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { sha256 } from '../utils_crypto';

interface AdminPanelProps {
  currentUser: User;
  products: Product[];
  users: User[];
  orders: Order[];
  securityLogs: SecurityLog[];
  activityLogs: any[];
  storeConfig: any;
  categories: string[];
  dbConnected: boolean;
  visitorLogs: VisitorLog[];
  onAddCategory: (newCat: string) => void;
  onEditCategory: (oldCat: string, newCat: string) => void;
  onDeleteCategory: (catToDel: string) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddUser: (user: Omit<User, 'id'> & { password?: string }) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onProcessOrder: (orderId: string, status: OrderStatus, workerName: string) => void;
  onClearLogs?: () => void;
  onClearActivityLogs?: () => void;
  onClearOrders?: () => void;
  onUpdateStoreConfig: (config: any) => void;
  onRefreshSupabaseClient?: () => void;
}

export default function AdminPanel({
  currentUser,
  products,
  users,
  orders,
  securityLogs,
  activityLogs,
  storeConfig,
  categories,
  dbConnected,
  visitorLogs,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onProcessOrder,
  onClearLogs,
  onClearActivityLogs,
  onClearOrders,
  onUpdateStoreConfig,
  onRefreshSupabaseClient = () => {}
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Search/Filters states
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  
  // Visitor calendar filters
  const [visitorStartDate, setVisitorStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [visitorEndDate, setVisitorEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Create / Edit Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState(categories && categories.length > 0 ? categories[0] : 'Accesorios');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productImage, setProductImage] = useState('');
  
  // Discount Product Form States
  const [isOnSale, setIsOnSale] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('0');

  // Category management modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatOldName, setEditingCatOldName] = useState<string | null>(null);
  const [editingCatNewName, setEditingCatNewName] = useState('');

  // Store Configuration States
  const [tempStoreName, setTempStoreName] = useState(storeConfig?.storeName || 'Cubanos en Miami');
  const [tempContactNumber, setTempContactNumber] = useState(storeConfig?.contactNumber || '');
  const [tempWorkingHours, setTempWorkingHours] = useState(storeConfig?.workingHours || '');

  useEffect(() => {
    if (storeConfig) {
      setTempStoreName(storeConfig.storeName || 'Cubanos en Miami');
      setTempContactNumber(storeConfig.contactNumber || '');
      setTempWorkingHours(storeConfig.workingHours || '');
    }
  }, [storeConfig]);

  // Create / Edit User Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userUsername, setUserUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'gerente' | 'employee'>('employee');
  const [userPassword, setUserPassword] = useState('');

  // Product currency state
  const [productCurrency, setProductCurrency] = useState('CUP');

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Non-blocking custom alert/confirm dialog state
  const [customDialog, setCustomDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
    isConfirm: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false
  });

  const triggerAlert = (title: string, message: string) => {
    setCustomDialog({
      isOpen: true,
      title,
      message,
      isConfirm: false
    });
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      isConfirm: true
    });
  };

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
      triggerAlert('Atención', 'Todos los campos son obligatorios para guardar el producto.');
      return;
    }

    const payload = {
      name: productName,
      category: productCategory,
      price: parseFloat(productPrice),
      stock: parseInt(productStock),
      description: productDescription,
      imageUrl: productImage,
      isOnSale,
      discountPercent: isOnSale ? parseInt(discountPercent) || 0 : undefined,
      currency: productCurrency,
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
    setProductCategory(categories && categories.length > 0 ? categories[0] : 'Accesorios');
    setProductPrice('');
    setProductStock('');
    setProductDescription('');
    setProductImage('');
    setIsOnSale(false);
    setDiscountPercent('0');
    setProductCurrency('CUP');
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
    setIsOnSale(!!prod.isOnSale);
    setDiscountPercent(prod.discountPercent ? prod.discountPercent.toString() : '0');
    setProductCurrency(prod.currency || 'CUP');
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUsername || !userFullName || (!editingUser && !userPassword)) {
      triggerAlert('Atención', 'Es obligatorio rellenar el usuario, el nombre completo y la contraseña.');
      return;
    }

    if (userRole === 'gerente') {
      const otherGerentes = users.filter((u) => u.role === 'gerente' && (!editingUser || u.id !== editingUser.id));
      if (otherGerentes.length >= 2) {
        triggerAlert('Límite del Sistema', '🔒 Límite del Sistema: Solo se permite tener un máximo de 2 usuarios con el rol GERENTE.');
        return;
      }
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

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStoreConfig({
      storeName: tempStoreName,
      contactNumber: tempContactNumber,
      workingHours: tempWorkingHours,
    });
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerAlert('Campos Incompletos', 'Por favor complete todos los campos de contraseña.');
      return;
    }

    const hashedCurrent = sha256(currentPassword);
    if (hashedCurrent !== currentUser.password) {
      triggerAlert('Contraseña Incorrecta', 'La contraseña actual ingresada es incorrecta.');
      return;
    }

    if (newPassword.length < 6) {
      triggerAlert('Contraseña Débil', 'Por seguridad, la nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerAlert('Error de Coincidencia', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    onUpdateUser(currentUser.id, { password: newPassword });
    triggerAlert('Contraseña Actualizada', '🔑 Contraseña maestra de administración actualizada de forma segura y persistida en base de datos.');
    
    // Clear form inputs
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  // Daily visitor log filters and calculations
  const filteredVisitors = (visitorLogs || []).filter(log => {
    return log.createdDate >= visitorStartDate && log.createdDate <= visitorEndDate;
  });

  const visitsByDay = filteredVisitors.reduce((acc: { [key: string]: number }, curr) => {
    acc[curr.createdDate] = (acc[curr.createdDate] || 0) + 1;
    return acc;
  }, {});

  const sortedVisitsDaily = Object.keys(visitsByDay).sort().reverse();

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
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-300 font-sans">
                {currentUser.role === 'admin' && 'Administrador'}
                {currentUser.role === 'gerente' && 'Gerente'}
                {currentUser.role === 'employee' && 'Empleado'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dbConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${dbConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {dbConnected ? 'Base de Datos Conectada' : 'Base de Datos Desconectada'}
              </span>
            </div>
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

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
              activeTab === 'activities'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Movimientos Staff</span>
          </button>
        )}

        {(currentUser.role === 'admin' || currentUser.role === 'gerente') && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-all ${
              activeTab === 'settings'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </button>
        )}


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

            {/* PANEL ANALÍTICO Y USUARIOS EN LÍNEA (Solo para Admin y Gerente) */}
            {(currentUser.role === 'admin' || currentUser.role === 'gerente') && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visualizer and Statistics of Visitors */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <History className="h-5 w-5 text-indigo-400" />
                        Registro de Tráfico y Visitas Únicas
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Monitoreo de accesos de clientes a la tienda por día.
                      </p>
                    </div>
                    
                    {/* Date picker filters */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold uppercase text-slate-500 mb-1">Desde</label>
                        <input
                          type="date"
                          value={visitorStartDate}
                          onChange={(e) => setVisitorStartDate(e.target.value)}
                          className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[9px] font-bold uppercase text-slate-500 mb-1">Hasta</label>
                        <input
                          type="date"
                          value={visitorEndDate}
                          onChange={(e) => setVisitorEndDate(e.target.value)}
                          className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric and List */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="bg-indigo-950/20 border border-indigo-900/20 rounded-xl p-4 flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-455 block">Total de Visitas</span>
                      <span className="text-3xl font-black text-indigo-400 mt-2 block">{filteredVisitors.length}</span>
                      <span className="text-[10px] text-slate-450 mt-1 block leading-tight">En el rango de fechas seleccionado</span>
                    </div>

                    <div className="sm:col-span-3 overflow-hidden rounded-xl border border-slate-850 bg-[#020617]/40 max-h-48 overflow-y-auto">
                      <table className="min-w-full divide-y divide-slate-900">
                        <thead className="bg-slate-950/90 sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                            <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Visitas Reg.</th>
                            <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Métricas Relativas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 bg-transparent text-slate-300">
                          {sortedVisitsDaily.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-500">
                                No se encontraron registros de visitas en este rango de fechas.
                              </td>
                            </tr>
                          ) : (
                            sortedVisitsDaily.map(date => {
                              const count = visitsByDay[date];
                              const maxCount = Math.max(...Object.values(visitsByDay) as number[], 1);
                              const pct = Math.min((count / maxCount) * 100, 100);
                              return (
                                <tr key={date} className="hover:bg-slate-900/10 transition-all">
                                  <td className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-white">
                                    {formatDate(date)}
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs font-extrabold text-indigo-400">
                                    {count} {count === 1 ? 'visita' : 'visitas'}
                                  </td>
                                  <td className="px-4 py-2.5 text-xs">
                                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Live Online Users & Employees list */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-400 animate-pulse" />
                        Monitoreo en Línea
                      </h3>
                      <span className="flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-900/40 text-emerald-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        En Vivo
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Personal y administradores activos en el sistema (última actualización).
                    </p>

                    <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-1">
                      {users.filter(u => {
                        if (!u.lastSeen) return false;
                        const lastSeenTime = new Date(u.lastSeen).getTime();
                        const nowTime = new Date().getTime();
                        return Math.abs(nowTime - lastSeenTime) < 45000;
                      }).length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No hay personal activo en este momento.
                        </div>
                      ) : (
                        users.filter(u => {
                          if (!u.lastSeen) return false;
                          const lastSeenTime = new Date(u.lastSeen).getTime();
                          const nowTime = new Date().getTime();
                          return Math.abs(nowTime - lastSeenTime) < 45000;
                        }).map((u) => (
                          <div key={u.id} className="flex items-center justify-between bg-slate-950/50 border border-slate-850 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 bg-emerald-950 border border-emerald-900 text-emerald-400 flex items-center justify-center font-bold text-xs rounded-lg">
                                {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">{u.fullName}</span>
                                <span className="text-[10px] text-slate-400 block">@{u.username}</span>
                              </div>
                            </div>
                            <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-300">
                              {u.role === 'admin' ? 'Admin' : u.role === 'gerente' ? 'Gerente' : 'Empleado'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Límite de actualización: 15s</span>
                    <span>Total activos: <strong className="text-emerald-400">
                      {users.filter(u => {
                        if (!u.lastSeen) return false;
                        const lastSeenTime = new Date(u.lastSeen).getTime();
                        const nowTime = new Date().getTime();
                        return Math.abs(nowTime - lastSeenTime) < 45000;
                      }).length}
                    </strong></span>
                  </div>
                </div>
              </div>
            )}

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
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{filteredOrders.length} pedidos encontrados</span>
                {onClearOrders && orders.length > 0 && currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerConfirm(
                        'Vaciar Pedidos',
                        '¿Estás seguro de que deseas vaciar de forma permanente todo el historial de pedidos de cliente?',
                        onClearOrders
                      );
                    }}
                    className="flex items-center justify-center gap-1 bg-red-950/40 hover:bg-red-900/30 border border-red-900/40 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 whitespace-nowrap"
                    title="Vaciar Pedidos"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Vaciar Historial</span>
                  </button>
                )}
              </div>
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

              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                {(currentUser.role === 'admin' || currentUser.role === 'gerente') && (
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-2xs bg-white"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Gestionar Categorías</span>
                  </button>
                )}
                <button
                  onClick={openAddProduct}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all active:scale-95 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Producto</span>
                </button>
              </div>
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
                    <th className="py-4 px-5 text-center">Descuento / Promo</th>
                    <th className="py-4 px-5 text-center">Stock Registrado</th>
                    <th className="py-4 px-5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
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
                          {formatCurrency(p.price, p.currency)}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateProduct({
                                  ...p,
                                  isOnSale: !p.isOnSale,
                                  discountPercent: !p.isOnSale ? (p.discountPercent || 15) : undefined
                                });
                              }}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                p.isOnSale ? 'bg-amber-500' : 'bg-slate-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  p.isOnSale ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* Percentage input, visible only if toggle is on */}
                            {p.isOnSale ? (
                              <div className="flex items-center gap-1 animate-fade-in mt-0.5">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={p.discountPercent !== undefined ? p.discountPercent : 15}
                                  onChange={(e) => {
                                    const pct = parseInt(e.target.value);
                                    onUpdateProduct({
                                      ...p,
                                      isOnSale: true,
                                      discountPercent: isNaN(pct) ? 0 : Math.max(1, Math.min(99, pct))
                                    });
                                  }}
                                  className="w-10 text-center text-[10px] font-extrabold text-amber-950 bg-amber-50/50 border border-amber-200 rounded py-0.5 px-0.5 focus:outline-none"
                                />
                                <span className="text-[10px] text-amber-700 font-bold">%</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">Sin promo</span>
                            )}
                          </div>
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
                                triggerConfirm(
                                  'Eliminar Producto',
                                  `¿Estás completamente seguro de borrar el artículo "${p.name}"?`,
                                  () => onDeleteProduct(p.id)
                                );
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
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-900/30'
                                : u.role === 'gerente'
                                ? 'bg-amber-950 text-amber-300 border border-amber-900/30'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role === 'admin' && 'Administrador'}
                              {u.role === 'gerente' && 'Gerente'}
                              {u.role === 'employee' && 'Empleado'}
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
                                    triggerConfirm(
                                      'Eliminar Usuario',
                                      `¿Estás seguro de que quieres eliminar al usuario @${u.username} (${u.fullName})?`,
                                      () => onDeleteUser(u.id)
                                    );
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
                      <span className="text-xs font-bold text-slate-855 bg-slate-105 px-2.5 py-1 rounded-lg font-mono tracking-tight self-start md:self-auto">
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

        {/* TAB 6: ACTIVITIES (MOVIMIENTOS DE EMPLEADOS) - ADMIN ONLY */}
        {activeTab === 'activities' && currentUser.role === 'admin' && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-5 bg-slate-900 border border-slate-800 rounded-2xl gap-4 shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-white">Registro Confidencial de Movimientos de Empleados</h3>
                <p className="text-[11px] text-slate-400 mt-1">Bitácora electrónica segura para la auditoría de operaciones realizadas por el personal.</p>
              </div>

              {onClearActivityLogs && activityLogs.length > 0 && (
                <button
                  onClick={() => {
                    triggerConfirm(
                      'Vaciar Bitácora',
                      '¿Estás seguro de que deseas vaciar de forma permanentemente el registro electrónico de movimientos?',
                      onClearActivityLogs
                    );
                  }}
                  className="flex items-center justify-center gap-1.5 border border-slate-700 hover:border-slate-650 text-slate-300 bg-slate-950 font-semibold py-2 px-3.5 rounded-xl text-xs transition-colors whitespace-nowrap hover:bg-slate-800"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Vaciar Bitácora</span>
                </button>
              )}
            </div>

            <div className="border border-slate-800 bg-slate-900/40 rounded-2xl overflow-hidden shadow-lg">
              {!activityLogs || activityLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Aún no se registran movimientos ni actividades del personal en la base de datos de auditoría.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-5">Fecha y Hora</th>
                        <th className="py-3 px-5">Usuario</th>
                        <th className="py-3 px-5">Suceso u Acción</th>
                        <th className="py-3 px-5">Descripción Detallada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-xs text-slate-350">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-indigo-300">@{log.username}</span>
                              <span className="text-[10px] text-slate-400">{log.userFullName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 whitespace-nowrap">
                            <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                              log.action.includes('Crear') 
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/30'
                                : log.action.includes('Eliminar')
                                ? 'bg-rose-955/40 text-rose-400 border-rose-900/30'
                                : 'bg-indigo-950/60 text-indigo-400 border-indigo-900/30'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 leading-relaxed text-slate-300 max-w-xs font-medium">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: STORE CONFIGURATION (CONFIGURACIÓN) */}
        {(activeTab === 'settings') && (currentUser.role === 'admin' || currentUser.role === 'gerente') && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-5 bg-slate-900 border border-slate-700 rounded-2xl gap-4 shadow-sm">
              <div>
                <h3 className="text-sm font-extrabold text-white">Configuración Corporativa e Integraciones</h3>
                <p className="text-[11px] text-slate-200 mt-1">Gestione el nombre de la tienda, datos comerciales y la sincronización CDN con Cloudflare.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* PRIMARY STORE DETAILS SECTOR */}
                <form onSubmit={handleSettingsSubmit} className="bg-slate-900 border border-slate-705 p-6 rounded-2xl space-y-5 shadow-lg">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Datos Públicos de la Tienda</h4>
                    <p className="text-[10px] text-slate-350 mt-0.5">Al actualizar estos datos, se modificará el título de la página web automáticamente.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-100 mb-1.5 uppercase tracking-wider">Nombre del Sitio / Web</label>
                    <input
                      type="text"
                      required
                      value={tempStoreName}
                      onChange={(e) => setTempStoreName(e.target.value)}
                      placeholder="Ej. Cubanos en Miami"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-100 mb-1.5 uppercase tracking-wider">Número de Contacto / WhatsApp</label>
                    <input
                      type="text"
                      required
                      value={tempContactNumber}
                      onChange={(e) => setTempContactNumber(e.target.value)}
                      placeholder="Ej. +1 (305) 555-0199"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-100 mb-1.5 uppercase tracking-wider">Horario de Trabajo Comercial</label>
                    <input
                      type="text"
                      required
                      value={tempWorkingHours}
                      onChange={(e) => setTempWorkingHours(e.target.value)}
                      placeholder="Ej. Lunes a Sábado: 9:00 AM - 8:00 PM / Domingo: Cerrado"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-black py-3 px-6 rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all border border-indigo-500 active:scale-98 cursor-pointer"
                    >
                      Guardar Cambios Comerciales
                    </button>
                  </div>
                </form>

                {/* PERSONAL SECURITY PASSWORD CHANGE SECTOR */}
                <form onSubmit={handlePasswordChangeSubmit} className="bg-slate-900 border border-slate-705 p-6 rounded-2xl space-y-4 shadow-lg">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Key className="h-4 w-4 shrink-0" />
                      <span>Cambiar Contraseña de Acceso</span>
                    </h4>
                    <p className="text-[10px] text-slate-350 mt-0.5">Le permite cambiar la clave maestra de su cuenta para salvaguardar la cuenta.</p>
                  </div>

                  <div>
                    <label className="block text-10px font-extrabold text-slate-100 mb-1 uppercase tracking-wider">Contraseña Actual</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-10px font-extrabold text-slate-100 mb-1 uppercase tracking-wider">Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-10px font-extrabold text-slate-100 mb-1 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-600 text-white font-black py-3 px-6 rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all border border-indigo-500 active:scale-98 cursor-pointer"
                    >
                      Actualizar Mi Contraseña 🔑
                    </button>
                  </div>
                </form>
              </div>

              {/* SUPABASE STATUS AND INTEGRATION OVERVIEW */}
              <div className="bg-slate-900 border border-slate-705 p-6 rounded-2xl space-y-5 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Infraestructura Base de Datos (Supabase)</h4>
                      <p className="text-[10px] text-slate-350 mt-0.5">Persistencia de datos relacional Postgres con protección de nivel empresarial.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/30 animate-pulse">
                      PostgreSQL
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-250 leading-relaxed bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
                    <p className="font-bold text-[11px] text-white flex items-center gap-1.5">
                      <Database className="h-4 w-4 text-emerald-400" />
                      <span>Motor Relacional Activo</span>
                    </p>
                    <p className="text-[10.5px] text-slate-300">
                      Su sistema ahora utiliza <strong>Supabase</strong> para sincronizar e inmortalizar las ventas, los usuarios, las bitácoras de seguridad e inventario, eliminando la vulnerabilidad de pérdida de datos por caché del navegador.
                    </p>

                    <ul className="text-[10px] text-slate-400 space-y-2 pt-1 border-t border-slate-900">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Sincronización simultánea en la nube para inventario, precios y estados de entregas.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Gestión y encriptación de credenciales de operadores bajo algoritmos criptográficos.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Bitácora de movimientos y accesos imborrable para auditoría.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between gap-3 text-[10px] text-slate-400 leading-normal">
                    <div>
                      <span className="font-bold text-slate-200 block">¿Desea configurar o diagnosticar las tablas?</span>
                      <span className="block text-[9px] mt-0.5">Verifique el esquema, copie el script de tablas o siembre datos de prueba.</span>
                    </div>
                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('database')}
                        className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-400/30 text-indigo-300 rounded-xl text-[10.5px] font-black transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1"
                      >
                        <span>Ir a Panel DB</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[10.5px] text-slate-450 leading-relaxed italic">
                  💡 Su tienda está libre de bloqueos temporales de caché CDN (Cloudflare). Las transacciones de su embudo ocurren a nivel de backend directamente contra las tablas relacionales del estado en línea.
                </div>
              </div>
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
                <label className="block text-xs font-bold text-slate-750 mb-1.5">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ej. Mochila Premium Alquimia"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Category / price grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-755 mb-1.5">Categoría</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:outline-none"
                  >
                    {Array.from(new Set([...categories, productCategory])).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Price & Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-755 mb-1.5">Precio y Moneda</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="24.99"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:outline-none"
                    />
                    <select
                      value={productCurrency}
                      onChange={(e) => setProductCurrency(e.target.value)}
                      className="px-2 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs focus:bg-white focus:outline-none font-extrabold text-indigo-650"
                    >
                      <option value="CUP">CUP (🇨🇺)</option>
                      <option value="USD">USD (🇺🇸)</option>
                      <option value="EUR">EUR (🇪🇺)</option>
                      <option value="MLC">MLC (💳)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-bold text-slate-755 mb-1.5">Unidades en Stock</label>
                <input
                  type="number"
                  required
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-755 mb-1.5">Descripción</label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve explicación para el cliente..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-255 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:outline-none"
                />
              </div>

              {/* Image Input Selection: URL or Uploaded File */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-755">Imagen del Producto (URL o Cargar Archivo)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-... o Base64"
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-255 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:outline-none"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer gap-1.5 shrink-0 transition-colors">
                    <Upload className="h-3.5 w-3.5 text-indigo-650" />
                    <span>Subir...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setProductImage(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {productImage && (
                  <div className="mt-2 text-center bg-gray-55/70 p-2 rounded-xl border border-dashed border-gray-300 flex items-center justify-between gap-3 animate-fade-in">
                    <img 
                      src={productImage} 
                      alt="Vista previa" 
                      className="h-10 w-10 object-cover rounded-lg border border-gray-200" 
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                    />
                    <span className="text-[10px] text-slate-550 truncate max-w-[200px] font-mono">
                      {productImage.startsWith('data:') ? 'Imagen cargada en Base64' : productImage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProductImage('')}
                      className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer pr-1"
                    >
                      Limpiar
                    </button>
                  </div>
                )}
              </div>

              {/* Discount / Sales Checkbox */}
              <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnSale}
                    onChange={(e) => setIsOnSale(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-650 focus:ring-indigo-500 border-gray-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Ofrecer descuento especial</span>
                    <span className="text-[10px] text-slate-500 block">Activa una promoción de oferta sobre el precio real</span>
                  </div>
                </label>

                {isOnSale && (
                  <div className="animate-fade-in pt-1">
                    <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wide mb-1">Porcentaje de Descuento (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      required={isOnSale}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      placeholder="Ej. 15"
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                )}
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

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-650" />
                <h3 className="text-base font-bold text-slate-900">
                  Gestión de Categorías
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setNewCatName('');
                  setEditingCatOldName(null);
                }}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-150 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Content panel */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Insert Category form */}
              <div className="bg-slate-50 border border-slate-205 rounded-xl p-3.5">
                <label className="block text-xs font-bold text-slate-800 mb-2">Crear nueva categoría</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Deporte, Oficina..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-slate-950 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCatName.trim();
                      if (!trimmed) {
                        triggerAlert('Atención', 'Por favor ingrese un nombre de categoría válido.');
                        return;
                      }
                      if (categories.includes(trimmed)) {
                        triggerAlert('Duplicado', 'Esta categoría ya se encuentra registrada.');
                        return;
                      }
                      onAddCategory(trimmed);
                      setNewCatName('');
                    }}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              {/* List of categories */}
              <div className="space-y-2">
                <span className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">Categorías Registradas</span>
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const productCount = products.filter((p) => p.category === cat).length;
                    const isCurrentlyEditing = editingCatOldName === cat;

                    return (
                      <div key={cat} className="flex items-center justify-between py-2.5">
                        {isCurrentlyEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingCatNewName}
                              onChange={(e) => setEditingCatNewName(e.target.value)}
                              className="flex-1 px-2.5 py-1 bg-white border border-indigo-300 rounded-lg text-xs focus:outline-none text-slate-800 font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const trimmed = editingCatNewName.trim();
                                if (!trimmed) {
                                  triggerAlert('Atención', 'El nombre de la categoría no puede estar vacío.');
                                  return;
                                }
                                if (trimmed === cat) {
                                  setEditingCatOldName(null);
                                  return;
                                }
                                if (categories.includes(trimmed) && trimmed !== cat) {
                                  triggerAlert('Duplicado', 'Esa categoría ya existe.');
                                  return;
                                }
                                onEditCategory(cat, trimmed);
                                setEditingCatOldName(null);
                              }}
                              className="p-1 border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                              title="Guardar nombre"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatOldName(null)}
                              className="p-1 border border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg"
                              title="Cancelar"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{cat}</span>
                              <span className="px-2 py-0.5 text-[9px] font-extrabold bg-slate-105 text-slate-605 rounded-full border border-slate-200">
                                {productCount} {productCount === 1 ? 'prod' : 'prods'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatOldName(cat);
                                  setEditingCatNewName(cat);
                                }}
                                className="p-2 text-indigo-950 hover:text-white bg-indigo-150 hover:bg-indigo-700 border-2 border-indigo-700 rounded-xl transition-all shadow-sm font-black flex items-center justify-center cursor-pointer"
                                title="Editar Categoría"
                              >
                                <Edit2 className="h-4 w-4 stroke-[2.5]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (productCount > 0) {
                                    triggerConfirm(
                                      'Eliminar Categoría',
                                      `La categoría "${cat}" tiene ${productCount} productos asociados. Si la eliminas, todos estos productos serán asignados de forma automática a otra categoría disponible. ¿Deseas continuar?`,
                                      () => onDeleteCategory(cat)
                                    );
                                  } else {
                                    triggerConfirm(
                                      'Eliminar Categoría',
                                      `¿Eliminar la categoría "${cat}"?`,
                                      () => onDeleteCategory(cat)
                                    );
                                  }
                                }}
                                className="p-2 text-rose-950 hover:text-white bg-rose-100 hover:bg-rose-700 border-2 border-rose-650 rounded-xl transition-all shadow-sm font-black flex items-center justify-center cursor-pointer"
                                title="Eliminar Categoría"
                              >
                                <Trash2 className="h-4 w-4 stroke-[2.5]" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-slate-50 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setNewCatName('');
                  setEditingCatOldName(null);
                }}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
              >
                Cerrar Panel
              </button>
            </div>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de Usuario (@)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="sofia.r"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none disabled:bg-slate-150 disabled:text-slate-500"
                />
              </div>

              {/* Full name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre y Apellidos</label>
                <input
                  type="text"
                  required
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  placeholder="Sofía Rodríguez Pérez"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rol de Sistema</label>
                {editingUser?.username === 'admin' ? (
                  <div className="w-full px-3.5 py-2 bg-slate-100 border border-slate-250 rounded-xl text-xs text-slate-700 font-bold">
                    Administrador Principal (Rol Maestro)
                  </div>
                ) : (
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as 'admin' | 'gerente' | 'employee')}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="employee">Empleado Operativo</option>
                    <option value="gerente">GERENTE (Control Total sin Bitácora)</option>
                  </select>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {editingUser ? 'Contraseña Nueva (Dejar en blanco para no cambiar)' : 'Contraseña de Acceso'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-250 rounded-xl text-xs text-slate-950 font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
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
                        <span className="col-span-2 text-right text-slate-500">{formatCurrency(it.product.price, it.product.currency)}</span>
                        <span className="col-span-2 text-right font-bold text-slate-900">{formatCurrency(it.product.price * it.quantity, it.product.currency)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50/50 p-3 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">Monto Total de Compra:</span>
                    <span className="font-extrabold text-slate-950 text-base">
                      {(() => {
                        const totals: { [cur: string]: number } = {};
                        selectedOrderDetail.items.forEach((it) => {
                          const cur = it.product.currency || 'CUP';
                          totals[cur] = (totals[cur] || 0) + (it.product.price * it.quantity);
                        });
                        const keys = Object.keys(totals);
                        if (keys.length === 0) return formatCurrency(selectedOrderDetail.total, 'CUP');
                        return keys.map((k) => formatCurrency(totals[k], k)).join(' + ');
                      })()}
                    </span>
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
      {/* 4. NON-BLOCKING CUSTOM DIALOG (Alert/Confirm replacement) */}
      {customDialog.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-5 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${customDialog.isConfirm ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50/60 text-indigo-650'}`}>
                {customDialog.isConfirm ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-5 w-5 animate-pulse" />
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{customDialog.title}</h3>
            </div>
            
            <p className="text-xs text-slate-900 font-extrabold leading-relaxed mb-5">
              {customDialog.message}
            </p>

            <div className="flex gap-3 mt-auto">
              {customDialog.isConfirm ? (
                <>
                  <button
                    type="button"
                    onClick={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 bg-white border border-gray-255 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    Retroceder
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (customDialog.onConfirm) customDialog.onConfirm();
                      setCustomDialog(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-colors"
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
                  className="w-full bg-indigo-650 hover:bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
