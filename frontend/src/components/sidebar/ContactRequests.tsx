import { useEffect } from 'react';
import { useContactStore } from '../../store/contactStore';
import { X, UserCheck, UserX } from 'lucide-react';

export function ContactRequests({ onClose }: { onClose: () => void }) {
  const incomingRequests = useContactStore((s) => s.incomingRequests);
  const fetchIncomingRequests = useContactStore((s) => s.fetchIncomingRequests);
  const respondToRequest = useContactStore((s) => s.respondToRequest);

  useEffect(() => {
    fetchIncomingRequests();
  }, [fetchIncomingRequests]);

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 bg-whatsapp-teal text-white">
        <span className="font-medium">Contact Requests</span>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {incomingRequests.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          No pending requests
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto">
          {incomingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold shrink-0">
                {req.requester.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{req.requester.username}</div>
                <div className="text-xs text-gray-500 truncate">{req.requester.email}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => respondToRequest(req.id, true)}
                  className="p-1.5 rounded-full bg-whatsapp-teal text-white hover:bg-whatsapp-dark transition-colors"
                  title="Accept"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={() => respondToRequest(req.id, false)}
                  className="p-1.5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
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
