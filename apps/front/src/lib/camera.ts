import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { isIOS, isPluginAvailable } from './platform';

let cameraError: string | null = null;
export const getCameraError = (): string | null => cameraError;

async function requestIOSPermission(kind: 'camera' | 'photos'): Promise<void> {
  if (!isIOS()) return;
  let permissions = await Camera.checkPermissions();
  if (permissions[kind] === 'prompt' || permissions[kind] === 'prompt-with-rationale') {
    permissions = await Camera.requestPermissions({ permissions: [kind] });
  }
  if (
    permissions[kind] !== 'granted' &&
    !(kind === 'photos' && permissions.photos === 'limited')
  ) {
    throw new Error(
      kind === 'camera'
        ? 'Permite el acceso a la cámara en los ajustes del teléfono.'
        : 'Permite el acceso a las fotos en los ajustes del teléfono.',
    );
  }
}

/**
 * Camera utilities that work across web and native platforms
 */

export interface CapturedImage {
  dataUrl: string;
  format: string;
  webPath?: string;
}

/**
 * Check if native camera is available
 */
export const isCameraAvailable = (): boolean => {
  return isPluginAvailable('Camera');
};

/**
 * Take a photo using native camera (for Capacitor) or fallback to web
 * Returns a data URL of the captured image
 */
export const takePhoto = async (): Promise<CapturedImage | null> => {
  cameraError = null;
  try {
    // Android delegates to the system camera; no storage/gallery access is needed.
    await requestIOSPermission('camera');

    const photo: Photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 1280,
      height: 720,
      correctOrientation: true,
      saveToGallery: false,
    });

    if (!photo.dataUrl) {
      throw new Error('No image data received');
    }

    return {
      dataUrl: photo.dataUrl,
      format: photo.format,
      webPath: photo.webPath,
    };
  } catch (error) {
    cameraError =
      error instanceof Error
        ? error.message
        : 'No se pudo abrir la cámara. Revisa sus permisos en los ajustes del teléfono.';
    return null;
  }
};

/**
 * Pick an image from the gallery
 */
export const pickFromGallery = async (): Promise<CapturedImage | null> => {
  cameraError = null;
  try {
    // Android Photo Picker grants access only to the selected image.
    await requestIOSPermission('photos');

    const photo: Photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: 1280,
      height: 720,
      saveToGallery: false,
    });

    if (!photo.dataUrl) {
      throw new Error('No image data received');
    }

    return {
      dataUrl: photo.dataUrl,
      format: photo.format,
      webPath: photo.webPath,
    };
  } catch (error) {
    cameraError =
      error instanceof Error
        ? error.message
        : 'No se pudo abrir la galería. Revisa los permisos en los ajustes del teléfono.';
    return null;
  }
};

/**
 * Camera service with all utilities
 */
export const cameraService = {
  isAvailable: isCameraAvailable,
  takePhoto,
  pickFromGallery,
};

export default cameraService;
