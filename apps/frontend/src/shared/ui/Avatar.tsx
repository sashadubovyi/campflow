import { getMediaUrl } from '../lib/getMediaUrl';

interface AvatarProps {
  fullName: string;
  avatarUrl?: string | null;
  size?: number;
  isOnline?: boolean;
  showStatus?: boolean;
}

const COLORS = [
  'bg-accent-500', // синій #2D6FF8
  'bg-violet-500', // фіолетовий
  'bg-teal-500', // бірюзовий
  'bg-rose-500', // рожевий
  'bg-amber-500', // жовтогарячий
];

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
  const ringClass = showStatus
    ? isOnline
      ? 'ring-2 ring-accent-500'
      : 'ring-2 ring-neutral-200'
    : '';

  const opacityClass = showStatus && !isOnline ? 'opacity-60' : 'opacity-100';

  const wrapperStyle = { width: size, height: size };

  if (avatarUrl) {
    return (
      <img
        src={getMediaUrl(avatarUrl)}
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
