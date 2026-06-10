import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Apple, Loader2 } from 'lucide-react';

// Lucide-react 1.x ще не має Facebook-іконки — інлайнимо.
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.25 0-1.63.77-1.63 1.57V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
import { useAuth } from '../../shared/store/useAuth';

// Lazy завантажуємо Google GSI скрипт лише раз для всієї сторінки.
function loadGoogleGsi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('gsi-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GSI failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.id = 'gsi-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('GSI failed to load'));
    document.head.appendChild(s);
  });
}

function loadAppleSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.AppleID?.auth) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('apple-sdk') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Apple SDK failed to load')));
      return;
    }
    const s = document.createElement('script');
    s.id = 'apple-sdk';
    s.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Apple SDK failed to load'));
    document.head.appendChild(s);
  });
}

function loadFbSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.FB) return Promise.resolve();
  return new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, version: 'v18.0', cookie: true, xfbml: false });
      resolve();
    };
    const existing = document.getElementById('facebook-jssdk') as HTMLScriptElement | null;
    if (existing) return;
    const s = document.createElement('script');
    s.id = 'facebook-jssdk';
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    s.async = true;
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.onerror = () => reject(new Error('Facebook SDK failed to load'));
    document.head.appendChild(s);
  });
}

interface Props {
  context?: 'signin' | 'signup';
}

export function OAuthButtons({ context = 'signin' }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithApple, loginWithFacebook } = useAuth();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<'google' | 'apple' | 'facebook' | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;
  const appleRedirect = import.meta.env.VITE_APPLE_REDIRECT_URI;
  const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;

  // Google: ініціалізуємо GSI і рендеримо нативну кнопку. Якщо CLIENT_ID
  // не задано — нічого не показуємо (dev режим).
  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleGsi();
        if (cancelled || !window.google || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          context: context === 'signup' ? 'signup' : 'signin',
          callback: async (resp: { credential: string }) => {
            if (!resp.credential) return;
            try {
              setBusyProvider('google');
              setError(null);
              await loginWithGoogle(resp.credential);
              navigate(context === 'signup' ? '/onboarding' : '/rooms');
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Sign-in failed';
              setError(msg);
            } finally {
              setBusyProvider(null);
            }
          },
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: context === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'center',
          width: 320,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Google sign-in unavailable');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [googleClientId, context, loginWithGoogle, navigate]);

  // Apple init — викликаємо при кліку, щоб не тягти скрипт раніше часу.
  async function handleApple() {
    if (!appleClientId) {
      setError('Apple Sign-In is not configured');
      return;
    }
    try {
      setBusyProvider('apple');
      setError(null);
      await loadAppleSdk();
      window.AppleID!.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: appleRedirect ?? window.location.origin,
        usePopup: true,
      });
      const result = await window.AppleID!.auth.signIn();
      const fullName = result.user?.name
        ? `${result.user.name.firstName ?? ''} ${result.user.name.lastName ?? ''}`.trim() ||
          undefined
        : undefined;
      await loginWithApple(result.authorization.id_token, fullName);
      navigate(context === 'signup' ? '/onboarding' : '/rooms');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Apple sign-in failed';
      // користувач закрив попап — не показуємо як помилку
      if (!/cancel|popup|closed/i.test(msg)) setError(msg);
    } finally {
      setBusyProvider(null);
    }
  }

  async function handleFacebook() {
    if (!facebookAppId) {
      setError('Facebook Sign-In is not configured');
      return;
    }
    try {
      setBusyProvider('facebook');
      setError(null);
      await loadFbSdk(facebookAppId);
      const auth: { accessToken: string } | null = await new Promise((resolve) => {
        window.FB!.login(
          (resp) => {
            if (resp.status === 'connected' && resp.authResponse) {
              resolve({ accessToken: resp.authResponse.accessToken });
            } else {
              resolve(null);
            }
          },
          { scope: 'public_profile,email' },
        );
      });
      if (!auth) {
        // користувач скасував — мовчки
        return;
      }
      await loginWithFacebook(auth.accessToken);
      navigate(context === 'signup' ? '/onboarding' : '/rooms');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Facebook sign-in failed');
    } finally {
      setBusyProvider(null);
    }
  }

  const showAnything = !!googleClientId || !!appleClientId || !!facebookAppId;
  if (!showAnything) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-neutral-400 uppercase tracking-wider">
        <span className="flex-1 h-px bg-neutral-100" />
        {t('common.or')}
        <span className="flex-1 h-px bg-neutral-100" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        {googleClientId && (
          <div ref={googleBtnRef} className="min-h-[40px] w-full max-w-[320px]" />
        )}

        {appleClientId && (
          <button
            type="button"
            onClick={handleApple}
            disabled={busyProvider !== null}
            className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 disabled:opacity-60 text-white font-semibold py-2.5 rounded-full transition text-sm"
          >
            {busyProvider === 'apple' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Apple size={16} />
            )}
            {context === 'signup'
              ? t('auth.signupWithApple', 'Sign up with Apple')
              : t('auth.signinWithApple', 'Sign in with Apple')}
          </button>
        )}

        {facebookAppId && (
          <button
            type="button"
            onClick={handleFacebook}
            disabled={busyProvider !== null}
            className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-60 text-white font-semibold py-2.5 rounded-full transition text-sm"
          >
            {busyProvider === 'facebook' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FacebookIcon size={16} />
            )}
            {context === 'signup'
              ? t('auth.signupWithFacebook', 'Sign up with Facebook')
              : t('auth.signinWithFacebook', 'Sign in with Facebook')}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
