import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImagePlus, Loader2 } from 'lucide-react';
import { getMediaUrl } from '../../shared/lib/getMediaUrl';

interface Props {
  initialUrl?: string | null;
  onFileSelected?: (file: File) => void;
  isUploading?: boolean;
}

export function CoverUploadField({ initialUrl, onFileSelected, isUploading }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileSelected?.(file);
  }

  const src = preview ?? (initialUrl ? getMediaUrl(initialUrl) : null);

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
        {t('rooms.cover', 'Обкладинка')}
      </label>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="relative w-full aspect-[16/7] rounded-xl overflow-hidden bg-neutral-100 border border-dashed border-neutral-200 hover:border-accent-500/60 transition group"
      >
        {src ? (
          <>
            <img src={src} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold">
                <Camera size={14} />
                {t('rooms.changeCover', 'Змінити обкладинку')}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-neutral-400">
            <ImagePlus size={28} />
            <span className="text-xs font-medium">
              {t('rooms.addCover', 'Додати обкладинку')}
            </span>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={22} className="text-white animate-spin" />
          </div>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
