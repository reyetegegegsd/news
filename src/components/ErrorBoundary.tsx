import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white">
              Application Notice (ऐप में रुकावट)
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              वेबसाइट लोड होने में समस्या आई। नीचे दिए गए बटन से पेज रिफ्रेश करें।
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Page (पेज रीलोड करें)</span>
              </button>

              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                title="Clear saved cache"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
