import { useState, useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useContactStore } from '../../store/contactStore';
import { X, Search, Check } from 'lucide-react';

interface ContactUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export function CreateGroup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'select' | 'name'>('select');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<ContactUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const contacts = useContactStore((s) => s.contacts);
  const fetchContacts = useContactStore((s) => s.fetchContacts);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filtered = contacts.filter(c =>
    !filter || c.username.toLowerCase().includes(filter.toLowerCase()) || c.email.toLowerCase().includes(filter.toLowerCase())
  );

  const toggleUser = (user: ContactUser) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  };

  const handleCreate = async () => {
    if (selected.length < 2 || !groupName.trim()) return;
    const conversation = await createConversation(
      selected.map((u) => u.id),
      groupName.trim(),
      true,
    );
    setActiveConversation(conversation.id);
    onClose();
  };

  return (
    <div className="border-b border-cb-border bg-cb-surface">
      <div className="flex items-center justify-between px-4 py-3 bg-cb-teal text-white">
        <span className="font-medium">{step === 'select' ? 'Add group members' : 'Group name'}</span>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 'select' && (
        <>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 py-2 bg-cb-surface-hover">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1 bg-cb-light text-cb-dark text-sm px-2 py-1 rounded-full"
                >
                  {u.username}
                  <button onClick={() => toggleUser(u)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2">
            <Search className="w-4 h-4 text-cb-text-muted" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-cb-text-primary placeholder:text-cb-text-muted"
              placeholder="Search contacts..."
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-cb-text-secondary">
                {contacts.length === 0 ? 'No contacts yet. Add contacts first!' : 'No matching contacts'}
              </div>
            ) : (
              filtered.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-cb-surface-hover"
                  >
                    <div className="w-8 h-8 rounded-full bg-cb-avatar-bg flex items-center justify-center text-white text-sm font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm flex-1 text-left text-cb-text-primary">{user.username}</span>
                    {isSelected && <Check className="w-4 h-4 text-cb-teal" />}
                  </button>
                );
              })
            )}
          </div>

          {selected.length >= 2 && (
            <div className="px-4 py-2">
              <button
                onClick={() => setStep('name')}
                className="w-full bg-cb-teal text-white py-2 rounded-lg text-sm hover:bg-cb-dark transition-colors"
              >
                Next ({selected.length} members selected)
              </button>
            </div>
          )}
        </>
      )}

      {step === 'name' && (
        <div className="p-4 space-y-3">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-2 border border-cb-border rounded-lg outline-none focus:ring-2 focus:ring-cb-teal bg-cb-surface text-cb-text-primary placeholder:text-cb-text-muted"
            placeholder="Group name"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!groupName.trim()}
            className="w-full bg-cb-teal text-white py-2 rounded-lg text-sm hover:bg-cb-dark transition-colors disabled:opacity-50"
          >
            Create Group
          </button>
        </div>
      )}
    </div>
  );
}
