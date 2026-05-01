import { useEffect, useCallback, useRef } from 'react';
import client from '../api/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const subscribed = useRef(false);

  const requestPermission = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const { data } = await client.get('/push/vapid-public-key');
      if (!data.key) return false;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.key),
      });

      await client.post('/push/subscribe', subscription.toJSON());
      subscribed.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (Notification.permission === 'granted' && !subscribed.current) {
      requestPermission();
    }
  }, [requestPermission]);

  return { requestPermission, isSupported: 'PushManager' in window };
}
