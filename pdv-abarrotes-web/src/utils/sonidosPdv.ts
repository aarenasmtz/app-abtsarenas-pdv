/**
 * Generador nativo de retroalimentación sonora con Web Audio API para el Punto de Venta.
 * No requiere archivos MP3 ni descargas externas.
 */

let audioCtx: AudioContext | null = null;

function obtenerAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Emite un "beep" corto y agudo (1760 Hz) idéntico al sonido de confirmación de un escáner Zebra / Honeywell.
 */
export function reproducirBeepExito(): void {
  try {
    const ctx = obtenerAudioContext();
    if (!ctx) return;

    const oscilador = ctx.createOscillator();
    const ganancia = ctx.createGain();

    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(1760, ctx.currentTime); // Tono La (A6)

    ganancia.gain.setValueAtTime(0.15, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.065);

    oscilador.connect(ganancia);
    ganancia.connect(ctx.destination);

    oscilador.start(ctx.currentTime);
    oscilador.stop(ctx.currentTime + 0.07);
  } catch {
    // Silencioso si el navegador restringe audio
  }
}

/**
 * Emite un tono grave doble de advertencia (440 Hz -> 220 Hz) cuando un producto no existe o hay error de cobro.
 */
export function reproducirBeepError(): void {
  try {
    const ctx = obtenerAudioContext();
    if (!ctx) return;

    const oscilador = ctx.createOscillator();
    const ganancia = ctx.createGain();

    oscilador.type = 'sawtooth';
    oscilador.frequency.setValueAtTime(440, ctx.currentTime);
    oscilador.frequency.setValueAtTime(220, ctx.currentTime + 0.08);

    ganancia.gain.setValueAtTime(0.2, ctx.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    oscilador.connect(ganancia);
    ganancia.connect(ctx.destination);

    oscilador.start(ctx.currentTime);
    oscilador.stop(ctx.currentTime + 0.23);
  } catch {
    // Silencioso si el navegador restringe audio
  }
}
