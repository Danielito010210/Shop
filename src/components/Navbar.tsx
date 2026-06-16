import React from 'react';
import { ShoppingCart, LogIn, LogOut, Store, LayoutDashboard, UserCheck } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentView: 'store' | 'admin';
  onChangeView: (view: 'store' | 'admin') => void;
  cartCount: number;
  onOpenCart: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenLoginModal: () => void;
  storeName?: string;
}

export default function Navbar({
  currentView,
  onChangeView,
  cartCount,
  onOpenCart,
  currentUser,
  onLogout,
  onOpenLoginModal,
  storeName,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-650 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
            <span className="font-sans text-xl font-extrabold tracking-tight">C</span>
          </div>
          <div>
            <span className="block font-sans text-base sm:text-lg font-bold tracking-tight text-white">
              {storeName || 'Cubanos en Miami'}
            </span>
          </div>
        </div>

        {/* View Selection & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-4 font-sans text-sm">
          <button
            onClick={() => onChangeView('store')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 font-bold transition-all ${
              currentView === 'store'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Tienda</span>
          </button>

          <button
            onClick={() => {
              if (currentUser) {
                onChangeView('admin');
              } else {
                onOpenLoginModal();
              }
            }}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 font-bold transition-all ${
              currentView === 'admin'
                ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-650/20 border border-indigo-500/35'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
            }`}
          >
            {currentUser ? <LayoutDashboard className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            <span>{currentUser ? 'Panel Personal' : 'Miembros'}</span>
          </button>

          {/* User badge */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 py-1 pl-1.5 pr-3.5 text-xs font-bold text-slate-300">
              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                currentUser.role === 'admin' 
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-500/30' 
                  : currentUser.role === 'gerente'
                  ? 'bg-teal-950 text-teal-300 border-teal-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {currentUser.role === 'admin' && 'Admin'}
                {currentUser.role === 'gerente' && 'Gerente'}
                {currentUser.role === 'employee' && 'Empleado'}
              </span>
              <span className="truncate max-w-[100px]">{currentUser.fullName}</span>
            </div>
          )}

          {currentUser && (
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-950/40 hover:text-red-400 border border-transparent hover:border-red-900/55 transition-all"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          <div className="h-4 w-px bg-slate-800" />

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            id="cart-button-nav"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white transition-all active:scale-95"
            aria-label="Ver Carrito de compra"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-650 text-[10px] font-bold text-white shadow-md border border-indigo-500/25">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
