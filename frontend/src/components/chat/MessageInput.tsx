import { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import { useThemeStore } from '../../store/themeStore';
import { Send, Smile } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData, SkinTones, SkinTonePickerLocation } from 'emoji-picker-react';

function unifiedToNative(unified: string): string {
  return unified.split('-').map((hex) => String.fromCodePoint(parseInt(hex, 16))).join('');
}

export function MessageInput() {
  const [content, setContent] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [skinTone, setSkinTone] = useState<SkinTones>(() => {
    const stored = localStorage.getItem('chatterbox-skin-tone');
    return (stored as SkinTones) || SkinTones.NEUTRAL;
  });
  const { sendMessage, emitTyping } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const appTheme = useThemeStore((s) => s.theme);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!showPicker) return;
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setContent('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    emitTyping();
  };

  const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const emoji = emojiData.isCustom ? emojiData.emoji : unifiedToNative(emojiData.unified);
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        const pos = start + emoji.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      });
    } else {
      setContent((prev) => prev + emoji);
    }
    setShowPicker(false);
  }, [content]);

  return (
    <form onSubmit={handleSubmit} className="bg-cb-panel px-4 py-3 flex items-end gap-3">
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setShowPicker((v) => !v)}
          className="p-2 rounded-full hover:bg-cb-surface-active transition-colors text-cb-text-secondary flex-shrink-0"
        >
          <Smile className="w-5 h-5" />
        </button>
        {showPicker && (
          <div className="absolute bottom-full mb-2 left-0 z-50 max-w-[calc(100vw-2rem)]">
            <EmojiPicker
              key={skinTone}
              theme={appTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
              onEmojiClick={onEmojiClick}
              defaultSkinTone={skinTone}
              skinTonePickerLocation={SkinTonePickerLocation.SEARCH}
              onSkinToneChange={(tone) => {
                setSkinTone(tone);
                localStorage.setItem('chatterbox-skin-tone', tone);
              }}
            />
          </div>
        )}
      </div>

      <textarea
        ref={inputRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        className="flex-1 bg-cb-surface rounded-lg px-4 py-2 outline-none resize-none text-sm max-h-32 border border-cb-border focus:border-cb-teal text-cb-text-primary placeholder:text-cb-text-muted"
        placeholder="Type a message"
        style={{ minHeight: '40px' }}
      />
      <button
        type="submit"
        disabled={!content.trim()}
        className="bg-cb-teal text-white p-2 rounded-full hover:bg-cb-dark transition-colors disabled:opacity-50 flex-shrink-0"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}
