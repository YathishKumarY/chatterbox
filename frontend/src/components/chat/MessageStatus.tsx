import { Check, CheckCheck } from 'lucide-react';

interface Props {
  statuses: { status: string }[];
  isSender: boolean;
}

export function MessageStatus({ statuses, isSender }: Props) {
  if (!isSender || statuses.length === 0) return null;

  const allRead = statuses.every((s) => s.status === 'read');
  const allDelivered = statuses.every((s) => s.status === 'delivered' || s.status === 'read');

  if (allRead) {
    return <CheckCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />;
  }
  if (allDelivered) {
    return <CheckCheck className="w-4 h-4 text-cb-text-muted flex-shrink-0" />;
  }
  return <Check className="w-4 h-4 text-cb-text-muted flex-shrink-0" />;
}
