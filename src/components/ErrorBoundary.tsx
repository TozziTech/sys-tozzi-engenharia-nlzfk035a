import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 my-4 border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 rounded-md flex flex-col items-center justify-center text-center animate-in fade-in">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
              Algo deu errado ao carregar este componente
            </h2>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 max-w-md">
              {this.state.error?.message ||
                'Um erro inesperado ocorreu. Nossa equipe técnica foi notificada.'}
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
