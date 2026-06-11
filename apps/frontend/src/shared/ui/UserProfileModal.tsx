import { useTranslation } from 'react-i18next';
import { UserPlus, UserMinus, UserCheck, LockOpen, ShieldX } from 'lucide-react';
import { Modal } from './Modal';
import { Skeleton } from './Skeleton';
import { useProfile } from '../api/profile.hooks';
import { useAddContact, useRemoveContact } from '../api/contacts.hooks';
import { useBlockUser, useUnblockUser } from '../api/blocks.hooks';
import { relativeTime } from '../lib/relativeTime';
import { getMediaUrl } from '../lib/getMediaUrl';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0]![0]! + p[1]![0]! : name.slice(0, 2)).toUpperCase();
}

interface Props {
  username: string;
  open: boolean;
  onClose: () => void;
}

export function UserProfileModal({ username, open, onClose }: Props) {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile(open ? username : '');
  const add    = useAddContact();
  const remove = useRemoveContact();
  const block  = useBlockUser();
  const unblock = useUnblockUser();
  const busy = add.isPending || remove.isPending || block.isPending || unblock.isPending;

  async function handleBlock() {
    if (!profile) return;
    const reason = prompt(t('profile.blockReason'));
    if (reason === null) return;
    await block.mutateAsync({ userId: profile.id, reason: reason.trim() || undefined });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-2">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      )}

      {profile && (
        <div className="space-y-5">
          {/* Hero */}
          <div className="flex flex-col items-center text-center">
            {/* Ring avatar */}
            <div className="relative rounded-full shrink-0" style={{ width: 80, height: 80 }}>
              {profile.isOnline && (
                <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#2d6ff8,#8eb5ff,#22c55e,#2d6ff8)] animate-[spin_4s_linear_infinite]" />
              )}
              <span
                className="absolute rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center font-semibold text-neutral-600 text-xl"
                style={{ inset: profile.isOnline ? 3 : 0 }}
              >
                {profile.avatarUrl ? (
                  <img src={getMediaUrl(profile.avatarUrl)} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(profile.fullName)
                )}
              </span>
            </div>

            <h2 className="mt-3 font-display text-xl font-bold text-neutral-900 leading-tight">
              {profile.fullName}
            </h2>
            <p className="text-neutral-400 text-sm mt-0.5">@{profile.username}</p>
            <p className="text-xs mt-1.5">
              {profile.isOnline ? (
                <span className="text-success-700 font-medium">{t('profile.online')}</span>
              ) : (
                <span className="text-neutral-400">
                  {t('profile.wasOnline', { time: relativeTime(profile.lastSeenAt) })}
                </span>
              )}
            </p>
          </div>

          {profile.bio && (
            <p className="text-sm text-neutral-500 text-center italic leading-relaxed">
              "{profile.bio}"
            </p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 bg-neutral-50 rounded-2xl p-3">
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900">{profile.stats.sharedRooms}</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {t('profile.stats.shared', 'Спільних кімнат')}
              </p>
            </div>
            <div className="text-center border-l border-neutral-200">
              <p className="text-lg font-bold text-neutral-900">{profile.stats.contacts}</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {t('profile.stats.contacts', 'Контактів')}
              </p>
            </div>
          </div>

          {/* Actions */}
          {!profile.isSelf && (
            <div className="flex gap-2">
              {profile.isBlockedByMe ? (
                <button
                  onClick={() => unblock.mutate(profile.id)}
                  disabled={unblock.isPending}
                  className="flex-1 flex items-center justify-center gap-2 border border-yellow-300/60 bg-yellow-50/50 text-yellow-600 font-semibold py-2.5 rounded-2xl text-sm transition disabled:opacity-50"
                >
                  <LockOpen size={15} />
                  {t('profile.unblock', 'Розблокувати')}
                </button>
              ) : (
                <>
                  {profile.isContact ? (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-white/60 border border-white/70 text-neutral-600 font-medium py-2.5 rounded-2xl text-sm">
                      <UserCheck size={15} />
                      <span>{profile.isMutual ? t('profile.mutualContacts') : t('profile.inContacts')}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => add.mutate(profile.id)}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-2 btn-glass-blue py-2.5 rounded-2xl text-sm disabled:opacity-50"
                    >
                      <UserPlus size={15} />
                      {add.isPending ? t('profile.adding') : t('profile.addToContacts')}
                    </button>
                  )}

                  {profile.isContact && (
                    <button
                      onClick={() => remove.mutate(profile.id)}
                      disabled={busy}
                      title={t('common.remove')}
                      className="w-11 h-11 flex items-center justify-center rounded-2xl bg-danger-500/10 border border-danger-500/25 text-danger-600 hover:bg-danger-500/18 transition disabled:opacity-50 shrink-0"
                    >
                      <UserMinus size={15} />
                    </button>
                  )}

                  <button
                    onClick={handleBlock}
                    disabled={busy}
                    title={t('profile.block')}
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/40 border border-white/60 text-neutral-500 hover:bg-danger-500/10 hover:text-danger-600 hover:border-danger-500/25 transition disabled:opacity-50 shrink-0"
                  >
                    <ShieldX size={15} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
