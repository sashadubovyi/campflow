import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invitesApi, type CanInviteResult } from '../../shared/api/invites.api';
import { useCreateInvite } from '../../shared/api/invites.hooks';
import { Avatar } from '../../shared/ui/Avatar';
import { UserSearch, Link, CheckCircle, Ampersand } from 'lucide-react';

interface Props {
  roomId: string;
  inviteCode: string;
  iconOnly?: boolean;
}

type Tab = 'username' | 'link';

export function InviteButton({ roomId, inviteCode, iconOnly = false }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('username');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  async function copy(value: string, what: 'code' | 'link') {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard може бути недоступний
    }
  }

  function handleClose() {
    setOpen(false);
    setTab('username');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t('rooms.invite')}
        aria-label={t('rooms.invite')}
        className={
          iconOnly
            ? 'w-full flex items-center justify-center py-2 rounded-xl bg-gemini-active border border-accent-200/40 text-accent-600 hover:bg-gemini-active-hover transition-all duration-200'
            : 'w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gemini-active border border-accent-200/40 text-accent-600 hover:bg-gemini-active-hover transition-all duration-200 shadow-card text-sm font-semibold'
        }
      >
        <Ampersand size={16} />
        {!iconOnly && <span className="text-xs font-semibold">{t('rooms.invite')}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center px-4 z-50"
          onClick={handleClose}
        >
          <div
            className="glass-surface rounded-2xl shadow-2xl w-full max-w-md p-6 font-body"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl font-bold text-neutral-900 mb-1">
              {t('rooms.inviteUsers')}
            </h2>
            <p className="text-sm text-neutral-700 mb-4">{t('invites.shareHint')}</p>

            <div className="flex gap-1 mb-5 bg-neutral-50 p-1 rounded-xl">
              <button
                onClick={() => setTab('username')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition ${
                  tab === 'username'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <UserSearch size={15} />
                {t('invites.byUsername')}
              </button>
              <button
                onClick={() => setTab('link')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition ${
                  tab === 'link'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <Link size={15} />
                {t('invites.byLink')}
              </button>
            </div>

            {tab === 'username' ? (
              <InviteByUsername roomId={roomId} onDone={handleClose} />
            ) : (
              <InviteByLink
                inviteCode={inviteCode}
                inviteLink={inviteLink}
                copied={copied}
                onCopy={copy}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function InviteByUsername({ roomId, onDone }: { roomId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [check, setCheck] = useState<CanInviteResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const create = useCreateInvite();

  useEffect(() => {
    if (!username || username.length < 2) {
      setCheck(null);
      return;
    }
    const handle = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await invitesApi.canInvite(roomId, username.trim());
        setCheck(result);
      } catch {
        setCheck(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [username, roomId]);

  async function handleSend() {
    if (!check?.allowed) return;
    try {
      await create.mutateAsync({
        roomId,
        username: username.trim(),
        message: message.trim() || undefined,
      });
      setSent(true);
      setTimeout(onDone, 1500);
    } catch {
      // помилка через мутацію
    }
  }

  const reasonKey: Record<string, string> = {
    not_found: 'notFound',
    self: 'self',
    already_member: 'alreadyMember',
    already_invited: 'alreadyInvited',
    blocked_by_policy: 'blockedByPolicy',
  };

  if (sent) {
    return (
      <div className="bg-neutral-50 rounded-xl p-6 text-center">
        <CheckCircle size={36} className="text-accent-500 mb-2 mx-auto" />
        <p className="font-semibold text-neutral-900">{t('invites.sent')}</p>
        <p className="text-xs text-neutral-700 mt-1">
          {t('invites.sentHint', { name: check?.target?.fullName ?? '' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          {t('profile.fields.username')}
        </label>
        <div className="flex items-center gap-1">
          <span className="text-neutral-400 font-mono">@</span>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
              setCheck(null);
            }}
            placeholder="ivan_petrenko"
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-100 focus:border-accent-500 outline-none text-sm font-mono"
            autoFocus
          />
        </div>
      </div>

      {checking && <p className="text-xs text-neutral-400 italic">{t('invites.checking')}</p>}

      {check && !checking && (
        <div
          className={`rounded-xl p-3 ${
            check.allowed
              ? 'bg-neutral-50 border border-accent-500/30'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {check.allowed && check.target ? (
            <div className="flex items-center gap-3">
              <Avatar
                fullName={check.target.fullName}
                avatarUrl={check.target.avatarUrl}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {check.target.fullName}
                </p>
                <p className="text-xs text-neutral-400">@{check.target.username}</p>
              </div>
              <span className="text-accent-600 text-xs font-semibold">
                {t('invites.canInvite')}
              </span>
            </div>
          ) : (
            <p className="text-xs text-red-700">
              {t(`invites.reasons.${reasonKey[check.reason ?? ''] ?? 'notFound'}`)}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-1.5">
          {t('invites.messageOptional')}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t('invites.messagePlaceholder')}
          className="w-full px-3 py-2 rounded-lg border border-neutral-100 focus:border-accent-500 outline-none text-sm resize-none"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={!check?.allowed || create.isPending}
        className="w-full bg-brand-gradient hover:bg-brand-gradient-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition text-sm"
      >
        {create.isPending ? t('common.sending') : t('invites.send')}
      </button>
    </div>
  );
}

function InviteByLink({
  inviteCode,
  inviteLink,
  copied,
  onCopy,
  onClose,
}: {
  inviteCode: string;
  inviteLink: string;
  copied: 'code' | 'link' | null;
  onCopy: (value: string, what: 'code' | 'link') => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {t('rooms.inviteCode')}
      </label>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-100 bg-neutral-50 font-mono tracking-widest text-neutral-900 text-center">
          {inviteCode}
        </div>
        <button
          onClick={() => onCopy(inviteCode, 'code')}
          className="px-4 rounded-xl glass-btn text-sm"
        >
          {copied === 'code' ? t('common.copied') : t('common.copy')}
        </button>
      </div>

      <label className="block text-xs font-medium text-neutral-400 mb-1.5">
        {t('invites.linkLabel')}
      </label>
      <div className="flex gap-2 mb-5">
        <div className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-100 bg-neutral-50 text-neutral-700 text-sm truncate">
          {inviteLink}
        </div>
        <button
          onClick={() => onCopy(inviteLink, 'link')}
          className="px-4 rounded-xl glass-btn text-sm"
        >
          {copied === 'link' ? t('common.copied') : t('common.copy')}
        </button>
      </div>

      <button
        onClick={onClose}
        className="w-full bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold py-2.5 rounded-xl transition"
      >
        {t('common.done')}
      </button>
    </>
  );
}
