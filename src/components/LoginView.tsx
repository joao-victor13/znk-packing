import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  Users
} from 'lucide-react';
import { useCustomization } from '../context/CustomizationContext';

export const LoginView: React.FC = () => {
  const { login, users, storeSettings } = useCustomization();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, informe seu email e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Credenciais inválidas.');
      }
    } catch (err) {
      setErrorMsg('Erro de autenticação no servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill demo user credentials
  const handleQuickLogin = (demoEmail: string, demoPass?: string) => {
    const user = users.find(u => u.email.toLowerCase() === demoEmail.toLowerCase());
    setEmail(demoEmail);
    setPassword(demoPass || user?.password || 'admin');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121215] text-[#221C18] dark:text-[#F3F4F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Monogram "Z" Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-900/25 border border-brand-300/40 relative overflow-hidden group">
          <span className="font-serif font-black text-4xl tracking-tighter text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] select-none pt-0.5">
            Z
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/15 pointer-events-none" />
        </div>

        {/* Brand Name & Headline */}
        <div className="text-center mt-5">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-editorial-text dark:text-stone-100 uppercase">
            {storeSettings.storeName || 'ZNK PACKING'}
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-brand-700 dark:text-brand-400 font-semibold flex items-center justify-center">
            <Sparkles className="w-3 h-3 mr-1" />
            Portal de Gestão & Confecção
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Login Card */}
        <div className="bg-white dark:bg-stone-900 py-8 px-6 sm:px-10 rounded-2xl border border-brand-200 dark:border-stone-800 shadow-soft dark:shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
                Email Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-editorial-muted dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@znkpacking.com.br"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 placeholder-editorial-muted dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-editorial-text dark:text-stone-200">
                  Senha de Acesso
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-editorial-muted dark:text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-editorial-light dark:bg-stone-800 border border-brand-200 dark:border-stone-700 rounded-lg text-xs sm:text-sm text-editorial-text dark:text-stone-100 placeholder-editorial-muted dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-editorial-muted dark:text-stone-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Lembrar minhas credenciais</span>
              </label>

              <span className="text-[11px] text-brand-700 dark:text-brand-400 font-medium">
                Acesso Seguro SSL
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-900/10 flex items-center justify-center space-x-2 transition-all mt-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Access for Team Demonstration */}
          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-editorial-muted dark:text-stone-400 mb-2.5">
              <Users className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Acesso Rápido por Perfil:</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@znkpacking.com.br', 'admin')}
                className="p-2 rounded-lg bg-brand-50/70 dark:bg-stone-800/80 hover:bg-brand-100 dark:hover:bg-stone-800 border border-brand-200 dark:border-stone-700 text-left transition-colors truncate"
              >
                <div className="font-bold text-brand-900 dark:text-brand-300 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate">
                  admin@znkpacking.com.br
                </div>
              </button>

              {/* Compradora */}
              <button
                type="button"
                onClick={() => handleQuickLogin('camila.duarte@znkpacking.com.br', 'compras123')}
                className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left transition-colors truncate"
              >
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  Compradora
                </div>
                <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate">
                  camila.duarte@...
                </div>
              </button>

              {/* Gerente PCP */}
              <button
                type="button"
                onClick={() => handleQuickLogin('rodrigo.pcp@znkpacking.com.br', 'pcp123')}
                className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left transition-colors truncate"
              >
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  Gerente PCP
                </div>
                <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate">
                  rodrigo.pcp@...
                </div>
              </button>

              {/* Financeiro */}
              <button
                type="button"
                onClick={() => handleQuickLogin('financeiro@znkpacking.com.br', 'fin123')}
                className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left transition-colors truncate"
              >
                <div className="font-bold text-stone-800 dark:text-stone-200">
                  Financeiro
                </div>
                <div className="text-[10px] text-editorial-muted dark:text-stone-400 truncate">
                  financeiro@...
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-editorial-muted dark:text-stone-500 mt-6">
          ZNK Packing & Confecção • Sistema Protegido com Criptografia & RBAC
        </p>
      </div>
    </div>
  );
};
