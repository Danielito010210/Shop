import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, User, Order, SecurityLog, ActivityLog } from './types';

export interface SupabaseConfig {
  url: string;
  key: string;
  enabled: boolean;
}

// Read saved Supabase configuration from localStorage
export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const url = localStorage.getItem('omnistore_supabase_url') || '';
    const key = localStorage.getItem('omnistore_supabase_key') || '';
    const enabled = localStorage.getItem('omnistore_supabase_enabled') === 'true';
    return { url, key, enabled };
  } catch (e) {
    return { url: '', key: '', enabled: false };
  }
}

// Save Supabase configuration to localStorage
export function saveSupabaseConfig(url: string, key: string, enabled: boolean) {
  try {
    localStorage.setItem('omnistore_supabase_url', url.trim());
    localStorage.setItem('omnistore_supabase_key', key.trim());
    localStorage.setItem('omnistore_supabase_enabled', enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving Supabase credentials:', e);
  }
}

// Generate active client based on current settings
export function createActiveSupabaseClient(): SupabaseClient | null {
  const { url, key, enabled } = getSavedSupabaseConfig();
  if (!enabled || !url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (e) {
    console.error('Failed to init Supabase client:', e);
    return null;
  }
}

// Keep a cached active instance
let activeClientInstance: SupabaseClient | null = createActiveSupabaseClient();

export function refreshSupabaseClient(): SupabaseClient | null {
  activeClientInstance = createActiveSupabaseClient();
  return activeClientInstance;
}

export function getSupabaseClient(): SupabaseClient | null {
  return activeClientInstance;
}

// Helper to check table connectivity status
export async function testSupabaseConnection(url: string, key: string): Promise<{
  success: boolean;
  message: string;
  missingTables: string[];
}> {
  if (!url || !key) {
    return { success: false, message: 'URL o Key incompleta.', missingTables: [] };
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false }
    });

    const tablesToCheck = [
      { name: 'categories', testField: 'name' },
      { name: 'products', testField: 'id' },
      { name: 'users', testField: 'id' },
      { name: 'orders', testField: 'id' },
      { name: 'security_logs', testField: 'id' },
      { name: 'activity_logs', testField: 'id' },
      { name: 'store_config', testField: 'key' }
    ];

    const missingTables: string[] = [];

    for (const table of tablesToCheck) {
      const { error } = await client
        .from(table.name)
        .select(table.testField)
        .limit(1);

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        missingTables.push(table.name);
      }
    }

    if (missingTables.length > 0) {
      return {
        success: true, // auth is okay but database schema is incomplete
        message: 'Conectado a Supabase con éxito, pero faltan algunas tablas.',
        missingTables
      };
    }

    return {
      success: true,
      message: '¡Conexión y tablas validadas con éxito!',
      missingTables: []
    };

  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Error de red o CORS al intentar conectar con Supabase.',
      missingTables: []
    };
  }
}

// --- DATABASE OPERATIONS FOR SYNCRONIZATION ---

// 1. Categories
export async function dbFetchCategories(): Promise<string[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('categories').select('name');
  if (error) {
    console.error('Error fetching categories from Supabase:', error);
    return null;
  }
  return data.map((c: any) => c.name);
}

export async function dbSaveCategory(name: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('categories').upsert({ id: name, name });
  if (error) {
    console.error(`Error saving category ${name}:`, error);
    return false;
  }
  return true;
}

export async function dbDeleteCategory(name: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('categories').delete().eq('name', name);
  if (error) {
    console.error(`Error deleting category ${name}:`, error);
    return false;
  }
  return true;
}

export async function dbUpdateCategoryName(oldName: string, newName: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  // Since categories are cascaded, updating the row name triggers cascade in database
  const { error } = await client.from('categories').update({ name: newName }).eq('name', oldName);
  if (error) {
    console.error(`Error updating category ${oldName} to ${newName}:`, error);
    return false;
  }
  return true;
}

