import React, { useState, useRef } from 'react';
import { adminApi } from '../services/api';

interface FileUploadInputProps {
  label: string;
  value: string;
  onChange: (uploadedUrl: string) => void;
  folder?: string;
  helperText?: string;
  accept?: string;
  allowIconFallback?: boolean;
}

export const isImageSource = (val?: string | null): boolean => {
  if (!val) return false;
  return (
    val.startsWith('data:image') ||
    val.startsWith('/uploads/') ||
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('blob:')
  );
};

export const BadgeOrImagePreview: React.FC<{
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackText?: string;
}> = ({ src, alt = 'Badge', className = 'w-10 h-10', fallbackText = '🏅' }) => {
  if (isImageSource(src)) {
    return (
      <img
        src={src!}
        alt={alt}
        className={`${className} object-cover rounded-xl border border-zinc-700/80`}
      />
    );
  }
  return (
    <span className={`${className} inline-flex items-center justify-center select-none`}>
      {src || fallbackText}
    </span>
  );
};

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label,
  value,
  onChange,
  folder = 'boru_storage',
  helperText = 'Formatos aceitos: PNG, JPG, WEBP ou SVG (Upload Local / Storage)',
  accept = 'image/*',
}) => {
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErro('O arquivo deve ter no máximo 8MB.');
      return;
    }

    setErro('');
    setUploading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = String(reader.result || '');
      try {
        const res = await adminApi.uploadFile({
          fileName: file.name,
          mimeType: file.type || 'image/png',
          base64Data,
          folder,
        });
        onChange(res.data.url || base64Data);
      } catch {
        // Fallback seguro usando o DataURI processado localmente
        onChange(base64Data);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setErro('Erro ao ler arquivo do dispositivo.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-zinc-300">{label}</label>
      <div className="flex items-center gap-3 bg-[#121215] border border-zinc-800 rounded-xl p-2.5">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 text-xl">
          {isImageSource(value) ? (
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span>{value || '📷'}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>📁</span>
              <span>{uploading ? 'Enviando para o Storage...' : 'Escolher Arquivo Local'}</span>
            </button>

            {isImageSource(value) && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                ✓ Imagem Carregada
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">
            {fileName ? `Arquivo: ${fileName}` : helperText}
          </p>
          {erro && <p className="text-[10px] text-red-400 font-bold mt-0.5">{erro}</p>}
        </div>
      </div>
    </div>
  );
};
