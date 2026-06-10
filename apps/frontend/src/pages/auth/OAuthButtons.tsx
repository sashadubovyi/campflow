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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-neutral-400 uppercase tracking-wider">
        <span className="flex-1 h-px bg-white/60" />
        {t('common.or')}
        <span className="flex-1 h-px bg-white/60" />
      </div>

      <div className="flex flex-col items-center gap-2.5">
        {/* Google — native GSI button if configured, otherwise custom button */}
        {googleClientId ? (
          <div ref={googleBtnRef} className="min-h-[40px] w-full max-w-[320px]" />
        ) : (
          <button
            type="button"
            onClick={() => setError('Google Sign-In is not configured')}
            disabled={busyProvider !== null}
            className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-white/80 border border-neutral-200/70 backdrop-blur-sm hover:bg-white/92 disabled:opacity-60 text-neutral-700 font-semibold py-2.5 rounded-2xl transition text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {context === 'signup'
              ? t('auth.signupWithGoogle', 'Sign up with Google')
              : t('auth.signinWithGoogle', 'Sign in with Google')}
          </button>
        )}

        {appleClientId && (
          <button
            type="button"
            onClick={handleApple}
            disabled={busyProvider !== null}
            className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-neutral-900/85 border border-neutral-800/60 backdrop-blur-sm hover:bg-neutral-900/92 disabled:opacity-60 text-white font-semibold py-2.5 rounded-2xl transition text-sm"
          >
            {busyProvider === 'apple' ? <Loader2 size={16} className="animate-spin" /> : <Apple size={16} />}
            {context === 'signup'
              ? t('auth.signupWithApple', 'Sign up with Apple')
              : t('auth.signinWithApple', 'Sign in with Apple')}
          </button>
        )}

        {/* Facebook — always shown */}
        <button
          type="button"
          onClick={handleFacebook}
          disabled={busyProvider !== null}
          className="w-full max-w-[320px] flex items-center justify-center gap-2 bg-[#1877F2]/85 border border-[#1877F2]/50 backdrop-blur-sm hover:bg-[#1877F2]/92 disabled:opacity-60 text-white font-semibold py-2.5 rounded-2xl transition text-sm"
        >
          {busyProvider === 'facebook' ? <Loader2 size={16} className="animate-spin" /> : <FacebookIcon size={16} />}
          {context === 'signup'
            ? t('auth.signupWithFacebook', 'Sign up with Facebook')
            : t('auth.signinWithFacebook', 'Sign in with Facebook')}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
