import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] text-center p-8 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl">
            <h2 className="text-xl md:text-2xl font-light text-red-400 mb-4 uppercase tracking-wider">
              ვიზუალიზაციის შეცდომა
            </h2>
            <p className="text-white/60 max-w-md text-sm md:text-base leading-relaxed mb-6">
              სიმულატორის ჩატვირთვა ვერ მოხერხდა. შესაძლოა თქვენს ბრაუზერს არ აქვს WebGL-ის მხარდაჭერა ან ვიზუალიზაციის დროს მოხდა შეცდომა.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-light uppercase tracking-widest border border-white/10 transition-all"
            >
              გვერდის განახლება
            </button>
            {this.state.error && (
              <pre className="mt-8 p-4 bg-black/40 rounded text-left text-xs font-mono text-red-300 max-w-lg overflow-auto w-full border border-white/5 opacity-55">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
