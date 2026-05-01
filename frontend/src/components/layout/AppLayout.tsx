import { useRef, useState, useCallback, useEffect } from 'react';
import { ConversationList } from '../sidebar/ConversationList';
import { ChatWindow } from '../chat/ChatWindow';
import { useChatStore } from '../../store/chatStore';

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 400;
const MD_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MD_BREAKPOINT : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MD_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export function AppLayout() {
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);
  const isMobile = useIsMobile();

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
    <div className="flex flex-1 min-h-0 bg-cb-bg overflow-hidden">
      <div
        className={`border-r border-cb-border ${
          activeConversationId ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full md:w-auto'
        }`}
        style={isMobile ? undefined : { width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      >
        <ConversationList />
      </div>

      <div
        onMouseDown={handleMouseDown}
        className="hidden md:flex w-1 cursor-col-resize hover:bg-cb-teal/40 active:bg-cb-teal/60 transition-colors flex-shrink-0"
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
