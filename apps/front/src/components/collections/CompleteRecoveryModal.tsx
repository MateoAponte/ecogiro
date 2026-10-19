import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isNative } from '@/lib/platform';
import { takePhoto, getCameraError } from '@/lib/camera';
import { apiAchieved, apiCompleteRecovery } from '@/lib/completion-api';

export function CompleteRecoveryModal({
  recoveryId,
  onClose,
  onCompleted,
}: {
  recoveryId: string;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const request = useRef<AbortController | null>(null);
  const working = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [stage, setStage] = useState('Verificando foto...');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [cameraAttempt, setCameraAttempt] = useState(0);

  useEffect(() => {
    if (isNative()) return;
    let disposed = false;
    setReady(false);
    void navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false,
      })
      .then((media) => {
        if (disposed) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = media;
        if (video.current) video.current.srcObject = media;
      })
      .catch(() => {
        if (!disposed)
          setError(
            'No se pudo abrir la cámara. Revisa el permiso y usa HTTPS o localhost.',
          );
      });
    if (!navigator.mediaDevices) setError('La cámara requiere HTTPS o localhost.');
    return () => {
      disposed = true;
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
  }, [cameraAttempt]);

  useEffect(() => () => request.current?.abort(), []);

  const submit = async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      let token = receipt;
      if (!token) {
        let image: string;
        if (isNative()) {
          const captured = await takePhoto();
          if (!captured)
            throw new Error(
              getCameraError() ?? 'No se tomó la foto. Intenta nuevamente.',
            );
          image = captured.dataUrl;
        } else {
          const current = video.current;
          if (!current?.videoWidth) throw new Error('Espera a que la cámara esté lista.');
          const canvas = document.createElement('canvas');
          canvas.width = current.videoWidth;
          canvas.height = current.videoHeight;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('No se pudo capturar la imagen.');
          context.drawImage(current, 0, 0);
          image = canvas.toDataURL('image/jpeg', 0.8);
        }
        setPhoto(image);
        setStage('Verificando foto...');
        const result = await apiAchieved(image, recoveryId, controller.signal);
        token = result.verification_token;
        setReceipt(token);
      }
      setStage('Completando recolección...');
      await apiCompleteRecovery(recoveryId, token, controller.signal);
      onCompleted();
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo completar. Intenta nuevamente.',
        );
    } finally {
      working.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !working.current) onClose();
      }}
    >
      <DialogContent
        className="max-w-md"
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Completar recolección</DialogTitle>
          <DialogDescription>
            Toma una foto clara de los materiales recolectados para verificar y completar
            la solicitud.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black">
          {!isNative() && (
            <video
              ref={video}
              autoPlay
              playsInline
              muted
              onLoadedData={() => setReady(true)}
              className="h-full w-full object-cover"
            />
          )}
          {photo && (busy || receipt) && (
            <img
              src={photo}
              alt="Materiales recolectados"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {isNative() && !photo && (
            <Camera className="absolute inset-0 m-auto h-16 w-16 text-white" />
          )}
          <div className="absolute inset-8 border-2 border-white/60 rounded-3xl pointer-events-none" />
          {busy && (
            <div
              role="status"
              className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-black/60 text-white"
            >
              <Loader2 className="animate-spin" />
              {stage}
            </div>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          disabled={busy || (!isNative() && !ready && !receipt)}
          onClick={() => void submit()}
          className="gap-2"
        >
          <Camera className="h-5 w-5" />
          {receipt ? 'Reintentar completar' : 'Tomar foto y completar'}
        </Button>
        {!busy && (
          <Button
            variant="outline"
            onClick={() => {
              setReceipt(null);
              setPhoto(null);
              setError(null);
              setCameraAttempt((value) => value + 1);
            }}
          >
            Reiniciar cámara / tomar otra foto
          </Button>
        )}
        <Button variant="ghost" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
