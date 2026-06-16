import React, { useState } from 'react';
import { X, Lock, User, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  onLoginFailure: (username: string, reason: string) => void;
  registeredUsers: UserType[];
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onLoginFailure,
  registeredUsers,
}: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const formattedUsername = username.trim().toLowerCase();
    const user = registeredUsers.find((u) => u.username === formattedUsername);

    if (!user) {
      // User doesn't exist
      onLoginFailure(formattedUsername, 'Nombre de usuario no registrado');
      setErrorMsg('Usuario incorrecto o no registrado.');
      return;
    }

    // Verify Password
    // In our seed system, we compare strings directly
    if (user.password !== password) {
      onLoginFailure(formattedUsername, 'Contraseña incorrecta');
      setErrorMsg('Contraseña de acceso incorrecta.');
      return;
    }

    // Success login
    onLoginSuccess(user);
    setUsername('');
    setPassword('');
    onClose();
  };

  const handleQuickLogin = (demoUser: UserType) => {
    setUsername(demoUser.username);
    setPassword(demoUser.password || '');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 p-5">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lock className="h-4.5 w-4.5" />
            <h2 className="text-sm font-extrabold text-white">Ingreso para Personal</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-250 text-xs rounded-xl font-bold flex items-center gap-1.5 leading-relaxed">
              <ShieldAlert className="h-4.5 w-4.5 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Logins Helper */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-2">
            <span className="block text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 text-center">
              💡 Credenciales de Prueba Rápidas
            </span>
            <div className="grid grid-cols-2 gap-2">
              {registeredUsers.slice(0, 2).map((ru) => (
                <button
                  key={ru.id}
                  type="button"
                  onClick={() => handleQuickLogin(ru)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg py-1.5 px-2 text-[10px] text-slate-300 hover:text-white font-bold transition-all text-left truncate block"
                >
                  👤 {ru.fullName.split(' ')[0]} ({ru.role === 'admin' ? 'Admin' : 'Emp'})
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Usuario de Trabajo</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. admin"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-650/15 transition-all border border-indigo-500/20 active:scale-98"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
