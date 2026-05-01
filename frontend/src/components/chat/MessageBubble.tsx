import { formatMessageTime } from '../../utils/formatTime';
import { MessageStatus } from './MessageStatus';

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
  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[85%] md:max-w-[65%] px-3 py-1.5 rounded-lg relative overflow-hidden ${
          isSender ? 'bg-cb-light' : 'bg-white'
        } ${pending ? 'opacity-60' : ''} ${failed ? 'border border-red-400' : ''} shadow-sm`}
      >
        {isGroup && !isSender && senderName && (
          <p className="text-xs font-medium text-cb-teal mb-0.5">{senderName}</p>
        )}
        <div className="flex items-end gap-1">
          <p className="text-sm text-gray-900 whitespace-pre-wrap break-words min-w-0">{content}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0 ml-1 -mb-0.5">
            <span className="text-[10px] text-gray-500">{formatMessageTime(createdAt)}</span>
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
