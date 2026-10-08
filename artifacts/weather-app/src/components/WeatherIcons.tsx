import React, { useId } from 'react';

const CLOUD_PATH =
  'M 146.5 293 C 65.644 293 0 227.356 0 146.5 C 0 65.644 65.644 0 146.5 0 C 205.641 0 256.643 35.12 279.772 85.624 C 293.416 79.445 308.559 76 324.5 76 C 384.383 76 433 124.617 433 184.5 C 433 244.383 384.383 293 324.5 293 L 146.5 293 Z';

export type WeatherIconType =
  | 'sunny'
  | 'cloudy'
  | 'partly-cloudy'
  | 'rainy'
  | 'thunderstorm'
  | 'snowy'
  | 'foggy'
  | 'windy';

interface WeatherIconProps {
  type: WeatherIconType;
  className?: string;
  /** 'lg' = full animated hero icon; 'sm' = tiny scaled-down version for forecast rows */
  size?: 'lg' | 'sm';
  /** width in px of a 'sm' icon (default 52) */
  px?: number;
}

type CloudVariant = 'default' | 'thunder' | 'snow' | 'dark';

function cloudVariantFor(type: WeatherIconType): CloudVariant {
  if (type === 'thunderstorm' || type === 'rainy') return 'thunder';
  if (type === 'snowy') return 'snow';
  if (type === 'foggy' || type === 'cloudy') return 'dark';
  return 'default';
}

interface IconContentsProps {
  type: WeatherIconType;
  clipId: string;
}

function IconContents({ type, clipId }: IconContentsProps) {
  const variant = cloudVariantFor(type);
  return (
    <>
      {/* Sun — for sunny and partly-cloudy */}
      {(type === 'sunny' || type === 'partly-cloudy') && (
        <div className="cp-icon__sun">
          <div className="cp-icon__sun-lights">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="cp-icon__sun-light" />
            ))}
          </div>
        </div>
      )}

      {/* Lightning bolt */}
      {type === 'thunderstorm' && <div className="cp-icon__thunder" />}

      {/* Glass cloud — clipped to CodePen cloud shape via unique SVG clipPath */}
      <div
        className={`cp-icon__cloud cp-icon__cloud--${variant}`}
        style={{
          clipPath: `url(#${clipId})`,
          WebkitClipPath: `url(#${clipId})`,
        }}
      >
        <div className="cp-icon__cloud-reflect cp-icon__cloud-reflect--1" />
        <div className="cp-icon__cloud-reflect cp-icon__cloud-reflect--2" />
        <svg
          className="cp-icon__cloud-svg"
          xmlns="http://www.w3.org/2000/svg"
          style={{ isolation: 'isolate' } as React.CSSProperties}
          viewBox="0 0 200 500"
          width="50%"
        >
          <clipPath id={clipId}>
            <path d={CLOUD_PATH} fill="currentColor" />
          </clipPath>
        </svg>
      </div>

      {/* Rain drops - drawn in front of the cloud */}
      {(type === 'rainy' || type === 'thunderstorm') && (
        <div className="cp-icon__rain">
          <div className="cp-icon__rain-drops" />
          <div className="cp-icon__rain-drops cp-icon__rain-drops--b" />
        </div>
      )}

      {/* Snow flakes */}
      {type === 'snowy' && (
        <div className="cp-icon__snow">
          <div className="cp-icon__snow-flakes" />
        </div>
      )}

      {/* Off-screen shadow caster */}
      <div className="cp-icon__cloud-shadow" />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   The .cp-icon box is 18rem × 13rem at font-size 15px = 270 × 195px.
   The cloud is centred horizontally in that box, so a scaled-down icon
   gets a container of exactly box × scale; centring the container then
   centres the cloud.
   ───────────────────────────────────────────────────────────── */
const BOX_W = 270; // px
const BOX_H = 195; // px

export function WeatherIcon({ type, className = '', size = 'lg', px }: WeatherIconProps) {
  const rawId = useId();
  const clipId = `cp-${rawId.replace(/:/g, '')}`;

  if (size === 'sm') {
    /* Small icon (forecast rows, calendar cells): scaled to `px` wide, no
       floating animation. overflow-visible so sun rays / halos aren't clipped. */
    const width = px ?? 52;
    const scale = width / BOX_W;
    // keep rain streaks ~1.7px wide and at least ~9px long whatever the scale
    const rainW = 1.7 / (scale * 15);
    const rainH = Math.max(1.3, 9 / (scale * 15));
    return (
      <div
        className={`relative flex-shrink-0 ${className}`}
        style={{ width, height: Math.round(BOX_H * scale), overflow: 'visible' }}
      >
        <div
          className="cp-icon"
          style={{
            fontSize: '15px',
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            animation: 'none',
            overflow: 'visible',
            '--rain-w': `${rainW}rem`,
            '--rain-h': `${rainH}rem`,
          } as React.CSSProperties}
        >
          <IconContents type={type} clipId={clipId} />
        </div>
      </div>
    );
  }

  /* Large hero icon with floating animation */
  return (
    <div className={`cp-icon-wrap ${className}`}>
      <div className="cp-icon" style={{ fontSize: '15px' }}>
        <IconContents type={type} clipId={clipId} />
      </div>
    </div>
  );
}

export function mapWeatherCodeToIcon(code: number): WeatherIconType {
  if (code <= 1) return 'sunny';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'foggy';
  if (code >= 51 && code <= 67) return 'rainy';
  if (code >= 71 && code <= 77) return 'snowy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 85 && code <= 86) return 'snowy';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'cloudy';
}
