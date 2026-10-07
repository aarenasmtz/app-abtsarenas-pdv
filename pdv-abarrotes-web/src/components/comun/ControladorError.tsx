import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  alVolver?: () => void;
  mensajeTitulo?: string;
}

interface State {
  tieneError: boolean;
  error: Error | null;
}

export class ControladorError extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { tieneError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { tieneError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error capturado por ControladorError:', error, info);
  }

  handleReiniciar = () => {
    this.setState({ tieneError: false, error: null });
  };

  render() {
    if (this.state.tieneError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            margin: '2rem auto',
            maxWidth: '650px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fee2e2'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              marginBottom: '1.25rem'
            }}
          >
            <AlertTriangle size={32} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
            {this.props.mensajeTitulo || 'Ocurrió un contratiempo visual'}
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0 0 1.5rem 0', maxWidth: '480px', lineHeight: 1.5 }}>
            El sistema evitó una pantalla en blanco. Puedes reintentar la operación o volver de forma segura al panel administrativo.
          </p>

          {this.state.error && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#64748b',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                maxWidth: '100%',
                overflowX: 'auto',
                textAlign: 'left'
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primario"
              onClick={this.handleReiniciar}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
            >
              <RefreshCw size={16} />
              <span>Reintentar pantalla</span>
            </button>

            {this.props.alVolver && (
              <button
                type="button"
                className="btn btn-secundario"
                onClick={this.props.alVolver}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
              >
                <ArrowLeft size={16} />
                <span>Volver al Administrador</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
