import { useState, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { UserAvatar } from '../common/UserAvatar';
import { ImageCropModal } from '../common/ImageCropModal';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import {
  X, Camera, Pencil, Check, Keyboard, HelpCircle, Mail, Shield, LogOut,
  Sun, Moon, ChevronRight, MessageCircle, ExternalLink,
} from 'lucide-react';

export function Settings({ onClose }: { onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme } = useThemeStore();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    if (!newName.trim() || newName === user?.username) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ username: newName.trim() });
      setEditingName(false);
    } catch {
      // revert
    }
    setSaving(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropSave = async (croppedBase64: string) => {
    await updateProfile({ avatarData: croppedBase64 });
    setCropImage(null);
  };

  if (!user) return null;

  if (showShortcuts) {
    return <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />;
  }

  return (
    <div className="absolute inset-0 bg-cb-surface z-40 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-cb-panel border-b border-cb-border">
        <button onClick={onClose} className="p-1 rounded-full hover:bg-cb-surface-active">
          <X className="w-5 h-5 text-cb-text-secondary" />
        </button>
        <h3 className="font-medium text-cb-text-primary">Settings</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-6 px-4 border-b border-cb-border">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <UserAvatar user={user} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-cb-input-bg text-cb-text-primary px-3 py-1 rounded-lg text-sm outline-none border border-cb-border focus:border-cb-teal"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button onClick={handleSaveName} disabled={saving} className="p-1 rounded-full hover:bg-cb-surface-active">
                  <Check className="w-4 h-4 text-cb-teal" />
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium text-cb-text-primary">{user.username}</span>
                <button onClick={() => { setNewName(user.username); setEditingName(true); }} className="p-1 rounded-full hover:bg-cb-surface-active">
                  <Pencil className="w-3.5 h-3.5 text-cb-text-muted" />
                </button>
              </>
            )}
          </div>
          <span className="text-xs text-cb-text-muted mt-0.5">{user.email}</span>
        </div>

        <div className="py-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-cb-text-secondary" /> : <Moon className="w-5 h-5 text-cb-text-secondary" />}
            <span className="flex-1 text-left text-sm text-cb-text-primary">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>

          <button
            onClick={() => setShowShortcuts(true)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
          >
            <Keyboard className="w-5 h-5 text-cb-text-secondary" />
            <span className="flex-1 text-left text-sm text-cb-text-primary">Keyboard shortcuts</span>
            <ChevronRight className="w-4 h-4 text-cb-text-muted" />
          </button>
        </div>

        <div className="border-t border-cb-border py-2">
          <button
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
          >
            <Shield className="w-5 h-5 text-cb-text-secondary" />
            <span className="flex-1 text-left text-sm text-cb-text-primary">Privacy Policy</span>
            <ChevronRight className={`w-4 h-4 text-cb-text-muted transition-transform ${showPrivacy ? 'rotate-90' : ''}`} />
          </button>
          {showPrivacy && (
            <div className="px-4 py-3 mx-4 mb-2 rounded-lg bg-cb-surface-hover text-xs text-cb-text-secondary leading-relaxed">
              ChatterBox is a demo messaging application. Your messages and profile data are stored securely.
              We do not sell or share your personal information with third parties.
              Profile photos are stored as resized images in our database.
              You can delete your account and data at any time by contacting us.
            </div>
          )}

          <a
            href="mailto:support@chatterbox.app"
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
          >
            <Mail className="w-5 h-5 text-cb-text-secondary" />
            <span className="flex-1 text-left text-sm text-cb-text-primary">Contact Us</span>
            <ExternalLink className="w-4 h-4 text-cb-text-muted" />
          </a>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
            onClick={() => window.open('https://github.com/YathishKumarY/chatterbox/issues', '_blank')}
          >
            <HelpCircle className="w-5 h-5 text-cb-text-secondary" />
            <span className="flex-1 text-left text-sm text-cb-text-primary">Help & Feedback</span>
            <ExternalLink className="w-4 h-4 text-cb-text-muted" />
          </button>
        </div>

        <div className="border-t border-cb-border py-2">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cb-surface-hover transition-colors"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="flex-1 text-left text-sm text-red-500">Log out</span>
          </button>
        </div>

        <div className="px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-1 text-cb-text-muted">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-xs">ChatterBox v1.0</span>
          </div>
        </div>
      </div>

      {cropImage && (
        <ImageCropModal
          imageSrc={cropImage}
          onCropComplete={handleCropSave}
          onClose={() => setCropImage(null)}
        />
      )}
    </div>
  );
}
