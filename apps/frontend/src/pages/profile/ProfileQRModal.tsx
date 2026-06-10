import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { Modal } from '../../shared/ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  username: string;
}

const PROFILE_BASE_URL = 'https://and-u.vercel.app/u';

export function ProfileQRModal({ open, onClose, username }: Props) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [copied, setCopied] = useState(false);
  const url = `${PROFILE_BASE_URL}/${username}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — clipboard може бути недоступний на не-HTTPS dev
    }
  }

  async function handleShare() {
    const share = navigator.share?.bind(navigator);
    if (share) {
      try {
        await share({ title: `@${username}`, text: t('qr.shareText', 'Профіль на &u'), url });
        return;
      } catch {
        // користувач відмінив share — fallback на copy
      }
    }
    handleCopy();
  }

  function handleSavePng() {
    const svg = svgRef.current;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 4; // високий DPI для збереження
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `andu-${username}.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
    };
    img.src = svgUrl;
  }

  return (
    <Modal open={open} onClose={onClose} title={t('qr.title', 'QR код профілю')} size="sm">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 glass-card">
          <QRCodeSVG
            value={url}
            size={220}
            level="M"
            marginSize={0}
            ref={svgRef}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 text-xs text-neutral-500 hover:text-neutral-900 px-3 py-2 rounded-lg hover:bg-neutral-50 transition"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span className="font-mono truncate">{url}</span>
        </button>

        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 btn-glass-blue font-semibold py-2.5 rounded-xl transition text-sm"
          >
            <Share2 size={15} />
            {t('qr.share', 'Поділитись')}
          </button>
          <button
            onClick={handleSavePng}
            className="flex items-center justify-center gap-1.5 border border-neutral-100 text-neutral-700 hover:bg-neutral-50 font-semibold py-2.5 rounded-xl transition text-sm"
          >
            <Download size={15} />
            {t('qr.savePng', 'Зберегти PNG')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
