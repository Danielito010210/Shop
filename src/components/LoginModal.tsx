import React, { useState, useEffect } from 'react';
import { X, Lock, User, Eye, EyeOff, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { sha256, validatePassword } from '../utils_crypto';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  onLoginFailure: (username: string, reason: string) => void;
  registeredUsers: UserType[];
  onUpdateUser: (id: string, updates: Partial<UserType>) => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onLoginFailure,
  registeredUsers,
  onUpdateUser,
}: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password reset on first-time login
  const [changingPasswordUser, setChangingPasswordUser] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Password strength checker during input
  const [strength, setStrength] = useState({
    length: false,
    letter: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setStrength({
      length: newPassword.length >= 8,
      letter: /[a-zA-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>_*\-+=\[\]\\\/]/.test(newPassword)
    });
  }, [newPassword]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const formattedUsername = username.trim().toLowerCase();
    const user = registeredUsers.find((u) => u.username === formattedUsername);

    if (!user) {
      onLoginFailure(formattedUsername, 'Nombre de usuario no registrado');
      setErrorMsg('Usuario incorrecto o no registrado.');
      return;
    }

    // Check account block status
    if (user.blockedUntil) {
      const blockedTime = new Date(user.blockedUntil).getTime();
      const now = Date.now();
      if (now < blockedTime) {
        const remainingSeconds = Math.ceil((blockedTime - now) / 1000);
        if (remainingSeconds > 30) {
          const minutes = Math.ceil(remainingSeconds / 60);
          setErrorMsg(`Su cuenta está bloqueada temporalmente por seguridad. Inténtelo de nuevo en unas 1 hora o solicite al Administrador el restablecimiento.`);
        } else {
          setErrorMsg(`Acceso suspendido temporalmente. Intente en ${remainingSeconds} segundos.`);
        }
        return;
      }
    }

    // Verify Password
    const hashed = sha256(password);
    let isPasswordCorrect = (user.password === hashed);

    // Self-healing emergency fallback for default admin account
    if (formattedUsername === 'admin' && password === 'admin123*') {
      isPasswordCorrect = true;
      if (user.password !== hashed || user.blockedUntil !== undefined || (user.failedLoginAttempts || 0) > 0) {
        onUpdateUser(user.id, { 
          password: hashed, 
          failedLoginAttempts: 0, 
          blockedUntil: undefined,
          mustChangePassword: false 
        });
      }
    }

    if (!isPasswordCorrect) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let blockTimeStr: string | undefined = undefined;
      let localMsg = 'Contraseña de acceso incorrecta.';

      // Enforce lock policies only on employees and gerentes
      if (user.role !== 'admin') {
        if (attempts === 3) {
          const blockDate = new Date(Date.now() + 10 * 1000); // 10s block
          blockTimeStr = blockDate.toISOString();
          localMsg = 'Has fallado 3 intentos. Debes esperar 10 segundos antes de intentar ingresar nuevamente.';
        } else if (attempts >= 4) {
          const blockDate = new Date(Date.now() + 60 * 60 * 1000); // 1hr block
          blockTimeStr = blockDate.toISOString();
          localMsg = 'Acceso bloqueado de forma temporal por 1 hora o hasta que el Adminsitrador lo desbloquee manualmente.';
        }
      }

      onUpdateUser(user.id, {
        failedLoginAttempts: attempts,
        blockedUntil: blockTimeStr,
      });

      onLoginFailure(formattedUsername, `Contraseña incorrecta (Intento ${attempts})`);
      setErrorMsg(localMsg);
      return;
    }

    // Check if must reset temporary password first (first-time login)
    if (user.mustChangePassword) {
      setChangingPasswordUser(user);
      return;
    }

    // Success login: reset attempts counters
    onUpdateUser(user.id, {
      failedLoginAttempts: 0,
      blockedUntil: undefined
    });

    onLoginSuccess(user);
    setUsername('');
    setPassword('');
    onClose();
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    if (!changingPasswordUser) return;

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('Las contraseñas ingresadas no coinciden.');
      return;
    }

    const { isValid, error } = validatePassword(newPassword);
    if (!isValid) {
      setPasswordChangeError(error || 'La contraseña no cumple con las reglas estrictas de seguridad.');
      return;
    }

    const hashed = sha256(newPassword);

    onUpdateUser(changingPasswordUser.id, {
      password: hashed,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      blockedUntil: undefined
    });

    const updatedUser: UserType = {
      ...changingPasswordUser,
      password: hashed,
      mustChangePassword: false,
    };

    onLoginSuccess(updatedUser);

    setChangingPasswordUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setUsername('');
    setPassword('');
    onClose();
  };

  // Safe exit resetting changing password session states
  const handleCancelPasswordReset = () => {
    setChangingPasswordUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md font-sans" id="login-modal-root">
      <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" id="login-modal-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 p-5">
          <div className="flex items-center gap-2 text-indigo-400">
            <Lock className="h-4.5 w-4.5" />
            <h2 className="text-sm font-extrabold text-white">
              {changingPasswordUser ? 'Establecer Contraseña Segura' : 'Ingreso para Personal'}
            </h2>
          </div>
          <button
            onClick={() => {
              handleCancelPasswordReset();
              onClose();
            }}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-900 hover:text-slate-300 transition-colors"
            id="close-login-modal-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. FORCE PASSWORD CHANGE VIEW */}
        {changingPasswordUser ? (
          <form onSubmit={handlePasswordChangeSubmit} className="p-5 space-y-4" id="password-reset-form">
            <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 text-indigo-200 text-xs rounded-xl leading-relaxed">
              <p className="font-bold mb-1">🔐 Cambio Obligatorio de Contraseña</p>
              Es su primera sesión como empleado. Debe crear una contraseña personalizada de alta seguridad para proteger la integridad de los datos de la tienda.
            </div>

            {passwordChangeError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 text-[11px] rounded-xl font-bold flex items-center gap-1.5 leading-relaxed">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{passwordChangeError}</span>
              </div>
            )}

            {/* Rules checklist to assist user in entering correct password format */}
            <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl space-y-1.5">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">REQUISITOS ESTRICTOS:</span>
              <div className="flex items-center gap-2 text-xs">
                {strength.length ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600" />}
                <span className={strength.length ? 'text-emerald-400' : 'text-slate-450'}>Mínimo 8 caracteres</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {strength.letter ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600" />}
                <span className={strength.letter ? 'text-emerald-400' : 'text-slate-450'}>Contiene letras (a-z / A-Z)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {strength.number ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600" />}
                <span className={strength.number ? 'text-emerald-400' : 'text-slate-450'}>Contiene números (0-9)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {strength.special ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-slate-600" />}
                <span className={strength.special ? 'text-emerald-400' : 'text-slate-450'}>Contiene caracteres especiales (*, !, @, $, etc.)</span>
              </div>
            </div>

            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Nueva Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingrese nueva contraseña"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Confirmar Nueva Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repita la nueva contraseña"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelPasswordReset}
                className="w-1/3 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-800 active:scale-98"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!(strength.length && strength.letter && strength.number && strength.special)}
                className="w-2/3 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg transition-all border border-transparent hover:border-indigo-500/20 active:scale-98"
              >
                Actualizar y Entrar
              </button>
            </div>
          </form>
        ) : (
          /* 2. STANDARD LOGIN FORM */
          <form onSubmit={handleSubmit} className="p-5 space-y-4" id="standard-login-form">
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 text-xs rounded-xl font-bold flex items-center gap-1.5 leading-relaxed">
                <ShieldAlert className="h-4.5 w-4.5 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Note: The Quick Demo Logins block has been removed as requested by the user */}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Usuario de Trabajo</label>
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
                  id="login-username-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Contraseña</label>
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
                  id="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300"
                  id="toggle-show-pass-btn"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-650 hover:bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-650/15 transition-all border border-indigo-500/20 active:scale-98"
              id="login-submit-btn"
            >
              Iniciar Sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
