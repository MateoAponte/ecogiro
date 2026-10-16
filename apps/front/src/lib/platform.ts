import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for Capacitor
 * Use these to conditionally run code based on the runtime environment
 */

/**
 * Check if running in a native app (iOS or Android)
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get current platform name
 */
export const getPlatformName = (): 'android' | 'ios' | 'web' => {
  return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};

/**
 * Check if a plugin is available on the current platform
 */
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName);
};

/**
 * Platform-specific utilities
 */
export const platform = {
  isNative,
  isAndroid,
  isIOS,
  isWeb,
  getPlatformName,
  isPluginAvailable,
};

export default platform;
