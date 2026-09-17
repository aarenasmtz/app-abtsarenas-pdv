import { useEffect, useRef } from 'react';

interface PropiedadesEscaner {
  onCodigoEscaneado: (codigo: string) => void;
  activo?: boolean;
  tiempoMaximoEntreTeclasMs?: number;
}

/**
 * Hook global en español para interceptar ráfagas de teclado del lector de código de barras HID.
 * Detecta pulsaciones ultrarrápidas (<40ms) que finalizan con la tecla Enter.
 */
export function useEscanerCodigoBarras({
  onCodigoEscaneado,
  activo = true,
  tiempoMaximoEntreTeclasMs = 45,
}: PropiedadesEscaner) {
  const bufferRef = useRef<string>('');
  const ultimaTeclaTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!activo) return;

    const manejarKeyDown = (evento: KeyboardEvent) => {
      // Ignorar eventos si el foco está en un campo de texto regular donde el usuario escribe manualmente
      const objetivo = evento.target as HTMLElement | null;
      const esInputEditable =
        objetivo &&
        (objetivo.tagName === 'INPUT' || objetivo.tagName === 'TEXTAREA') &&
        !objetivo.classList.contains('input-escaner-permitido');

      if (esInputEditable) {
        return;
      }

      const ahora = Date.now();
      const diferenciaTiempo = ahora - ultimaTeclaTimestampRef.current;
      ultimaTeclaTimestampRef.current = ahora;

      if (evento.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const codigoCompleto = bufferRef.current.trim();
          onCodigoEscaneado(codigoCompleto);
          evento.preventDefault();
        }
        bufferRef.current = '';
        return;
      }

      // Si pasa demasiado tiempo entre caracteres, se asume que no es un escáner y se limpia el búfer
      if (diferenciaTiempo > tiempoMaximoEntreTeclasMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Aceptar solo caracteres alfanuméricos comunes en códigos de barras
      if (evento.key.length === 1) {
        bufferRef.current += evento.key;
      }
    };

    window.addEventListener('keydown', manejarKeyDown);
    return () => {
      window.removeEventListener('keydown', manejarKeyDown);
    };
  }, [activo, onCodigoEscaneado, tiempoMaximoEntreTeclasMs]);
}
