// frontend/src/components/CameraCapture.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiRotateCcw, FiRefreshCw } from 'react-icons/fi';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

// Convierte el modo técnico de MediaDevices en una etiqueta para la interfaz.
const getCameraLabel = (mode: 'environment' | 'user') =>
  mode === 'environment' ? 'trasera' : 'delantera';

/** Controla permisos, flujo de cámara, vista previa, captura y liberación del stream. */
export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableModes, setAvailableModes] = useState<Array<'environment' | 'user'>>(['user']);

  // Detiene todas las pistas para soltar cámara y permisos al cerrar.
  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Examina dispositivos para mostrar cambio de cámara solo si es posible.
    const detectAvailableModes = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        if (isMounted) setAvailableModes(['user']);
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');

        if (!isMounted) return;

        const modes: Array<'environment' | 'user'> = [];

        if (videoInputs.length > 0) {
          modes.push('user');
        }

        const rearDetected = videoInputs.some((device) => {
          const label = device.label.toLowerCase();
          return (
            label.includes('back') ||
            label.includes('rear') ||
            label.includes('environment') ||
            label.includes('trasera') ||
            label.includes('cámara trasera')
          );
        });

        if (rearDetected && videoInputs.length > 1) {
          modes.push('environment');
        }

        setAvailableModes(modes.length > 0 ? modes : ['user']);
      } catch {
        if (isMounted) setAvailableModes(['user']);
      }
    };

    detectAvailableModes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setError(null);
    setErrorDetail(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite acceder a la cámara. Usa "Subir imagen" en su lugar.');
      return;
    }

    // Traduce errores de MediaDevices a instrucciones comprensibles.
    const describeError = (err: unknown) => {
      const name = err instanceof DOMException ? err.name : '';
      switch (name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return 'Bloqueaste el permiso de cámara para este sitio. Haz clic en el ícono de candado junto a la URL y permite el acceso a la cámara, luego vuelve a intentar.';
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          return 'No se detectó ninguna cámara conectada en este dispositivo.';
        case 'NotReadableError':
        case 'TrackStartError':
          return 'La cámara está siendo usada por otra aplicación (Zoom, Teams, otra pestaña, etc.). Ciérrala e intenta de nuevo.';
        case 'AbortError':
          return 'La cámara tardó demasiado en iniciar. Esto es común en algunos webcams integrados. Intenta de nuevo.';
        case 'OverconstrainedError':
          if (facingMode === 'environment') {
            return 'Tu dispositivo no tiene cámara trasera compatible. La cámara delantera sigue disponible si tu equipo la tiene.';
          }
          return 'No se encontró una cámara que cumpla los requisitos solicitados.';
        default:
          return 'No se pudo acceder a la cámara. Revisa los permisos del navegador.';
      }
    };

    const hasRearCamera = availableModes.includes('environment');
    if (facingMode === 'environment' && !hasRearCamera) {
      setError('Tu PC no tiene cámara trasera compatible. No es compatible con esta opción.');
      setErrorDetail('La cámara trasera no está disponible en este equipo. Puedes usar la cámara delantera si tu dispositivo la tiene.');
      return;
    }

    const strategies: MediaStreamConstraints[] = [
      { video: { facingMode: { exact: facingMode } }, audio: false },
      { video: { facingMode: { ideal: facingMode } }, audio: false },
      { video: true, audio: false },
    ];

    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

    // Intenta abrir cámara trasera y recurre a estrategias compatibles.
    const start = async () => {
      let lastErr: unknown = null;

      for (let attempt = 0; attempt < strategies.length; attempt++) {
        if (!active) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia(strategies[attempt]);
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          return;
        } catch (err) {
          lastErr = err;
          const name = err instanceof DOMException ? err.name : '';
          if (name === 'AbortError' || name === 'NotReadableError') {
            await wait(500);
            continue;
          }
          break;
        }
      }

      if (!active) return;
      setError(describeError(lastErr));
      setErrorDetail(
        lastErr instanceof DOMException ? `${lastErr.name}: ${lastErr.message}` : String(lastErr)
      );
    };

    start();

    return () => {
      active = false;
      stopStream();
    };
  }, [availableModes, facingMode, retryKey]);

  // Copia el frame actual del video a una imagen JPEG.
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.92));
  };

  // Convierte la previsualización a File y devuelve la captura al padre.
  const handleConfirm = async () => {
    if (!photo) return;
    stopStream();
    const res = await fetch(photo);
    const blob = await res.blob();
    const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
  };

  // Quita la previsualización para volver a capturar.
  const handleRetake = () => setPhoto(null);

  // Alterna entre cámaras detectadas e inicia un nuevo stream.
  const handleSwitchCamera = () => {
    if (error) {
      setError(null);
      setErrorDetail(null);
    }

    if (facingMode === 'environment' && !availableModes.includes('environment')) {
      setError('Tu PC no tiene cámara trasera compatible. No es compatible con esta opción.');
      setErrorDetail('La cámara trasera no está disponible en este equipo.');
      return;
    }

    setPhoto(null);
    setError(null);
    setErrorDetail(null);
    setFacingMode((current) => (current === 'environment' ? 'user' : 'environment'));
  };

  // Libera recursos de cámara antes de cerrar el diálogo.
  const handleClose = () => {
    stopStream();
    onClose();
  };

  const canSwitchCamera = availableModes.length > 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-[28rem] shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-[#283618] text-white">
          <div>
            <h3 className="font-semibold text-sm">Tomar foto</h3>
            {!error && !photo && (
              <p className="text-[11px] text-[#FEFAE0]/80 mt-0.5">
                Cámara {getCameraLabel(facingMode)}
              </p>
            )}
          </div>
          <button onClick={handleClose} aria-label="Cerrar">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center px-6 py-8 max-w-sm">
              <p className="text-white text-sm leading-relaxed">{error}</p>
              {errorDetail && (
                <span className="block mt-3 text-white/55 text-[11px] font-mono leading-relaxed">
                  {errorDetail}
                </span>
              )}
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg px-4 py-2 transition-colors"
              >
                <FiRotateCcw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          ) : photo ? (
            <img src={photo} alt="Foto capturada" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {!error && !photo && canSwitchCamera && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              aria-label={`Cambiar a cámara ${facingMode === 'environment' ? 'frontal' : 'trasera'}`}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <FiRefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-3">
          {photo ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FiRotateCcw className="w-4 h-4" />
                Repetir
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-[#283618] hover:bg-[#1e290f] text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                Usar esta foto
              </button>
            </>
          ) : (
            <button
              onClick={handleCapture}
              disabled={!!error}
              className="w-full flex items-center justify-center gap-2 bg-[#283618] hover:bg-[#1e290f] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
            >
              <FiCamera className="w-4 h-4" />
              Capturar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
