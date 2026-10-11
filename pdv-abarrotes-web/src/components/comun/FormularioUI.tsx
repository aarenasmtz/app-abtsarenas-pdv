import type { CSSProperties, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

type TipoMensaje = 'error' | 'advertencia' | 'exito' | 'informacion';

interface PropiedadesMensajeFormulario {
  tipo?: TipoMensaje;
  children: ReactNode;
  id?: string;
  className?: string;
}

const iconosMensaje = {
  error: AlertCircle,
  advertencia: TriangleAlert,
  exito: CheckCircle2,
  informacion: Info,
};

export function MensajeFormulario({ tipo = 'informacion', children, id, className = '' }: PropiedadesMensajeFormulario) {
  const Icono = iconosMensaje[tipo];
  const esUrgente = tipo === 'error' || tipo === 'advertencia';

  return (
    <div
      id={id}
      className={`mensaje-formulario mensaje-formulario--${tipo} ${className}`.trim()}
      role={esUrgente ? 'alert' : 'status'}
      aria-live={esUrgente ? 'assertive' : 'polite'}
    >
      <Icono size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

interface PropiedadesAccionesFormulario {
  children: ReactNode;
  className?: string;
}

export function AccionesFormulario({ children, className = '' }: PropiedadesAccionesFormulario) {
  return <div className={`acciones-formulario ${className}`.trim()}>{children}</div>;
}

interface PropiedadesCuadriculaFormulario {
  children: ReactNode;
  columnasMinimas?: number;
  className?: string;
}

export function CuadriculaFormulario({ children, columnasMinimas = 240, className = '' }: PropiedadesCuadriculaFormulario) {
  return (
    <div
      className={`cuadricula-formulario ${className}`.trim()}
      style={{ '--ancho-campo-minimo': `${columnasMinimas}px` } as CSSProperties}
    >
      {children}
    </div>
  );
}
