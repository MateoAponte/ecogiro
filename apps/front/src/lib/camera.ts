import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { isNative, isPluginAvailable } from './platform';

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
  try {
    // Check camera permissions first
    const permissions = await Camera.checkPermissions();
    
    if (permissions.camera !== 'granted') {
      const requested = await Camera.requestPermissions();
      if (requested.camera !== 'granted') {
        throw new Error('Camera permission denied');
      }
    }

    const photo: Photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 1280,
      height: 720,
      correctOrientation: true,
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
    console.error('Error taking photo:', error);
    return null;
  }
};

/**
 * Pick an image from the gallery
 */
export const pickFromGallery = async (): Promise<CapturedImage | null> => {
  try {
    const permissions = await Camera.checkPermissions();
    
    if (permissions.photos !== 'granted') {
      const requested = await Camera.requestPermissions();
      if (requested.photos !== 'granted') {
        throw new Error('Photo library permission denied');
      }
    }

    const photo: Photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: 1280,
      height: 720,
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
    console.error('Error picking photo:', error);
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
