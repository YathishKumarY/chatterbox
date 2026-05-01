import { useRef, useState, useCallback } from 'react';
import { ConversationList } from '../sidebar/ConversationList';
import { ChatWindow } from '../chat/ChatWindow';
import { useChatStore } from '../../store/chatStore';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;

export function AppLayout() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMouseMove(ev: MouseEvent) {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + ev.clientX - startX));
      setSidebarWidth(newWidth);
    }

    function onMouseUp() {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  return (
    <div className="flex h-screen bg-whatsapp-bg">
      <div
        className={`border-r border-gray-200 ${
          activeConversationId ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full md:w-auto'
        }`}
        style={{ width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      >
        <ConversationList />
      </div>

      <div
        onMouseDown={handleMouseDown}
        className="hidden md:flex w-1 cursor-col-resize hover:bg-whatsapp-teal/40 active:bg-whatsapp-teal/60 transition-colors flex-shrink-0"
      />

      <div
        className={`flex-1 min-w-0 ${
          activeConversationId ? 'flex flex-col' : 'hidden md:flex md:flex-col'
        }`}
      >
        <ChatWindow />
      </div>
    </div>
  );
}
