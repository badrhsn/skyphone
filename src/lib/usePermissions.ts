'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Permission Status
 */
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  CHECKING = 'checking',
  ERROR = 'error'
}

/**
 * Permission Type
 */
export enum PermissionType {
  MICROPHONE = 'microphone',
  CAMERA = 'camera',
  NOTIFICATIONS = 'notifications',
  GEOLOCATION = 'geolocation'
}

/**
 * Permission State Interface
 */
export interface PermissionState {
  microphone: PermissionStatus;
  camera: PermissionStatus;
  notifications: PermissionStatus;
  geolocation: PermissionStatus;
}

/**
 * usePermissions Hook
 * Checks and requests browser permissions
 * Handles permission state changes
 */
export function usePermissions(): PermissionState & {
  requestMicrophone: () => Promise<boolean>;
  requestCamera: () => Promise<boolean>;
  requestNotifications: () => Promise<boolean>;
  requestGeolocation: () => Promise<GeolocationCoordinates | null>;
  refetch: () => Promise<void>;
  hasPermission: (type: PermissionType) => boolean;
  subscribe: (callback: (state: PermissionState) => void) => () => void;
} {
  const [permissions, setPermissions] = useState<PermissionState>({
    microphone: PermissionStatus.CHECKING,
    camera: PermissionStatus.CHECKING,
    notifications: PermissionStatus.CHECKING,
    geolocation: PermissionStatus.CHECKING,
  });

  const subscriptionsRef = useRef<Set<(state: PermissionState) => void>>(new Set());

  /**
   * Check permission status
   */
  const checkPermission = useCallback(
    async (type: PermissionType): Promise<PermissionStatus> => {
      try {
        if (typeof navigator === 'undefined') {
          return PermissionStatus.ERROR;
        }

        switch (type) {
          case PermissionType.MICROPHONE:
            return await checkMicrophonePermission();
          case PermissionType.CAMERA:
            return await checkCameraPermission();
          case PermissionType.NOTIFICATIONS:
            return await checkNotificationPermission();
          case PermissionType.GEOLOCATION:
            return await checkGeolocationPermission();
          default:
            return PermissionStatus.ERROR;
        }
      } catch (error) {
        console.error(`[usePermissions] Error checking ${type} permission:`, error);
        return PermissionStatus.ERROR;
      }
    },
    []
  );

  const checkMicrophonePermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      // Try using Permissions API (Chrome, Edge, Firefox)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ 
            name: 'microphone' as any 
          });
          return result.state as PermissionStatus;
        } catch (e) {
          // Permissions API not fully supported, try getUserMedia
        }
      }

      // Fallback: Try to get microphone access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return PermissionStatus.GRANTED;
      } catch (error: any) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          return PermissionStatus.DENIED;
        } else if (error.name === 'NotFoundError') {
          return PermissionStatus.ERROR;
        }
        return PermissionStatus.PROMPT;
      }
    } catch (error) {
      console.error('[usePermissions] Microphone check error:', error);
      return PermissionStatus.ERROR;
    }
  }, []);

  const checkCameraPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ 
            name: 'camera' as any 
          });
          return result.state as PermissionStatus;
        } catch (e) {
          // Not supported
        }
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return PermissionStatus.GRANTED;
      } catch (error: any) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          return PermissionStatus.DENIED;
        }
        return PermissionStatus.PROMPT;
      }
    } catch (error) {
      return PermissionStatus.ERROR;
    }
  }, []);

  const checkNotificationPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      if (typeof Notification === 'undefined') {
        return PermissionStatus.ERROR;
      }

      return Notification.permission as PermissionStatus;
    } catch (error) {
      return PermissionStatus.ERROR;
    }
  }, []);

  const checkGeolocationPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ 
            name: 'geolocation' as any 
          });
          return result.state as PermissionStatus;
        } catch (e) {
          // Not supported
        }
      }

      // Try to get location
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(PermissionStatus.GRANTED),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve(PermissionStatus.DENIED);
            } else {
              resolve(PermissionStatus.PROMPT);
            }
          }
        );
      });
    } catch (error) {
      return PermissionStatus.ERROR;
    }
  }, []);

  /**
   * Request microphone permission
   */
  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      await refetch();
      return true;
    } catch (error: any) {
      console.error('[usePermissions] Microphone request failed:', error);
      await refetch();
      return false;
    }
  }, []);

  /**
   * Request camera permission
   */
  const requestCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      await refetch();
      return true;
    } catch (error) {
      console.error('[usePermissions] Camera request failed:', error);
      await refetch();
      return false;
    }
  }, []);

  /**
   * Request notification permission
   */
  const requestNotifications = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof Notification === 'undefined') {
        return false;
      }

      const result = await Notification.requestPermission();
      await refetch();
      return result === PermissionStatus.GRANTED;
    } catch (error) {
      console.error('[usePermissions] Notification request failed:', error);
      await refetch();
      return false;
    }
  }, []);

  /**
   * Request geolocation permission
   */
  const requestGeolocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          refetch();
          resolve(position.coords);
        },
        (error) => {
          console.error('[usePermissions] Geolocation request failed:', error);
          refetch();
          resolve(null);
        }
      );
    });
  }, []);

  /**
   * Refetch all permissions
   */
  const refetch = useCallback(async () => {
    const [mic, cam, notif, geo] = await Promise.all([
      checkPermission(PermissionType.MICROPHONE),
      checkPermission(PermissionType.CAMERA),
      checkPermission(PermissionType.NOTIFICATIONS),
      checkPermission(PermissionType.GEOLOCATION),
    ]);

    const newState: PermissionState = {
      microphone: mic,
      camera: cam,
      notifications: notif,
      geolocation: geo,
    };

    setPermissions(newState);

    // Notify subscribers
    subscriptionsRef.current.forEach(callback => callback(newState));
  }, [checkPermission]);

  /**
   * Subscribe to permission changes
   */
  const subscribe = useCallback(
    (callback: (state: PermissionState) => void): (() => void) => {
      subscriptionsRef.current.add(callback);
      return () => {
        subscriptionsRef.current.delete(callback);
      };
    },
    []
  );

  /**
   * Check if specific permission is granted
   */
  const hasPermission = useCallback((type: PermissionType): boolean => {
    switch (type) {
      case PermissionType.MICROPHONE:
        return permissions.microphone === PermissionStatus.GRANTED;
      case PermissionType.CAMERA:
        return permissions.camera === PermissionStatus.GRANTED;
      case PermissionType.NOTIFICATIONS:
        return permissions.notifications === PermissionStatus.GRANTED;
      case PermissionType.GEOLOCATION:
        return permissions.geolocation === PermissionStatus.GRANTED;
      default:
        return false;
    }
  }, [permissions]);

  /**
   * Initial check
   */
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    ...permissions,
    requestMicrophone,
    requestCamera,
    requestNotifications,
    requestGeolocation,
    refetch,
    hasPermission,
    subscribe,
  };
}

export default usePermissions;
