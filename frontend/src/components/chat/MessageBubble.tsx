import { formatMessageTime } from '../../utils/formatTime';
import { MessageStatus } from './MessageStatus';

const emojiOnlyRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|️|‍|⃣|[\u{1F1E0}-\u{1F1FF}]){1,8}$/u;

function isEmojiOnly(text: string): boolean {
  return emojiOnlyRegex.test(text.trim());
}

interface Props {
  content: string;
  createdAt: string;
  isSender: boolean;
  senderName?: string;
  isGroup: boolean;
  statuses: { status: string }[];
  pending?: boolean;
  failed?: boolean;
}

export function MessageBubble({ content, createdAt, isSender, senderName, isGroup, statuses, pending, failed }: Props) {
  const emojiOnly = isEmojiOnly(content);

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[85%] md:max-w-[65%] rounded-lg relative overflow-hidden ${
          emojiOnly ? 'bg-transparent shadow-none px-1 py-0.5' : `px-3 py-1.5 ${isSender ? 'bg-cb-light' : 'bg-cb-surface'} shadow-sm`
        } ${pending ? 'opacity-60' : ''} ${failed ? 'border border-red-400' : ''}`}
      >
        {isGroup && !isSender && senderName && (
          <p className="text-xs font-medium text-cb-teal mb-0.5">{senderName}</p>
        )}
        <div className="flex items-end gap-1">
          <p className={`whitespace-pre-wrap break-words min-w-0 ${
            emojiOnly ? 'text-4xl leading-tight' : 'text-sm text-cb-text-primary'
          }`}>{content}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1 -mb-0.5">
            <span className="text-[10px] text-cb-text-secondary">{formatMessageTime(createdAt)}</span>
            <MessageStatus statuses={statuses} isSender={isSender} />
          </div>
        </div>
        {failed && (
          <p className="text-[10px] text-red-500 mt-0.5">Failed to send</p>
        )}
      </div>
    </div>
  );
}
