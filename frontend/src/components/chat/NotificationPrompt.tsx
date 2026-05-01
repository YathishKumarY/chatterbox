import { usePushNotifications } from '../../hooks/usePushNotifications';

export function NotificationPrompt() {
  const { requestPermission, isSupported } = usePushNotifications();

  if (!isSupported || Notification.permission === 'granted' || Notification.permission === 'denied') {
    return null;
  }

  return (
    <div className="bg-whatsapp-panel border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <span className="text-sm text-gray-700">Enable notifications to stay updated</span>
      <button
        onClick={requestPermission}
        className="text-sm text-whatsapp-green font-medium hover:underline"
      >
        Enable
      </button>
    </div>
  );
}