// 2. Products
export async function dbFetchProducts(): Promise<Product[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('products').select('*');
  if (error) {
    console.error('Error fetching products from Supabase:', error);
    return null;
  }
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price),
    imageUrl: p.image || '',
    category: p.category || '',
    stock: Number(p.stock),
    isOnSale: p.is_on_sale || false,
    discountPercent: Number(p.discount_percent || 0),
    currency: p.currency || 'USD'
  }));
}

export async function dbSaveProduct(product: Product): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('products').upsert({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.imageUrl,
    category: product.category,
    stock: product.stock,
    is_on_sale: product.isOnSale || false,
    discount_percent: product.discountPercent || 0,
    currency: product.currency || 'USD'
  });
  if (error) {
    console.error(`Error saving product ${product.id}:`, error);
    return false;
  }
  return true;
}

export async function dbDeleteProduct(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    return false;
  }
  return true;
}

// 3. Users
export async function dbFetchUsers(): Promise<User[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('users').select('*');
  if (error) {
    console.error('Error fetching users from Supabase:', error);
    return null;
  }
  return data.map((u: any) => ({
    id: u.id,
    username: u.username,
    fullName: u.full_name,
    role: u.role,
    password: u.password,
    mustChangePassword: u.must_change_password || false,
    failedLoginAttempts: Number(u.failed_login_attempts || 0),
    blockedUntil: u.blocked_until || undefined
  }));
}

export async function dbSaveUser(user: User): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('users').upsert({
    id: user.id || `user-${Date.now()}`,
    username: user.username,
    full_name: user.fullName,
    role: user.role,
    password: user.password || '',
    must_change_password: user.mustChangePassword || false,
    failed_login_attempts: user.failedLoginAttempts || 0,
    blocked_until: user.blockedUntil || null
  });
  if (error) {
    console.error(`Error saving user ${user.username}:`, error);
    return false;
  }
  return true;
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('users').delete().eq('id', id);
  if (error) {
    console.error(`Error deleting user ${id}:`, error);
    return false;
  }
  return true;
}

// 4. Orders
export async function dbFetchOrders(): Promise<Order[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('orders').select('*');
  if (error) {
    console.error('Error fetching orders from Supabase:', error);
    return null;
  }
  return data.map((o: any) => ({
    id: o.id,
    invoiceNumber: o.invoice_number,
    clientDetails: {
      name: o.client_name,
      phone: o.client_phone,
      address: o.client_address,
      nickname: o.client_nickname || undefined,
      reference: o.client_reference || undefined
    },
    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    total: Number(o.total),
    status: o.status,
    date: o.date,
    processedBy: o.processed_by || undefined
  }));
}

export async function dbSaveOrder(order: Order): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('orders').upsert({
    id: order.id,
    invoice_number: order.invoiceNumber,
    client_name: order.clientDetails.name,
    client_phone: order.clientDetails.phone,
    client_address: order.clientDetails.address,
    client_nickname: order.clientDetails.nickname || null,
    client_reference: order.clientDetails.reference || null,
    items: order.items,
    total: order.total,
    status: order.status,
    date: order.date,
    processed_by: order.processedBy || null
  });
  if (error) {
    console.error(`Error saving order ${order.invoiceNumber}:`, error);
    return false;
  }
  return true;
}

export async function dbDeleteOrder(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('orders').delete().eq('id', id);
  if (error) {
    console.error(`Error deleting order ${id}:`, error);
    return false;
  }
  return true;
}

// 5. Security Logs
export async function dbFetchSecurityLogs(): Promise<SecurityLog[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('security_logs').select('*');
  if (error) {
    console.error('Error fetching security logs:', error);
    return null;
  }
  return data.map((l: any) => ({
    id: l.id,
    username: l.username,
    timestamp: l.timestamp,
    ipAddress: l.ip_address || '',
    device: l.device || '',
    failureReason: l.failure_reason || ''
  }));
}

export async function dbSaveSecurityLog(log: SecurityLog): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('security_logs').upsert({
    id: log.id,
    username: log.username,
    timestamp: log.timestamp,
    ip_address: log.ipAddress,
    device: log.device,
    failure_reason: log.failureReason
  });
  if (error) {
    console.error('Error saving security log:', error);
    return false;
  }
  return true;
}

