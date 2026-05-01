import { Check } from 'lucide-react';

interface Props {
  statuses: { status: string }[];
  isSender: boolean;
}

function DoubleCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12l5 5L18 6" />
      <path d="M7 12l5 5L23 6" />
    </svg>
  );
}

export function MessageStatus({ statuses, isSender }: Props) {
  if (!isSender || statuses.length === 0) return null;

  const allRead = statuses.every((s) => s.status === 'read');
  const allDelivered = statuses.every((s) => s.status === 'delivered' || s.status === 'read');

  if (allRead) {
    return <DoubleCheck className="w-[18px] h-[18px] text-blue-400 flex-shrink-0" />;
  }
  if (allDelivered) {
    return <DoubleCheck className="w-[18px] h-[18px] text-cb-text-muted flex-shrink-0" />;
  }
  return <Check className="w-4 h-4 text-cb-text-muted flex-shrink-0" />;
}
