interface AvatarUser {
  username: string;
  avatarUrl?: string | null;
  avatarData?: string | null;
}

const sizes = {
  xs: 'w-8 h-8 text-sm',
  sm: 'w-10 h-10 text-base',
  md: 'w-12 h-12 text-lg',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

export function UserAvatar({ user, size = 'sm', className = '' }: { user: AvatarUser; size?: keyof typeof sizes; className?: string }) {
  const src = user.avatarData || user.avatarUrl;

  if (src) {
    return (
      <img
        src={src}
        alt={user.username}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div className={`${sizes[size]} rounded-full bg-cb-avatar-bg flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {user.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}
