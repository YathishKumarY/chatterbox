import { usePushNotifications } from '../../hooks/usePushNotifications';

export function NotificationPrompt() {
  const { requestPermission, isSupported } = usePushNotifications();

  if (!isSupported || Notification.permission === 'granted' || Notification.permission === 'denied') {
    return null;
  }

  return (
    <div className="bg-cb-panel border-b border-cb-border px-4 py-2 flex items-center justify-between">
      <span className="text-sm text-cb-text-secondary">Enable notifications to stay updated</span>
      <button
        onClick={requestPermission}
        className="text-sm text-cb-green font-medium hover:underline"
      >
        Enable
      </button>
    </div>
  );
}
