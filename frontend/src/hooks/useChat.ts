import { useCallback, useRef } from 'react';
import { getSocket } from '../socket/client';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';


function generateId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
}

export function useChat() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const addOptimisticMessage = useChatStore((s) => s.addOptimisticMessage);
  const confirmMessage = useChatStore((s) => s.confirmMessage);
  const user = useAuthStore((s) => s.user);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const failMessage = useChatStore((s) => s.failMessage);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !user) return;
      const socket = getSocket();
      if (!socket) return;

      const clientMessageId = generateId();
      const conversationId = activeConversationId;
      const tempId = addOptimisticMessage(conversationId, content, {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      }, clientMessageId);

      // If the socket disconnects before ack returns, mark the message as failed.
      const ackTimeout = setTimeout(() => {
        failMessage(tempId, conversationId);
      }, 15_000);

      socket.emit(
        'message:send',
        { conversationId, content, clientMessageId },
        (response: { success: boolean; message?: any }) => {
          clearTimeout(ackTimeout);
          if (response?.success && response.message) {
            confirmMessage(tempId, response.message);
          } else {
            failMessage(tempId, conversationId);
          }
        },
      );
    },
    [activeConversationId, user, addOptimisticMessage, confirmMessage, failMessage],
  );

  const emitTyping = useCallback(() => {
    if (!activeConversationId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing:start', { conversationId: activeConversationId });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: activeConversationId });
    }, 2000);
  }, [activeConversationId]);

  const markAsRead = useCallback(
    (conversationId: string) => {
      const socket = getSocket();
      if (!socket) return;
      socket.emit('message:read', { conversationId });
      useChatStore.getState().markConversationRead(conversationId);
    },
    [],
  );

  return { sendMessage, emitTyping, markAsRead };
}
