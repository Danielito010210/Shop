import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle, 
  HelpCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Product, User, Order, SecurityLog, CartItem, ClientDetails, OrderStatus } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_USERS, 
  INITIAL_ORDERS, 
  INITIAL_SECURITY_LOGS 
} from './data';
import { 
  getLocalStorageData, 
  setLocalStorageData, 
  generateInvoiceNumber, 
  formatCurrency 
} from './utils';

// Subcomponents
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartModal from './components/CartModal';
import LoginModal from './components/LoginModal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // --- Persistent Local Databases ---
  const [products, setProducts] = useState<Product[]>(() => 
    getLocalStorageData('omnistore_products', INITIAL_PRODUCTS)
  );
  const [users, setUsers] = useState<User[]>(() => 
    getLocalStorageData('omnistore_users', INITIAL_USERS)
  );
  const [orders, setOrders] = useState<Order[]>(() => 
    getLocalStorageData('omnistore_orders', INITIAL_ORDERS)
  );
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>(() => 
    getLocalStorageData('omnistore_security_logs', INITIAL_SECURITY_LOGS)
  );

  // --- Runtime View States ---
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Optionally hold session in standard session state
    const saved = sessionStorage.getItem('omnistore_session');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Shopping Cart & Overlay States ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [addedIndicators, setAddedIndicators] = useState<{ [productId: string]: boolean }>({});
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<string | null>(null);

  // --- Sync database with LocalStorage on mutation ---
  useEffect(() => {
    setLocalStorageData('omnistore_products', products);
  }, [products]);

  useEffect(() => {
    setLocalStorageData('omnistore_users', users);
  }, [users]);

  useEffect(() => {
    setLocalStorageData('omnistore_orders', orders);
  }, [orders]);

  useEffect(() => {
    setLocalStorageData('omnistore_security_logs', securityLogs);
  }, [securityLogs]);

  // --- Cart operations ---
  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((it) => it.product.id === product.id);
      if (existing) {
        // Guard stock capacity
        if (existing.quantity >= product.stock) {
          alert(`Disponibilidad máxima alcanzada. No hay más stock de ${product.name}`);
          return prevItems;
        }
        return prevItems.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });

    // Provide instant feedback animation
    setAddedIndicators((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIndicators((prev) => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prevItems) => {
      return prevItems
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null;
            // Check stock limits before adding
            if (delta > 0 && nextQty > it.product.stock) {
              alert('No se pueden añadir más unidades de las existentes en stock.');
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  // --- Checkout Processing ---
  const handleConfirmCheckout = (details: ClientDetails) => {
    if (cartItems.length === 0) return;

    const nextInvoice = generateInvoiceNumber(orders.length);
    const costTotal = cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      invoiceNumber: nextInvoice,
      clientDetails: details,
      items: cartItems,
      total: costTotal,
      status: 'pending',
      date: new Date().toISOString(),
    };

    // Deduct stock levels from Product inventory instantly
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const boughtItem = cartItems.find((ci) => ci.product.id === p.id);
        if (boughtItem) {
          return {
            ...p,
            // Guard inventory down is non-negative
            stock: Math.max(0, p.stock - boughtItem.quantity),
          };
        }
        return p;
      });
    });

    // Append to system orders list
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    setCartItems([]); // Reset customer cart
    setLastGeneratedInvoice(nextInvoice);
  };

  // --- Backoffice Actions ---
  const handleProcessOrder = (orderId: string, status: OrderStatus, workerName: string) => {
    setOrders((prevOrders) => {
      return prevOrders.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status,
            processedBy: workerName,
          };
        }
        return ord;
      });
    });
  };

  // --- Products CRUD handlers ---
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const payload: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [payload, ...prev]);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // --- Users CRUD handlers (Admin only) ---
  const handleAddUser = (newUser: Omit<User, 'id'> & { password?: string }) => {
    const payload: User = {
      id: `user-${Date.now()}`,
      fullName: newUser.fullName,
      username: newUser.username,
      role: newUser.role,
      password: newUser.password || 'temp123',
    };

    setUsers((prev) => [...prev, payload]);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // --- Authentications handlers ---
  const handleLoginSuccess = (operator: User) => {
    setCurrentUser(operator);
    sessionStorage.setItem('omnistore_session', JSON.stringify(operator));
    setCurrentView('admin');
  };

  const handleLoginFailure = (username: string, reason: string) => {
    // Generate a secure, simulated failed login audit logging event
    const generatedIp = `192.168.${Math.floor(Math.random() * 20) + 1}.${Math.floor(Math.random() * 240) + 15}`;
    const generatedDevice = navigator.userAgent.includes('Mobi') 
      ? 'Android OS • Brave Mobile' 
      : 'macOS • Google Chrome';

    const newAlert: SecurityLog = {
      id: `sec-${Date.now()}`,
      username: username || 'anonimo',
      timestamp: new Date().toISOString(),
      ipAddress: generatedIp,
      device: generatedDevice,
      failureReason: reason,
    };

    setSecurityLogs((prev) => [newAlert, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('omnistore_session');
    setCurrentView('store');
  };

  const handleClearLogs = () => {
    setSecurityLogs([]);
  };

  // Filter products catalog categories
  const categoriesList = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))];
  const catalogFiltered = selectedCategory === 'Todos'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const cartItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col text-slate-100 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentView={currentView}
        onChangeView={setCurrentView}
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLoginModal={() => setIsLoginOpen(true)}
      />

      {/* --- WORK OFFICE BACKSTAGE MODE --- */}
      {currentView === 'admin' && currentUser ? (
        <main className="flex-1 bg-[#030712]">
          <AdminPanel
            currentUser={currentUser}
            products={products}
            users={users}
            orders={orders}
            securityLogs={securityLogs}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onProcessOrder={handleProcessOrder}
            onClearLogs={handleClearLogs}
          />
        </main>
      ) : (
        /* --- STOREFRONT CUSTOMER MODE --- */
        <main className="flex-1 pb-20 animate-fade-in bg-[#030712]">
          
          {/* Aesthetic Hero Banner */}
          <div className="relative overflow-hidden bg-slate-950 border-b border-slate-900 text-white py-16 sm:py-24 px-4">
            {/* Ambient Background blur glows */}
            <div className="absolute top-[-30%] left-[-10%] w-[60%] h-[140%] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[120%] bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

            <div className="relative mx-auto max-w-5xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-950/65 border border-indigo-500/30 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300 backdrop-blur-md shadow-lg">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Catálogo Premium Seleccionado
              </span>
              
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-6xl font-sans lg:text-6xl bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-[1.1]">
                Eleva tu estilo de vida cotidiano.
              </h1>
              
              <p className="mx-auto mt-5 max-w-2xl text-xs sm:text-base text-slate-400 leading-relaxed font-sans">
                Explora productos de diseño de alta gama, fabricados con materiales nobles, precisión absoluta y un rendimiento premium garantizado.
              </p>

              {/* Promo alerts */}
              <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-indigo-400" />
                  Envío Express Asegurado
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-indigo-400" />
                  Garantía de Satisfacción Total
                </span>
              </div>
            </div>
          </div>

          {/* Catalog & Filter options */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
            
            {/* Section description */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Nuestra Colección Exclusiva</h2>
                <p className="text-sm text-slate-400 mt-1.5">Suma artículos directamente para comprobar la actualización inmediata de tu carrito.</p>
              </div>
              
              {/* Categories badge filter buttons */}
              <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold tracking-tight transition-all active:scale-95 border ${
                      selectedCategory === cat
                        ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Catalog Grid */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-10">
              {catalogFiltered.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={handleAddToCart}
                  addedIndicator={addedIndicators[prod.id] || false}
                />
              ))}
            </div>

            {catalogFiltered.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-sm text-slate-500 font-semibold">No hay artículos disponibles actualmente en esta categoría.</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 font-sans mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-widest bg-indigo-650 h-7 w-7 rounded-lg flex items-center justify-center border border-indigo-400/20">
              O
            </span>
            <span className="text-xs font-bold text-slate-300">OmniStore S.A. &copy; 2026</span>
          </div>
          <span className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            Diseñado con colores de contraste premium, tipografía neo-brutalista de corte ejecutivo y un cálculo inmediato de tasas y despacho dinámico de almacenes físicos.
          </span>
        </div>
      </footer>

      {/* --- OVERLAY MODALS --- */}

      {/* 1. SHOPPING CART FLOW */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onConfirmCheckout={handleConfirmCheckout}
        lastGeneratedInvoice={lastGeneratedInvoice}
      />

      {/* 2. LOGIN FOR OPERATIVES AND ADMINS */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onLoginFailure={handleLoginFailure}
        registeredUsers={users}
      />
    </div>
  );
}
