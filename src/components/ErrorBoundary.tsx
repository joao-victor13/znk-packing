import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Store } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ZNK Atelier ERP:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-[#221C18] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full border border-[#E8D7C3] shadow-lg text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                ZNK ATELIER
              </h1>
              <p className="text-xs text-stone-500 uppercase tracking-wider mt-0.5">
                Gestão de Compras & Confecção
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Ocorreu uma inconsistência no carregamento</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                Clique no botão abaixo para restaurar o estado limpo da aplicação e recarregar a interface.
              </p>
              {this.state.error && (
                <div className="font-mono text-[10px] bg-white p-2 rounded border border-amber-200 text-rose-700 break-all">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar & Recarregar Sistema</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