export async function dbClearSecurityLogs(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('security_logs').delete().neq('id', 'placeholder__never_match');
  if (error) {
    console.error('Error clearing security logs:', error);
    return false;
  }
  return true;
}

// 6. Activity Logs
export async function dbFetchActivityLogs(): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('activity_logs').select('*');
  if (error) {
    console.error('Error fetching activity logs:', error);
    return null;
  }
  return data.map((l: any) => ({
    id: l.id,
    timestamp: l.timestamp,
    username: l.username,
    userFullName: l.user_full_name || '',
    action: l.action,
    details: l.details || ''
  }));
}

export async function dbSaveActivityLog(log: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('activity_logs').upsert({
    id: log.id,
    timestamp: log.timestamp,
    username: log.username,
    user_full_name: log.userFullName || log.username || '',
    action: log.action,
    details: log.details || ''
  });
  if (error) {
    console.error('Error saving activity log:', error);
    return false;
  }
  return true;
}

export async function dbClearActivityLogs(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('activity_logs').delete().neq('id', 'placeholder__never_match');
  if (error) {
    console.error('Error clearing activity logs:', error);
    return false;
  }
  return true;
}

// 7. Store Config
export async function dbFetchStoreConfig(): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('store_config').select('*');
  if (error) {
    console.error('Error fetching store config:', error);
    return null;
  }
  if (!data || data.length === 0) return null;
  
  // Reconstruct config object
  const config: any = {};
  data.forEach((row: any) => {
    config[row.key] = row.value?.val ?? row.value;
  });
  return config;
}

export async function dbSaveStoreConfig(config: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const promises = Object.keys(config).map(async (key) => {
      const val = config[key];
      return client.from('store_config').upsert({
        key,
        value: typeof val === 'object' ? val : { val }
      });
    });
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.error('Error saving store config:', err);
    return false;
  }
}

// --- SQL TEMPLATE GENERATOR ---
export const SUPABASE_SQL_SETUP_CODE = `-- SCRIPT DE CONFIGURACIÓN DE TABLAS PARA OMNISTORE (CUBANOS EN MIAMI)
-- Copie este script completo y péguelo en la consola "SQL Editor" de su proyecto de Supabase.
-- Luego presione "Run" para crear las tablas necesarias e iniciar la base de datos de manera limpia.

-- 1. Tabla de Categorías de Producto
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Habilitar acceso de lectura y escritura para clientes anónimos (si RLS está activo)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura anónima de categorías" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir escritura anónima de categorías" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT, -- Soporta dirección URL o archivos Base64 completos
    category TEXT REFERENCES public.categories(name) ON UPDATE CASCADE ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_on_sale BOOLEAN DEFAULT false,
    discount_percent NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'USD'
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura anónima de productos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Permitir escritura anónima de productos" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabla de Usuarios / Personal Staff
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'gerente', 'employee')),
    password TEXT NOT NULL, -- Almacenada como hash SHA-256
    must_change_password BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    blocked_until TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura anónima de usuarios" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir escritura anónima de usuarios" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabla de Pedidos / Compras
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_address TEXT NOT NULL,
    client_nickname TEXT,
    client_reference TEXT,
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    date TEXT NOT NULL,
    processed_by TEXT
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura comercial anónima de pedidos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Permitir inserción y actualización de pedidos" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 5. Tabla de Alertas de Seguridad
CREATE TABLE IF NOT EXISTS public.security_logs (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    ip_address TEXT,
    device TEXT,
    failure_reason TEXT
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso a listado de seguridad" ON public.security_logs FOR SELECT USING (true);
CREATE POLICY "Permitir registrar logs de seguridad" ON public.security_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. Tabla de Movimientos del Personal Staff
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    username TEXT NOT NULL,
    user_full_name TEXT,
    action TEXT NOT NULL,
    details TEXT
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura de movimientos" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Permitir registrar movimientos" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Tabla de Configuración de Tienda
CREATE TABLE IF NOT EXISTS public.store_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir lectura de configuración" ON public.store_config FOR SELECT USING (true);
CREATE POLICY "Permitir actualizar de de configuración" ON public.store_config FOR ALL USING (true) WITH CHECK (true);
`;
