import React, { useEffect, useRef } from 'react';

export interface GoogleAdSlotProps {
  clientId?: string;
  slotId?: string;
  enabled?: boolean;
  format?: 'auto' | 'horizontal' | 'rectangle' | 'fluid';
  responsive?: boolean;
  showPlaceholder?: boolean;
  label?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const GoogleAdSlot: React.FC<GoogleAdSlotProps> = ({
  clientId = '',
  slotId = '',
  enabled = false,
  format = 'auto',
  responsive = true,
  showPlaceholder = false,
  label = 'Publicidade / Espaço Patrocinado',
  className = '',
}) => {
  const adPushedRef = useRef(false);
  const cleanClientId = clientId.trim();
  const cleanSlotId = slotId.trim();
  const isReady = Boolean(enabled && cleanClientId && cleanSlotId);

  useEffect(() => {
    if (!isReady) return;

    // Injeta o script oficial do Google AdSense apenas 1 vez na página
    const scriptId = 'google-adsense-script-boru';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        cleanClientId
      )}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    if (!adPushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      } catch (_err) {
        // Ignora erro caso adblocker esteja ativo
      }
    }
  }, [isReady, cleanClientId, cleanSlotId]);

  if (!isReady && !showPlaceholder) {
    return null;
  }

  return (
    <div
      className={`w-full max-w-6xl mx-auto my-4 rounded-2xl bg-[#111114]/90 border border-zinc-800/80 px-4 py-3 shadow-lg overflow-hidden print:hidden ${className}`}
    >
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
          {label}
        </span>
        <span>BORÜ ADSENSE SLOT</span>
      </div>

      {isReady ? (
        <div className="min-h-[90px] flex items-center justify-center overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client={cleanClientId}
            data-ad-slot={cleanSlotId}
            data-ad-format={format}
            data-full-width-responsive={responsive ? 'true' : 'false'}
          />
        </div>
      ) : (
        <div className="min-h-[86px] rounded-xl border border-dashed border-zinc-700/80 bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 text-center sm:text-left">
          <div>
            <p className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Espaço Reservado para Google Ads / Patrocinador Master
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Slot responsivo pronto para Google AdSense ({cleanClientId || 'ca-pub-XXXXXXXXXXXXXXXX'} / Slot:{' '}
              {cleanSlotId || 'não definido'}) ou banner direto do anunciante.
            </p>
          </div>
          <a
            href="https://wa.me/556992384491?text=Ol%C3%A1!%20Quero%20anunciar%20minha%20empresa%20no%20site%20do%20CT%20BOR%C3%9C."
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition"
          >
            Anuncie Aqui →
          </a>
        </div>
      )}
    </div>
  );
};
