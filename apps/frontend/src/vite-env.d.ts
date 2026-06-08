/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
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
