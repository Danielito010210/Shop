import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Play, 
  RefreshCw, 
  HelpCircle,
  TrendingUp,
  Package,
  Users
} from 'lucide-react';
import { 
  getSavedSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  refreshSupabaseClient,
  SUPABASE_SQL_SETUP_CODE,
  dbSaveCategory,
  dbSaveProduct,
  dbSaveUser,
  dbSaveOrder,
  dbSaveSecurityLog,
  dbSaveStoreConfig
} from '../supabaseClient';
import { Product, User, Order } from '../types';
import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_ORDERS, INITIAL_SECURITY_LOGS } from '../data';

interface DatabaseTabContentProps {
  products: Product[];
  users: User[];
  categories: string[];
  orders: Order[];
  onRefreshSupabaseClient: () => void;
  onTriggerAlert?: (title: string, message: string) => void;
  onTriggerConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export default function DatabaseTabContent({
  products,
  users,
  categories,
  orders,
  onRefreshSupabaseClient,
  onTriggerAlert,
  onTriggerConfirm
}: DatabaseTabContentProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [dbEnabled, setDbEnabled] = useState(false);
  
  // Connection tester states
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    missingTables: string[];
  } | null>(null);

  // SQL Copy states
  const [copiedSql, setCopiedSql] = useState(false);

