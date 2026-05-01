import { useEffect } from 'react';
import { useContactStore } from '../../store/contactStore';
import { X, UserCheck, UserX } from 'lucide-react';
import { UserAvatar } from '../common/UserAvatar';

export function ContactRequests({ onClose }: { onClose: () => void }) {
  const incomingRequests = useContactStore((s) => s.incomingRequests);
  const fetchIncomingRequests = useContactStore((s) => s.fetchIncomingRequests);
  const respondToRequest = useContactStore((s) => s.respondToRequest);

  useEffect(() => {
    fetchIncomingRequests();
  }, [fetchIncomingRequests]);

  return (
    <div className="border-b border-cb-border bg-cb-surface">
      <div className="flex items-center justify-between px-4 py-3 bg-cb-teal text-white">
        <span className="font-medium">Contact Requests</span>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {incomingRequests.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-cb-text-secondary">
          No pending requests
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
            >
              <UserAvatar user={req.requester} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-cb-text-primary text-sm">{req.requester.username}</div>
                <div className="text-xs text-cb-text-secondary truncate">{req.requester.email}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => respondToRequest(req.id, true)}
                  className="p-1.5 rounded-full bg-cb-teal text-white hover:bg-cb-dark transition-colors"
                  title="Accept"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => respondToRequest(req.id, false)}
                  className="p-1.5 rounded-full bg-cb-surface-active text-cb-text-secondary hover:bg-cb-avatar-bg transition-colors"
                  title="Reject"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
