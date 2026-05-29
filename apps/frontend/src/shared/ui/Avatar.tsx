interface AvatarProps {
  fullName: string;
  avatarUrl?: string | null;
  size?: number;
  isOnline?: boolean;
  showStatus?: boolean;
}

const COLORS = ['bg-forest-500', 'bg-ember-500', 'bg-forest-700', 'bg-ember-400', 'bg-forest-600'];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length]!;
}

export function Avatar({
  fullName,
  avatarUrl,
  size = 36,
  isOnline,
  showStatus = false,
}: AvatarProps) {
  // Обводка та яскравість: якщо showStatus вимкнено — нейтральний вигляд
  const ringClass = showStatus
    ? isOnline
      ? 'ring-2 ring-forest-500'
      : 'ring-2 ring-forest-100'
    : '';

  const opacityClass = showStatus && !isOnline ? 'opacity-60' : 'opacity-100';

  const wrapperStyle = { width: size, height: size };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={`rounded-full object-cover shrink-0 transition ${ringClass} ${opacityClass}`}
        style={wrapperStyle}
      />
    );
  }

  return (
    <div
      className={`${colorFor(fullName)} rounded-full flex items-center justify-center text-white font-semibold shrink-0 transition ${ringClass} ${opacityClass}`}
      style={{ ...wrapperStyle, fontSize: size * 0.4 }}
    >
      {initials(fullName)}
    </div>
  );
}
