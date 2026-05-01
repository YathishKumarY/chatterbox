export function TypingIndicator({ usernames }: { usernames: string[] }) {
  if (usernames.length === 0) return null;

  const text =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : `${usernames.slice(0, -1).join(', ')} and ${usernames[usernames.length - 1]} are typing`;

  return (
    <div className="flex justify-start mb-1 px-1">
      <div className="bg-white rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
        <span className="text-xs text-gray-500 italic">{text}</span>
        <div className="flex gap-0.5">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
