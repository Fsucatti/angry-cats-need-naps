import { useEffect, useRef, useState } from "react";
import { audio } from "../audio";
import { saveAudioSettings, type AudioSettings } from "../audio/settings";
import { t } from "../i18n";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10v4h3l5 4V6L7 10H4Z" fill="currentColor" />
      {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M16 9c1.5 1.8 1.5 4.2 0 6m2.5-8.5c3 3 3 8 0 11" />}
    </svg>
  );
}

export function AudioControl() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<AudioSettings>(() => audio.getSettings());

  const apply = (next: AudioSettings) => {
    setSettings(next);
    audio.setSettings(next);
    saveAudioSettings(next);
  };

  const label = t(settings.muted ? "audio.unmute" : "audio.mute");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="audio-control" ref={root}>
      <button
        type="button"
        className="audio-button"
        data-testid="audio-button"
        aria-label={t("audio.title")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <SpeakerIcon muted={settings.muted} />
      </button>
      {open && (
        <section className="audio-panel card" aria-label={t("audio.title")}>
          <label>
            {t("audio.sfx")}
            <input
              type="range"
              min="0"
              max="100"
              data-testid="audio-sfx"
              value={Math.round(settings.sfx * 100)}
              onChange={(event) => apply({ ...settings, sfx: Number(event.target.value) / 100 })}
              onPointerUp={() => audio.play("flag")}
            />
          </label>
          <label>
            {t("audio.music")}
            <input
              type="range"
              min="0"
              max="100"
              data-testid="audio-music"
              value={Math.round(settings.music * 100)}
              onChange={(event) => apply({ ...settings, music: Number(event.target.value) / 100 })}
            />
          </label>
          <button
            type="button"
            className="btn secondary"
            data-testid="audio-mute"
            aria-pressed={settings.muted}
            onClick={() => apply({ ...settings, muted: !settings.muted })}
          >
            {label}
          </button>
        </section>
      )}
    </div>
  );
}
