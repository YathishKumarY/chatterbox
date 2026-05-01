import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { AppLayout } from '../components/layout/AppLayout';
import { NotificationPrompt } from '../components/chat/NotificationPrompt';

export function Chat() {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const user = useAuthStore((s) => s.user);

  useSocket();

  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  if (!user) {
    return (
      <div className="h-full bg-cb-bg flex items-center justify-center">
        <div className="text-cb-teal text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <NotificationPrompt />
      <AppLayout />
    </div>
  );
}
