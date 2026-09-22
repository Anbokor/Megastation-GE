import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AppUser } from '../types';
import { DEMO_USERS } from '../data/users';
import { apiLogin } from '../api/client';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AppUser) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onLogout,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quick' | 'form'>('quick');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const demoPasswords: Record<string, string> = {
    'admin@megastation.com': 'admin123',
    'belgrano@megastation.com': 'belgrano123',
    'colegiales@megastation.com': 'colegiales123',
    'martin.gomez@gmail.com': 'customer123',
  };

  const handleQuickLogin = async (demoUser: AppUser) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const pwd = demoPasswords[demoUser.email.toLowerCase()] || 'password123';
      const res = await apiLogin(demoUser.email, pwd);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
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
                Seleccioná tu nivel de acceso o ingresá con tus credenciales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
                Sesión activa como <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'border-[#006899] text-[#006899] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#10A4C7]" />
            <span>Accesos Rápidos de Prueba</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 text-center transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-[#006899] text-[#006899] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4 text-slate-500" />
            <span>Ingreso Manual</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'quick' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Hacé clic en cualquiera de los roles para probar cómo cambia la interfaz, los permisos y las herramientas según el nivel de usuario:
              </p>

              <div className="space-y-2.5">
                {/* 1. Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEMO_USERS[0])}
                  className="w-full text-left p-3.5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 bg-amber-50/60 hover:bg-amber-50 transition-all group flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-amber-800">
                        {DEMO_USERS[0].name}
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Administrador General
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Acceso total: Métricas de facturación, ingreso de mercadería con margen %, transferencias de stock, gestión de pedidos y ajustes de marca.
                    </p>
                    <span className="text-[11px] font-mono text-amber-700 mt-1 block">
                      {DEMO_USERS[0].email}
                    </span>
                  </div>
                </button>

                {/* 2. Seller Belgrano */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEMO_USERS[1])}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-[#10A4C7] bg-white hover:bg-sky-50/50 transition-all group flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#006899] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#006899]">
                        {DEMO_USERS[1].name}
                      </span>
                      <span className="text-[10px] bg-sky-100 text-[#006899] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Vendedor · Belgrano
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Terminal POS, lector de códigos de barras, consulta de stock por sucursal y despacho de pedidos para retiro en Cabildo 2995.
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                      {DEMO_USERS[1].email}
                    </span>
                  </div>
                </button>

                {/* 3. Seller Colegiales */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEMO_USERS[2])}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-[#10A4C7] bg-white hover:bg-sky-50/50 transition-all group flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#10A4C7] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#10A4C7]">
                        {DEMO_USERS[2].name}
                      </span>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Vendedora · Colegiales
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Punto de venta Elcano 3096, control de inventario local y atención de compras de mostrador.
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                      {DEMO_USERS[2].email}
                    </span>
                  </div>
                </button>

                {/* 4. Customer */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin(DEMO_USERS[3])}
                  className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/40 transition-all group flex items-start gap-3.5 shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700">
                        {DEMO_USERS[3].name}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Cliente Comprador
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Experiencia de compra con checkout simplificado, datos autocompletados y seguimiento de pedidos.
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                      {DEMO_USERS[3].email}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej: admin@megastation.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#10A4C7] focus:ring-2 focus:ring-[#10A4C7]/20 transition-all text-slate-900"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ingresá con tu correo de empleado o cualquier correo para ingresar como cliente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#10A4C7] focus:ring-2 focus:ring-[#10A4C7]/20 transition-all text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Contraseñas de acceso: <code className="text-[#006899] font-bold">admin123</code> (Admin), <code className="text-[#006899] font-bold">belgrano123</code> (Ventas Belgrano), <code className="text-[#006899] font-bold">customer123</code> (Cliente).
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#10A4C7] to-[#006899] hover:from-[#0e95b5] hover:to-[#005a85] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>¿Querés solo mirar la tienda?</span>
            <button
              type="button"
              onClick={onClose}
              className="text-[#006899] font-bold hover:underline"
            >
              Continuar como Invitado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
