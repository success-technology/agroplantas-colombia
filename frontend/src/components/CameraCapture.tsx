// frontend/src/components/CameraCapture.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiCamera, FiRotateCcw } from 'react-icons/fi';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let active = true;
    setError(null);
    setErrorDetail(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite acceder a la cámara. Usa "Subir imagen" en su lugar.');
      return;
    }

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
          return 'No se encontró una cámara que cumpla los requisitos solicitados.';
        default:
          return 'No se pudo acceder a la cámara. Revisa los permisos del navegador.';
      }
    };

    // Estrategias de conexión, de la más simple/rápida a la más específica.
    // Empezar con `video: true` evita renegociaciones que en algunos webcams
    // integrados (con sensores extra, ej. IR para Windows Hello) provocan
    // AbortError: "Timeout starting video source".
    const strategies: MediaStreamConstraints[] = [
      { video: true, audio: false },
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
    ];

    const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

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
          return; // éxito, salimos
        } catch (err) {
          lastErr = err;
          const name = err instanceof DOMException ? err.name : '';
          // Errores transitorios (timeout / dispositivo ocupado momentáneamente):
          // pausa breve y prueba la siguiente estrategia.
          if (name === 'AbortError' || name === 'NotReadableError') {
            await wait(500);
            continue;
          }
          // Errores permanentes (permiso denegado, sin cámara): no tiene caso reintentar.
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
  }, [retryKey]);

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

  const handleConfirm = async () => {
    if (!photo) return;
    stopStream();
    const res = await fetch(photo);
    const blob = await res.blob();
    const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onCapture(file);
  };

  const handleRetake = () => setPhoto(null);

  const handleClose = () => {
    stopStream();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 bg-[#283618] text-white">
          <h3 className="font-semibold text-sm">Tomar foto</h3>
          <button onClick={handleClose} aria-label="Cerrar">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
          {error ? (
            <div className="text-center px-6">
              <p className="text-white text-sm">{error}</p>
              {errorDetail && (
                <span className="block mt-2 text-white/50 text-xs font-mono">{errorDetail}</span>
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
        </div>

        <div className="p-4 flex gap-3">
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