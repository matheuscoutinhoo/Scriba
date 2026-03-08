import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
   children: ReactNode;
}

interface ErrorBoundaryState {
   hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
   state: ErrorBoundaryState = { hasError: false };

   static getDerivedStateFromError(): ErrorBoundaryState {
      return { hasError: true };
   }

   componentDidCatch(error: Error, info: ErrorInfo): void {
      console.error('ErrorBoundary caught:', error, info.componentStack);
   }

   render() {
      if (this.state.hasError) {
         return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-8">
               <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                  Something went wrong
               </h1>
               <p className="text-[var(--color-text-muted)] mb-4">
                  An unexpected error occurred. Please refresh the page.
               </p>
               <button
                  onClick={() => this.setState({ hasError: false })}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer"
               >
                  Try Again
               </button>
            </div>
         );
      }
      return this.props.children;
   }
}
