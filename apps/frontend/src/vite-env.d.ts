/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APPLE_CLIENT_ID?: string;
  readonly VITE_APPLE_REDIRECT_URI?: string;
  readonly VITE_FACEBOOK_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Google + Apple OAuth global types
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: Record<string, unknown>) => void;
        renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        prompt: () => void;
      };
    };
  };
  AppleID?: {
    auth: {
      init: (config: Record<string, unknown>) => void;
      signIn: () => Promise<{
        authorization: { id_token: string };
        user?: { name?: { firstName?: string; lastName?: string } };
      }>;
    };
  };
  // Facebook JS SDK
  FB?: {
    init: (config: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }) => void;
    login: (
      callback: (response: {
        status: 'connected' | 'not_authorized' | 'unknown';
        authResponse?: { accessToken: string; userID: string; expiresIn: number };
      }) => void,
      options?: { scope?: string },
    ) => void;
  };
  fbAsyncInit?: () => void;
}

// Декларація для qrcode.react до моменту коли pnpm install підтягне реальні типи
declare module 'qrcode.react' {
  import type { ComponentType } from 'react';
  interface QRCodeProps {
    value: string;
    size?: number;
    bgColor?: string;
    fgColor?: string;
    level?: 'L' | 'M' | 'Q' | 'H';
    includeMargin?: boolean;
    marginSize?: number;
    title?: string;
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate?: boolean;
      x?: number;
      y?: number;
    };
  }
  export const QRCodeSVG: ComponentType<QRCodeProps & { ref?: React.Ref<SVGSVGElement> }>;
  export const QRCodeCanvas: ComponentType<QRCodeProps & { ref?: React.Ref<HTMLCanvasElement> }>;
}
