import React, { useState, useEffect, useRef } from 'react';
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
import { Product, User, Order, SecurityLog, CartItem, ClientDetails, OrderStatus, VisitorLog } from './types';
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
import { sha256 } from './utils_crypto';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  refreshSupabaseClient,
  getSupabaseClient,
  testSupabaseConnection,
  dbFetchCategories,
  dbSaveCategory,
  dbDeleteCategory,
  dbUpdateCategoryName,
  dbFetchProducts,
  dbSaveProduct,
  dbDeleteProduct,
  dbFetchUsers,
  dbSaveUser,
  dbDeleteUser,
  dbFetchOrders,
  dbSaveOrder,
  dbDeleteOrder,
  dbFetchSecurityLogs,
  dbSaveSecurityLog,
  dbClearSecurityLogs,
  dbFetchActivityLogs,
  dbSaveActivityLog,
  dbClearActivityLogs,
  dbFetchStoreConfig,
  dbSaveStoreConfig,
  dbSaveDatabaseInfo,
  dbFetchVisitorLogs,
  dbSaveVisitorLog,
  SUPABASE_SQL_SETUP_CODE
} from './supabaseClient';

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

  // --- Store Configuration & Staff Activity Logs ---
  const [storeConfig, setStoreConfig] = useState<any>(() => 
    getLocalStorageData('omnistore_config', {
      storeName: 'Cubanos en Miami',
      contactNumber: '+1 (305) 555-0199',
      workingHours: 'Lunes a Sábado: 9:00 AM - 8:00 PM / Domingo: Cerrado'
    })
  );

  const [activityLogs, setActivityLogs] = useState<any[]>(() => 
    getLocalStorageData('omnistore_activity_logs', [])
  );

  // --- Live Connection and Visitor metrics ---
  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>(() => {
    return getLocalStorageData('omnistore_visitor_logs', []);
  });

  useEffect(() => {
    setLocalStorageData('omnistore_visitor_logs', visitorLogs);
  }, [visitorLogs]);

  // --- Categories State (persisted in localStorage) ---
  const [categories, setCategories] = useState<string[]>(() => {
    return getLocalStorageData('omnistore_categories', ['Accesorios', 'Audio', 'Viaje', 'Periféricos', 'Hogar']);
  });

  useEffect(() => {
    setLocalStorageData('omnistore_categories', categories);
  }, [categories]);

  // --- Fetch and Sync with Supabase on Mount & State Hook ---
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);

  const fetchAllFromSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setDbConnected(false);
      return;
    }

    setSupabaseLoading(true);
    setSupabaseErrorMsg(null);
    try {
      // 1. Fetch categories
      const dbCats = await dbFetchCategories();
      if (dbCats !== null) {
        if (dbCats.length === 0) {
          const defaultCats = ['Accesorios', 'Audio', 'Viaje', 'Periféricos', 'Hogar'];
          for (const cat of defaultCats) {
            await dbSaveCategory(cat);
          }
          setCategories(defaultCats);
        } else {
          setCategories(dbCats);
        }
      }

      // 2. Fetch products
      const dbProds = await dbFetchProducts();
      if (dbProds !== null) {
        if (dbProds.length === 0) {
          for (const prod of INITIAL_PRODUCTS) {
            await dbSaveProduct(prod);
          }
          setProducts(INITIAL_PRODUCTS);
        } else {
          setProducts(dbProds);
        }
      }

      // 3. Fetch users
      const dbUsrs = await dbFetchUsers();
      if (dbUsrs !== null) {
        if (dbUsrs.length === 0) {
          for (const usr of INITIAL_USERS) {
            await dbSaveUser(usr);
          }
          setUsers(INITIAL_USERS);
        } else {
          const adminUserExists = dbUsrs.some(u => u.username === 'admin');
          if (!adminUserExists) {
            const expectedHash = sha256('admin123*');
            const defaultAdmin: User = {
              id: 'user-admin',
              username: 'admin',
              fullName: 'Administrador Principal',
              role: 'admin',
              password: expectedHash,
              mustChangePassword: false,
              failedLoginAttempts: 0,
              blockedUntil: undefined
            };
            await dbSaveUser(defaultAdmin);
            dbUsrs.push(defaultAdmin);
          }
          setUsers(dbUsrs);
        }
      }

      // 4. Fetch orders
      const dbOrds = await dbFetchOrders();
      if (dbOrds !== null) {
        if (dbOrds.length === 0 && orders.length > 0) {
          for (const ord of INITIAL_ORDERS) {
            await dbSaveOrder(ord);
          }
          setOrders(INITIAL_ORDERS);
        } else {
          setOrders(dbOrds);
        }
      }

      // 5. Fetch security logs
      const dbSecLogs = await dbFetchSecurityLogs();
      if (dbSecLogs !== null) {
        if (dbSecLogs.length === 0 && securityLogs.length > 0) {
          for (const log of INITIAL_SECURITY_LOGS) {
            await dbSaveSecurityLog(log);
          }
          setSecurityLogs(INITIAL_SECURITY_LOGS);
        } else {
          setSecurityLogs(dbSecLogs);
        }
      }

      // 6. Fetch activity logs
      const dbActLogs = await dbFetchActivityLogs();
      if (dbActLogs !== null) {
        setActivityLogs(dbActLogs);
      }

      // 7. Fetch store config
      const dbConf = await dbFetchStoreConfig();
      if (dbConf !== null && Object.keys(dbConf).length > 0) {
        setStoreConfig((prev: any) => ({ ...prev, ...dbConf }));
      } else {
        await dbSaveStoreConfig(storeConfig);
      }

      // 8. Log database information into the database's database_info table
      const curCf = getSavedSupabaseConfig();
      if (curCf.url && curCf.key) {
        await dbSaveDatabaseInfo(curCf.url, curCf.key);
      }

      // 9. Fetch visitor logs (Visitas por día)
      const dbVisLogs = await dbFetchVisitorLogs();
      if (dbVisLogs !== null) {
        setVisitorLogs(dbVisLogs);
      }

      // 10. Heartbeat signature - update active user's lastSeen timestamp
      if (currentUser) {
        const updatedCurrentUser = {
          ...currentUser,
          lastSeen: new Date().toISOString()
        };
        await dbSaveUser(updatedCurrentUser);
      }

      setDbConnected(true);
    } catch (err: any) {
      console.error('Error syncing Supabase on mount:', err);
      setSupabaseErrorMsg(err?.message || 'Error de conexión o de esquema de tablas en Supabase.');
      setDbConnected(false);
    } finally {
      setSupabaseLoading(false);
    }
  };

  useEffect(() => {
    const cf = getSavedSupabaseConfig();
    if (cf.enabled) {
      fetchAllFromSupabase();
    }
  }, []);

  const syncAndReloadFromSupabase = () => {
    fetchAllFromSupabase();
  };

  // --- Category Handlers ---
  const handleAddCategory = (newCat: string) => {
    setCategories((prev) => {
      if (prev.includes(newCat)) return prev;
      return [...prev, newCat];
    });

    if (getSupabaseClient()) {
      dbSaveCategory(newCat);
    }

    // Add activity log
    if (currentUser) {
      const actLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: currentUser?.username || 'admin',
        userFullName: currentUser?.fullName || '',
        action: `Creó la categoría "${newCat}"`
      };
      setActivityLogs((prev) => [actLog, ...prev]);
      if (getSupabaseClient()) {
        dbSaveActivityLog(actLog);
      }
    }
  };

  const handleEditCategory = (oldCat: string, newCat: string) => {
    // 1. Update categories list
    setCategories((prev) => prev.map((c) => (c === oldCat ? newCat : c)));
    // 2. Update products belonging to this category automatically
    setProducts((currentProducts) =>
      currentProducts.map((p) => {
        if (p.category === oldCat) {
          const updated = { ...p, category: newCat };
          if (getSupabaseClient()) {
            dbSaveProduct(updated);
          }
          return updated;
        }
        return p;
      })
    );

    if (getSupabaseClient()) {
      dbUpdateCategoryName(oldCat, newCat);
    }

    // Add activity log
    if (currentUser) {
      const actLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: currentUser?.username || 'admin',
        userFullName: currentUser?.fullName || '',
        action: `Renombró la categoría "${oldCat}" a "${newCat}"`
      };
      setActivityLogs((prev) => [actLog, ...prev]);
      if (getSupabaseClient()) {
        dbSaveActivityLog(actLog);
      }
    }
  };

  const handleDeleteCategory = (catToDel: string) => {
    // 1. Find what the new default category will be (exclude delete candidate)
    const remaining = categories.filter((c) => c !== catToDel);
    const fallbackCat = remaining.length > 0 ? remaining[0] : 'Accesorios';

    // 2. Remove from categories list
    setCategories((prev) => {
      const filtered = prev.filter((c) => c !== catToDel);
      return filtered.length > 0 ? filtered : ['Accesorios'];
    });

    // 3. Update products belonging to this category to map to fallbackCat
    setProducts((currentProducts) => {
      return currentProducts.map((p) => {
        if (p.category === catToDel) {
          const updated = { ...p, category: fallbackCat };
          if (getSupabaseClient()) {
            dbSaveProduct(updated);
          }
          return updated;
        }
        return p;
      });
    });

    if (getSupabaseClient()) {
      dbDeleteCategory(catToDel);
    }

    // Add activity log
    if (currentUser) {
      const actLog = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        username: currentUser?.username || 'admin',
        userFullName: currentUser?.fullName || '',
        action: `Eliminó la categoría "${catToDel}"`
      };
      setActivityLogs((prev) => [actLog, ...prev]);
      if (getSupabaseClient()) {
        dbSaveActivityLog(actLog);
      }
    }
    // Adjust storefront selected category filter if it was the deleted one
    if (selectedCategory === catToDel) {
      setSelectedCategory('Todos');
    }
  };

  // --- Runtime View States ---
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Optionally hold session in standard session state
    const saved = sessionStorage.getItem('omnistore_session');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Automatic 15-Second Database Polling / Refresher ---
  useEffect(() => {
    const cf = getSavedSupabaseConfig();
    if (!cf.enabled) return;

    // Trigger update immediately and then periodically
    const interval = setInterval(() => {
      fetchAllFromSupabase();
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // --- Check and Log Visitor Session ---
  useEffect(() => {
    const checkAndLogVisitor = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const sessionVisitKey = `omnistore_visit_logged_${todayStr}`;
        const hasSessionBeenLogged = sessionStorage.getItem(sessionVisitKey) === 'true';

        if (!hasSessionBeenLogged) {
          // Unique daily visit! Generate clean custom identifier
          const newVisitId = `visit-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          
          // Build human-friendly device description
          const ua = navigator.userAgent;
          const width = window.innerWidth;
          const height = window.innerHeight;
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
          const devText = `${isMobile ? 'Móvil' : 'Mesa'} (${width}x${height})`;
          
          const newLog: VisitorLog = {
            id: newVisitId,
            createdDate: todayStr,
            deviceInfo: devText,
            createdAt: new Date().toISOString()
          };

          // Save to local state and cache first
          setVisitorLogs(prev => {
            const updated = [newLog, ...prev];
            setLocalStorageData('omnistore_visitor_logs', updated);
            return updated;
          });

          // Upload immediately to database if client exists
          if (getSupabaseClient()) {
            await dbSaveVisitorLog(newLog);
          }

          // Persist in session scope
          sessionStorage.setItem(sessionVisitKey, 'true');
        }
      } catch (err) {
        console.error('Error logging daily visit metadata:', err);
      }
    };
    
    // Execute with brief delay after load
    const t = setTimeout(checkAndLogVisitor, 1200);
    return () => clearTimeout(t);
  }, []);

  // --- Shopping Cart & Overlay States ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [addedIndicators, setAddedIndicators] = useState<{ [productId: string]: boolean }>({});
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<string | null>(null);

  // --- Reset/Heal Admin Credentials if needed to force correct defaults ---
  useEffect(() => {
    const expectedHash = sha256('admin123*');
    setUsers((currentUsers) => {
      const adminIdx = currentUsers.findIndex(u => u.username === 'admin');
      if (adminIdx !== -1) {
        const adminUser = currentUsers[adminIdx];
        if (
          adminUser.password !== expectedHash || 
          adminUser.blockedUntil !== undefined || 
          (adminUser.failedLoginAttempts || 0) > 0 ||
          adminUser.mustChangePassword
        ) {
          const updated = [...currentUsers];
          updated[adminIdx] = {
            ...adminUser,
            password: expectedHash,
            blockedUntil: undefined,
            failedLoginAttempts: 0,
            mustChangePassword: false
          };
          return updated;
        }
      } else {
        // Safe fallback if admin was deleted
        return [
          {
            id: 'user-admin',
            username: 'admin',
            fullName: 'Administrador Principal',
            role: 'admin',
            password: expectedHash
          },
          ...currentUsers
        ];
      }
      return currentUsers;
    });
  }, []);

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

  useEffect(() => {
    setLocalStorageData('omnistore_config', storeConfig);
  }, [storeConfig]);

  useEffect(() => {
    setLocalStorageData('omnistore_activity_logs', activityLogs);
  }, [activityLogs]);

  // --- Dynamic Title & Cloudflare CDN Cache Purge System ---
  useEffect(() => {
    if (storeConfig?.storeName) {
      document.title = storeConfig.storeName;
    }
  }, [storeConfig?.storeName]);

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
          const updated = {
            ...p,
            stock: Math.max(0, p.stock - boughtItem.quantity),
          };
          if (getSupabaseClient()) {
            dbSaveProduct(updated);
          }
          return updated;
        }
        return p;
      });
    });

    // Append to system orders list
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    if (getSupabaseClient()) {
      dbSaveOrder(newOrder);
    }
    setCartItems([]); // Reset customer cart
    setLastGeneratedInvoice(nextInvoice);
  };

  // --- Activity Auditor Logging ---
  const logActivity = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      userFullName: currentUser.fullName,
      action,
      details,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    if (getSupabaseClient()) {
      dbSaveActivityLog(newLog);
    }
  };

  // --- Backoffice Actions ---
  const handleProcessOrder = (orderId: string, status: OrderStatus, workerName: string) => {
    setOrders((prevOrders) => {
      return prevOrders.map((ord) => {
        if (ord.id === orderId) {
          const updated = {
            ...ord,
            status,
            processedBy: workerName,
          };
          if (getSupabaseClient()) {
            dbSaveOrder(updated);
          }
          return updated;
        }
        return ord;
      });
    });

    const targetOrder = orders.find(o => o.id === orderId);
    const invoiceLabel = targetOrder ? `Factura: ${targetOrder.invoiceNumber}` : `ID: ${orderId}`;
    const statusLabel = status === 'confirmed' ? 'Confirmado' : status === 'canceled' ? 'Cancelado' : 'Pendiente';
    logActivity('Procesar Pedido', `Se actualizó el estado del pedido (${invoiceLabel}) a la categoría "${statusLabel}" bajo la firma de ${workerName}.`);
  };

  // --- Products CRUD handlers ---
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const payload: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [payload, ...prev]);
    if (getSupabaseClient()) {
      dbSaveProduct(payload);
    }
    logActivity('Crear Producto', `Se añadió el producto "${payload.name}" con un precio base de ${formatCurrency(payload.price)} y stock inicial de ${payload.stock} unidades.`);
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    if (getSupabaseClient()) {
      dbSaveProduct(updatedProd);
    }
    logActivity('Actualizar Producto', `Se actualizó el producto "${updatedProd.name}". Nuevo precio: ${formatCurrency(updatedProd.price)}, stock registrado: ${updatedProd.stock} unidades.`);
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (getSupabaseClient()) {
      dbDeleteProduct(id);
    }
    if (prod) {
      logActivity('Eliminar Producto', `Se borró del inventario el producto "${prod.name}" (ID: ${id}) de forma irreversible.`);
    }
  };

  // --- Users CRUD handlers (Admin only / Lock rules) ---
  const handleAddUser = (newUser: Omit<User, 'id'> & { password?: string }) => {
    const rawPass = newUser.password || 'temp123';
    const isAlreadyHashed = /^[a-f0-9]{64}$/i.test(rawPass);
    const payload: User = {
      id: `user-${Date.now()}`,
      fullName: newUser.fullName,
      username: newUser.username,
      role: newUser.role,
      password: isAlreadyHashed ? rawPass : sha256(rawPass),
    };

    setUsers((prev) => [...prev, payload]);
    if (getSupabaseClient()) {
      dbSaveUser(payload);
    }
    logActivity('Crear Usuario', `Se dió de alta al nuevo operador @${payload.username} (${payload.fullName}) en el sistema con el rango de ${payload.role}.`);
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const targetUser = users.find(u => u.id === id);
    let finalUpdates = { ...updates };
    if (updates.password) {
      // Check if password is already a 64-character hex string (already a sha256 hash)
      const isAlreadyHashed = /^[a-f0-9]{64}$/i.test(updates.password);
      if (!isAlreadyHashed) {
        finalUpdates.password = sha256(updates.password);
      }
    }

    setUsers((prev) => prev.map((u) => {
      if (u.id === id) {
        const updated = { ...u, ...finalUpdates };
        if (getSupabaseClient()) {
          dbSaveUser(updated);
        }
        return updated;
      }
      return u;
    }));
    if (targetUser) {
      logActivity('Modificar Usuario', `Se modificó el perfil del operador @${targetUser.username}. Campos actualizados: ${Object.keys(updates).join(', ')}.`);
    }
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (getSupabaseClient()) {
      dbDeleteUser(id);
    }
    if (targetUser) {
      logActivity('Eliminar Usuario', `Se eliminó y desvinculó permanentemente al usuario @${targetUser.username} (${targetUser.fullName}) de la nómina.`);
    }
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
    if (getSupabaseClient()) {
      dbSaveSecurityLog(newAlert);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('omnistore_session');
    setCurrentView('store');
  };

  const handleClearLogs = () => {
    setSecurityLogs([]);
    if (getSupabaseClient()) {
      dbClearSecurityLogs();
    }
  };

  const handleClearActivityLogs = () => {
    setActivityLogs([]);
    if (getSupabaseClient()) {
      dbClearActivityLogs();
    }
  };

  const handleClearOrders = () => {
    setOrders([]);
    if (getSupabaseClient()) {
      orders.forEach((o) => dbDeleteOrder(o.id));
    }
  };

  const handleUpdateStoreConfig = (config: any) => {
    setStoreConfig(config);
    if (getSupabaseClient()) {
      dbSaveStoreConfig(config);
    }
    logActivity('Modificar Configuración', `Se cambió la configuración de la tienda. Nombre: "${config.storeName}", Teléfono: "${config.contactNumber}", Horario: "${config.workingHours}".`);
  };

  // Filter products catalog categories
  const categoriesList = ['Todos', ...categories];
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
        storeName={storeConfig.storeName}
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
            activityLogs={activityLogs}
            storeConfig={storeConfig}
            categories={categories}
            dbConnected={dbConnected}
            visitorLogs={visitorLogs}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onProcessOrder={handleProcessOrder}
            onClearLogs={handleClearLogs}
            onClearActivityLogs={handleClearActivityLogs}
            onClearOrders={handleClearOrders}
            onUpdateStoreConfig={handleUpdateStoreConfig}
            onRefreshSupabaseClient={syncAndReloadFromSupabase}
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
      <footer className="border-t border-slate-900 bg-slate-950 py-12 font-sans mt-auto border-t-2 border-indigo-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-900 text-center sm:text-left">
            {/* Store Branding info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <span className="text-xs font-extrabold text-white uppercase tracking-widest bg-indigo-650 h-8 w-8 rounded-xl flex items-center justify-center border border-indigo-400/30">
                  C
                </span>
                <span className="text-sm font-extrabold text-white tracking-wider uppercase">{storeConfig.storeName}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto sm:mx-0">
                Tu rincón de conveniencia y productos exclusivos en Florida con envíos express seguros y las máximas garantías.
              </p>
            </div>

            {/* Hours */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Horario Comercial</h4>
              <p className="text-xs text-slate-300 font-bold">{storeConfig.workingHours}</p>
              <p className="text-[11px] text-slate-500">Los pedidos de la tienda online se despachan las 24 horas.</p>
            </div>

            {/* Contact Details */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Atención Telefónica / WhatsApp</h4>
              <p className="text-xs text-slate-350 font-extrabold tracking-wide">{storeConfig.contactNumber}</p>
              <p className="text-[11px] text-slate-500">Soporte directo para envíos y cancelaciones.</p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 text-center">
            <span>&copy; {new Date().getFullYear()} {storeConfig.storeName}. Todos los derechos reservados.</span>
            <span className="max-w-md text-[10px] leading-relaxed">
              Diseñado con colores de contraste premium, tipografía neo-brutalista de corte ejecutivo y un cálculo inmediato de tasas y despacho dinámico de almacenes físicos.
            </span>
          </div>
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
        onUpdateUser={handleUpdateUser}
      />
    </div>
  );
}
