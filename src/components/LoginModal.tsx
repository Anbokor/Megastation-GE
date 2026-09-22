import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Store, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppUser } from '../types';
import { apiLogin } from '../api/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
}

const DEMO_CREDENTIALS = [
  { role: 'Administrador', email: 'admin@megastation.com', pass: 'admin123', tag: 'Acceso Total', icon: ShieldCheck, color: 'text-amber-500' },
  { role: 'Vendedor (Belgrano)', email: 'belgrano@megastation.com', pass: 'belgrano123', tag: 'Sucursal Cabildo', icon: Store, color: 'text-sky-500' },
  { role: 'Vendedor (Colegiales)', email: 'colegiales@megastation.com', pass: 'colegiales123', tag: 'Sucursal Lacroze', icon: Store, color: 'text-sky-500' },
  { role: 'Cliente', email: 'martin.gomez@gmail.com', pass: 'customer123', tag: 'Comprador', icon: User, color: 'text-emerald-500' },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Por favor ingresá tu correo electrónico.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor ingresá tu contraseña.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiLogin(cleanEmail, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#10A4C7] via-[#006899] to-[#13007C] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white font-extrabold border border-white/20">
              <Lock className="w-5 h-5 text-[#48FEC1]" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                Ingreso al Sistema
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-sky-100">
                  Megastation
                </span>
              </h2>
              <p className="text-xs text-sky-200">
                Acceso para clientes y equipo de sucursales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user session notice if already logged in */}
        {currentUser && (
          <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Sesión activa: <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@megastation.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006899] focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006899] focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#10A4C7] to-[#006899] hover:from-[#006899] hover:to-[#13007C] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Test credentials helper - purely fills form fields, no automatic login bypass */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cuentas de prueba (hacé clic para autocompletar):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((cred) => {
                const Icon = cred.icon;
                return (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => fillCredentials(cred.email, cred.pass)}
                    className="p-2 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all cursor-pointer group"
                    title={`Completar: ${cred.email}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${cred.color}`} />
                      <span className="text-[11px] font-bold text-slate-800 group-hover:text-[#006899] truncate">
                        {cred.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      {cred.email}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