  // Seeding/Syncing states
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedReport, setSeedReport] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    const cf = getSavedSupabaseConfig();
    setSupabaseUrl(cf.url);
    setSupabaseKey(cf.key);
    setDbEnabled(cf.enabled);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl, supabaseKey, dbEnabled);
    
    // Refresh the live client instance
    refreshSupabaseClient();
    
    // Notify main App.tsx to reload its states if enabled
    onRefreshSupabaseClient();
    
    // Display feedback
    if (onTriggerAlert) {
      onTriggerAlert('Configuración Realizada', 'Configuración guardada de forma segura. Probando conexión...');
    } else {
      alert('Configuración guardada de forma segura.');
    }
    triggerConnectionTest();
  };

  const triggerConnectionTest = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Por favor complete el URL y la Key de la API primero.',
        missingTables: []
      });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setTestResult({
        tested: true,
        success: res.success,
        message: res.message,
        missingTables: res.missingTables
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err?.message || 'Error desconocido de red.',
        missingTables: []
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_CODE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSeedDatabase = async () => {
    if (!getSavedSupabaseConfig().enabled) {
      if (onTriggerAlert) {
        onTriggerAlert('Atención', 'La base de datos Supabase debe estar "Habilitada" para poder sembrar registros.');
      } else {
        alert('La base de datos Supabase debe estar "Habilitada" para poder sembrar registros.');
      }
      return;
    }

    const performSeed = async () => {
      setIsSeeding(true);
      setSeedReport(null);

      try {
        // 1. Categories
        const defaultCats = categories.length > 0 ? categories : ['Accesorios', 'Audio', 'Viaje', 'Periféricos', 'Hogar'];
        for (const cat of defaultCats) {
          await dbSaveCategory(cat);
        }

        // 2. Products
        const prodsToSeed = products.length > 0 ? products : INITIAL_PRODUCTS;
        for (const prod of prodsToSeed) {
          await dbSaveProduct(prod);
        }

        // 3. Users
        const usersToSeed = users.length > 0 ? users : INITIAL_USERS;
        for (const u of usersToSeed) {
          await dbSaveUser(u);
        }

        // 4. Config
        await dbSaveStoreConfig({
          storeName: 'Cubanos en Miami',
          contactNumber: '+1 (305) 555-0199',
          workingHours: 'Lunes a Sábado: 9:00 AM - 8:00 PM / Domingo: Cerrado'
        });

        setSeedReport('¡Éxito! Tablas sembradas y sincronizadas. Puede verificar su base de datos de Supabase.');
        onRefreshSupabaseClient();
      } catch (err: any) {
        setSeedReport(`Error en el sembrado: ${err?.message || err}`);
      } finally {
        setIsSeeding(false);
      }
    };

    if (onTriggerConfirm) {
      onTriggerConfirm(
        'Sembrar Base de Datos',
        '¿Está seguro de que desea sembrar la base de datos? Esto insertará las categorías, productos, usuarios iniciales y config de muestra en su base de datos Supabase conectada.',
        performSeed
      );
    } else {
      const confirmSeed = window.confirm(
        '¿Está seguro de que desea sembrar la base de datos? Esto insertará las categorías, productos, usuarios iniciales y config de muestra en su base de datos Supabase conectada.'
      );
      if (confirmSeed) performSeed();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      
      {/* HEADER STATEMENT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 px-5 bg-slate-900 border border-slate-700 rounded-2xl gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-400" />
            <span>Infraestructura de Base de Datos PostgreSQL (Supabase)</span>
          </h3>
          <p className="text-[11px] text-slate-300 mt-1">
            Conecte su backend de Supabase para almacenar de forma persistente e irrevocable todo el inventario, operadores del sistema, bitácora de actividad y ventas realizadas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${dbEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
            {dbEnabled ? 'Supabase Activo' : 'Modo Local Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CONNECTION CONFIGURATION FORM CARD */}
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-705 p-6 rounded-2xl space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Credenciales del Proyecto</h4>
                <p className="text-[10px] text-slate-350 mt-0.5">Obtenga esta información en el panel de su proyecto: Settings &gt; API.</p>
              </div>
              <HelpCircle className="h-4 w-4 text-slate-500" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-100 mb-1.5 uppercase tracking-wider">PROJECT URL</label>
                <input
                  type="url"
                  required
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://gswqshfeyxuzbdfjskvm.supabase.co"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-100 mb-1.5 uppercase tracking-wider">ANON KEY (PUBLIC)</label>
                <input
                  type="password"
                  required
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-600 rounded-xl text-xs text-white focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-extrabold font-mono"
                />
              </div>

              {/* TOGGLER ENABLED */}
              <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex items-start gap-3">
                <input
                  id="dbEnableCheck"
                  type="checkbox"
                  checked={dbEnabled}
                  onChange={(e) => setDbEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer text-indigo-650 accent-indigo-650"
                />
                <div className="cursor-pointer">
                  <label htmlFor="dbEnableCheck" className="text-xs font-bold text-slate-100 block cursor-pointer">
                    Habilitar conexión con la base de datos
                  </label>
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">
                    Al activarlo, la plataforma redireccionará automáticamente todas sus operaciones hacia el motor de datos de Postgres en producción.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center mt-5">
            <button
              type="button"
              onClick={triggerConnectionTest}
              disabled={isTesting || !supabaseUrl || !supabaseKey}
              className="px-4 py-2 bg-slate-950 border border-slate-700 hover:border-slate-500 hover:bg-slate-850 disabled:bg-slate-950 text-slate-300 disabled:text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Probar Conexión</span>
            </button>

            <button
              type="submit"
              className="bg-indigo-650 hover:bg-indigo-600 text-white font-black py-2.5 px-6 rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition-all border border-indigo-500 cursor-pointer"
            >
              Aplicar y Guardar
            </button>
          </div>
        </form>

        {/* CONNECTION STATUS & SCHEMA DIAGNOSTIC CARD */}
        <div className="bg-slate-900 border border-slate-705 p-6 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Diagnóstico de Tablas y Sincronismo</h4>
              <p className="text-[10px] text-slate-350 mt-0.5">Verificación en vivo del esquema de tablas en su esquema de base de datos relacional.</p>
            </div>

            {testResult ? (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl border flex items-start gap-2.5 ${
                  testResult.success 
                    ? testResult.missingTables.length > 0 
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' 
                      : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                }`}>
                  {testResult.success ? (
                    testResult.missingTables.length > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-black block">
                      {testResult.success 
                        ? testResult.missingTables.length > 0 
                          ? 'Conexión Establecida (Esquema Reducido)' 
                          : 'Conectado de Forma Completa' 
                        : 'Fallo de Enlace'}
                    </span>
                    <p className="text-[11px] opacity-80 mt-1">{testResult.message}</p>
                  </div>
                </div>

                {testResult.missingTables.length > 0 && (
                  <div className="space-y-2 font-mono text-[10px] bg-slate-950 p-4 border border-slate-850 rounded-xl">
                    <span className="font-sans text-rose-400 font-bold block text-xs">⚠️ Tablas faltantes detectadas:</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {testResult.missingTables.map((t) => (
                        <div key={t} className="flex items-center gap-1.5 py-1 px-2 border border-slate-800 rounded bg-slate-900/50">
                          <XCircle className="h-3 w-3 text-rose-400" />
                          <span className="text-slate-300 font-bold">{t}</span>
                        </div>
                      ))}
                    </div>
                    <span className="font-sans text-slate-400 block text-[9px] mt-2 italic leading-relaxed">
                      Utilice la consola SQL Editor de Supabase (derecha) para crear de modo seguro las tablas faltantes en un solo clic.
                    </span>
                  </div>
                )}

                {testResult.success && testResult.missingTables.length === 0 && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-950 rounded-xl text-[10.5px] leading-relaxed text-slate-300">
                    <span className="text-emerald-400 font-bold block text-xs mb-1">¡Sistema Listo y Operando!</span>
                    Todas las tablas clave han sido localizadas con éxito (<code className="text-indigo-300 text-[10px] font-mono">categories</code>, <code className="text-indigo-300 text-[10px] font-mono">products</code>, <code className="text-indigo-300 text-[10px] font-mono">users</code>, <code className="text-indigo-300 text-[10px] font-mono">orders</code>, <code className="text-indigo-300 text-[10px] font-mono">store_config</code>). Las actualizaciones en inventario o transacciones se guardarán en tiempo de ejecución.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
                <Database className="h-8 w-8 text-slate-650 mx-auto animate-pulse" />
                <span className="text-xs text-slate-350 block font-bold uppercase tracking-wide">Falta Realizar Diagnóstico</span>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Presione el botón "Probar Conexión" para verificar el estado actual de sus tablas y el esquema de seguridad asignado.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 mt-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold text-slate-200 block">Inicializar Database con Datos de Muestra</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Siembre de forma masiva los productos y operadores predeterminados en sus tablas.</span>
              </div>
              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={isSeeding || !dbEnabled}
                className="px-3.5 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-400/30 text-indigo-300 disabled:opacity-40 disabled:hover:bg-indigo-950 rounded-xl text-xs font-black shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Play className="h-3 w-3 fill-indigo-300" />
                <span>Sembrar</span>
              </button>
            </div>

            {seedReport && (
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-indigo-300 font-bold leading-normal">
                {seedReport}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SQL CONSOLE SCRIPT BOOTSTRAPER (En caso de no existir... crearla) */}
      <div className="bg-slate-900 border border-slate-705 rounded-2xl shadow-lg p-6 space-y-4">
        <div className="border-b border-slate-800 pb-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Paso obligatorio: Script de creación SQL de tablas</h4>
            <p className="text-[10px] text-slate-350 mt-0.5">
              Si es un proyecto de Supabase recién creado, copie este script, diríjase al editor de consultas <strong>SQL Editor</strong> de Supabase, péguelo y pulse <strong>"Run"</strong>.
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleCopySQL}
            className="flex items-center gap-1.5 self-start sm:self-center py-2 px-4 rounded-xl text-xs font-black bg-slate-950 hover:bg-slate-850 border border-slate-700 hover:border-slate-500 transition-all cursor-pointer text-slate-200 active:scale-95"
          >
            {copiedSql ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-indigo-400" />
                <span>Copiar Script SQL</span>
              </>
            )}
          </button>
        </div>

        <div className="relative group">
          <pre className="max-h-[240px] overflow-y-auto px-4 py-3 bg-slate-955 text-[10px] font-mono text-slate-300 rounded-xl border border-slate-800 scrollbar-thin scrollbar-thumb-slate-750 select-all leading-relaxed whitespace-pre-wrap">
            {SUPABASE_SQL_SETUP_CODE}
          </pre>
          <div className="absolute bottom-2.5 right-2.5 bg-slate-900/90 border border-slate-800 text-[9px] text-slate-400 font-bold py-1 px-2 rounded backdrop-blur-sm pointer-events-none opacity-80">
            Postgres dialect (Supabase compliant)
          </div>
        </div>
      </div>

    </div>
  );
}
