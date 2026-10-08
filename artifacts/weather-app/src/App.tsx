import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Droplets, Wind, Sun, Eye, RefreshCw, AlertCircle, Palette, Volume2, VolumeX, Settings as SettingsIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGetCurrentWeather, useGetWeatherForecast, useGenerateSnark } from '@workspace/api-client-react';
import { WeatherIcon, mapWeatherCodeToIcon } from './components/WeatherIcons';
import { Skeleton } from './components/ui/skeleton';

/* ─────────────────────────────────────────────────────────────
   Theme system
   Swatches drawn from CodePen vii120/WbGXVLG's animation:
     --light: hsl(H, 100%, 80%)   ← background
     --dark:  hsl(H, 100%, 20%)   ← text / accent
   Default: exact CodePen body palette (#eac6c0, #cd3222)
   ───────────────────────────────────────────────────────────── */
interface AppTheme {
  id: string;
  label: string;
  /** CSS value for the background (solid colour or gradient) */
  bg: string;
  /** Swatch shown in the picker; a mid-representative hex/hsl */
  swatch: string;
  /** CSS variables injected on the wrapper */
  vars: Record<string, string>;
}

const THEMES: AppTheme[] = [
  /* 1 ── Peach (exact CodePen default) */
  {
    id: 'peach',
    label: 'Peach',
    bg: '#eac6c0',
    swatch: '#eac6c0',
    vars: {
      '--th-text':          '#cd3222',
      '--th-muted':         'rgba(160,28,14,0.62)',
      '--th-faint':         'rgba(160,28,14,0.36)',
      '--th-ultra':         'rgba(160,28,14,0.20)',
      '--th-card':          'rgba(205,50,34,0.07)',
      '--th-card2':         'rgba(205,50,34,0.13)',
      '--th-border':        'rgba(205,50,34,0.18)',
      '--th-border-faint':  'rgba(205,50,34,0.09)',
      '--th-spinner':       '#cd3222',
    },
  },
  /* 2 ── Blush — hsl(0°) */
  {
    id: 'blush',
    label: 'Blush',
    bg: 'hsl(0,100%,80%)',
    swatch: 'hsl(0,100%,80%)',
    vars: {
      '--th-text':          'hsl(0,100%,20%)',
      '--th-muted':         'hsla(0,100%,20%,0.62)',
      '--th-faint':         'hsla(0,100%,20%,0.36)',
      '--th-ultra':         'hsla(0,100%,20%,0.20)',
      '--th-card':          'hsla(0,100%,20%,0.07)',
      '--th-card2':         'hsla(0,100%,20%,0.13)',
      '--th-border':        'hsla(0,100%,20%,0.18)',
      '--th-border-faint':  'hsla(0,100%,20%,0.09)',
      '--th-spinner':       'hsl(0,100%,20%)',
    },
  },
  /* 3 ── Tangerine — hsl(36°) */
  {
    id: 'tangerine',
    label: 'Tangerine',
    bg: 'hsl(36,100%,80%)',
    swatch: 'hsl(36,100%,80%)',
    vars: {
      '--th-text':          'hsl(36,100%,20%)',
      '--th-muted':         'hsla(36,100%,20%,0.62)',
      '--th-faint':         'hsla(36,100%,20%,0.36)',
      '--th-ultra':         'hsla(36,100%,20%,0.20)',
      '--th-card':          'hsla(36,100%,20%,0.07)',
      '--th-card2':         'hsla(36,100%,20%,0.13)',
      '--th-border':        'hsla(36,100%,20%,0.18)',
      '--th-border-faint':  'hsla(36,100%,20%,0.09)',
      '--th-spinner':       'hsl(36,100%,20%)',
    },
  },
  /* 4 ── Hunter — deep hunter green, light text */
  {
    id: 'mint',
    label: 'Hunter',
    bg: '#2f4d38',
    swatch: '#355e3b',
    vars: {
      '--th-text':          '#dcebd9',
      '--th-muted':         'rgba(220,235,217,0.72)',
      '--th-faint':         'rgba(220,235,217,0.44)',
      '--th-ultra':         'rgba(220,235,217,0.24)',
      '--th-card':          'rgba(220,235,217,0.07)',
      '--th-card2':         'rgba(220,235,217,0.13)',
      '--th-border':        'rgba(220,235,217,0.20)',
      '--th-border-faint':  'rgba(220,235,217,0.10)',
      '--th-spinner':       '#dcebd9',
    },
  },
  /* 5 ── Sky — hsl(210°) */
  {
    id: 'sky',
    label: 'Sky',
    bg: 'hsl(210,100%,80%)',
    swatch: 'hsl(210,100%,80%)',
    vars: {
      '--th-text':          'hsl(210,100%,20%)',
      '--th-muted':         'hsla(210,100%,20%,0.62)',
      '--th-faint':         'hsla(210,100%,20%,0.36)',
      '--th-ultra':         'hsla(210,100%,20%,0.20)',
      '--th-card':          'hsla(210,100%,20%,0.07)',
      '--th-card2':         'hsla(210,100%,20%,0.13)',
      '--th-border':        'hsla(210,100%,20%,0.18)',
      '--th-border-faint':  'hsla(210,100%,20%,0.09)',
      '--th-spinner':       'hsl(210,100%,20%)',
    },
  },
  /* 6 ── Lilac — soft lilac violet */
  {
    id: 'lavender',
    label: 'Lilac',
    bg: 'hsl(262,58%,85%)',
    swatch: 'hsl(262,58%,85%)',
    vars: {
      '--th-text':          'hsl(262,42%,30%)',
      '--th-muted':         'hsla(262,42%,30%,0.68)',
      '--th-faint':         'hsla(262,42%,30%,0.40)',
      '--th-ultra':         'hsla(262,42%,30%,0.22)',
      '--th-card':          'hsla(262,42%,30%,0.07)',
      '--th-card2':         'hsla(262,42%,30%,0.13)',
      '--th-border':        'hsla(262,42%,30%,0.20)',
      '--th-border-faint':  'hsla(262,42%,30%,0.10)',
      '--th-spinner':       'hsl(262,42%,30%)',
    },
  },
];

function loadThemeId(): string {
  try { return localStorage.getItem('snark-theme') ?? 'peach'; } catch { return 'peach'; }
}
function saveThemeId(id: string) {
  try { localStorage.setItem('snark-theme', id); } catch { /* noop */ }
}

/* ── Theme Picker ─────────────────────────────────────────── */
function ThemePicker({ current, onChange }: { current: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Change background"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors t-faint hover:t-text"
        style={{ color: 'var(--th-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--th-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--th-muted)')}
      >
        <Palette className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 rounded-2xl p-3 flex gap-2 shadow-2xl th-card-border"
            style={{
              background: 'var(--th-card2)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--th-border)',
            }}
          >
            {THEMES.map(t => (
              <button
                key={t.id}
                title={t.label}
                onClick={() => { onChange(t.id); setOpen(false); }}
                className="relative w-7 h-7 rounded-full border-[3px] transition-transform hover:scale-110 focus:outline-none"
                style={{
                  background: t.swatch,
                  borderColor: current === t.id ? 'var(--th-text)' : 'transparent',
                  boxShadow: current === t.id ? '0 0 0 1px var(--th-text)' : 'none',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Timezone helpers ─────────────────────────────────────── */
type PlaceResult = {
  name: string; region: string | null; country: string | null;
  lat: number; lon: number; timezone: string | null; population: number | null;
};

const DEVICE_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function loadTzSetting(): string {
  try { return localStorage.getItem('snark-tz') ?? 'location'; } catch { return 'location'; }
}
function saveTzSetting(v: string) {
  try { localStorage.setItem('snark-tz', v); } catch { /* noop */ }
}

function fmt(d: Date | string, opts: Intl.DateTimeFormatOptions, tz?: string) {
  const date = new Date(d);
  try { return new Intl.DateTimeFormat(undefined, { ...opts, timeZone: tz }).format(date); }
  catch { return new Intl.DateTimeFormat(undefined, opts).format(date); }
}
const fmtTime = (d: Date | string, tz?: string) => fmt(d, { hour: 'numeric', minute: '2-digit' }, tz);
// Always "1PM" style (no leading zero), regardless of the device locale
function fmtHour(d: Date | string, tz?: string) {
  const date = new Date(d);
  let out: string;
  try { out = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true, timeZone: tz }).format(date); }
  catch { out = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(date); }
  return out.replace(/\s/g, '');
}
const fmtDate = (d: Date, tz: string | undefined, long = false) =>
  fmt(d, { weekday: long ? 'long' : 'short', month: 'short', day: 'numeric' }, tz);
function tzAbbrev(d: Date, tz?: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { timeZoneName: 'short', timeZone: tz })
      .formatToParts(d).find(p => p.type === 'timeZoneName')?.value ?? '';
  } catch { return ''; }
}
function allTimeZones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    const list = fn ? fn('timeZone') : [];
    return list.includes(DEVICE_TZ) ? list : [DEVICE_TZ, ...list];
  } catch { return [DEVICE_TZ]; }
}

/* ── Settings ─────────────────────────────────────────────── */
function SettingsPanel({
  tzSetting, onChange, locationTz, now, effectiveTz,
}: {
  tzSetting: string; onChange: (v: string) => void;
  locationTz?: string; now: Date; effectiveTz?: string;
}) {
  const [open, setOpen] = useState(false);
  const zones = React.useMemo(allTimeZones, []);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Settings"
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{ color: 'var(--th-muted)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--th-text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--th-muted)')}
      >
        <SettingsIcon className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-72 rounded-2xl p-4 shadow-2xl"
            style={{ background: 'var(--th-card2)', backdropFilter: 'blur(16px)', border: '1px solid var(--th-border)' }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--th-faint)' }}>
              Timezone
            </div>
            <select
              value={tzSetting}
              onChange={e => onChange(e.target.value)}
              className="w-full h-9 rounded-lg px-2 text-sm outline-none"
              style={{ background: 'var(--th-card)', border: '1px solid var(--th-border)', color: 'var(--th-text)' }}
            >
              <option value="location">Selected location{locationTz ? ` (${locationTz})` : ''}</option>
              <option value="device">This device ({DEVICE_TZ})</option>
              <optgroup label="All timezones">
                {zones.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
              </optgroup>
            </select>
            <div className="mt-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--th-faint)' }}>
              Right now
            </div>
            <div className="text-2xl font-semibold mt-1" style={{ color: 'var(--th-text)' }}>
              {fmtTime(now, effectiveTz)}{' '}
              <span className="text-xs font-medium" style={{ color: 'var(--th-muted)' }}>{tzAbbrev(now, effectiveTz)}</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--th-muted)' }}>
              {fmtDate(now, effectiveTz, true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Horizontal scroller: full-bleed, soft edge fades, arrow buttons ── */
function ScrollStrip({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, children]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' });
  };

  const fade = '2.5rem';
  const mask = `linear-gradient(to right, ${edges.left ? 'transparent' : '#000'} 0, #000 ${fade}, #000 calc(100% - ${fade}), ${edges.right ? 'transparent' : '#000'} 100%)`;

  const arrow = (dir: 1 | -1) => (
    <button
      onClick={() => scrollBy(dir)}
      aria-label={dir === 1 ? 'Scroll forecast right' : 'Scroll forecast left'}
      className="absolute top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-opacity hover:opacity-80"
      style={{
        [dir === 1 ? 'right' : 'left']: '0.5rem',
        background: 'var(--th-card2)',
        border: '1px solid var(--th-border)',
        color: 'var(--th-text)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {dir === 1 ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="relative -mx-4">
      {edges.left && arrow(-1)}
      {edges.right && arrow(1)}
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-4 overflow-x-auto px-4 pb-12 -mb-10 snap-x"
        style={{ scrollbarWidth: 'none', WebkitMaskImage: mask, maskImage: mask }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────── */
export default function App() {
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 49.2827, lon: -123.1207 });
  const [city, setCity] = useState<string>("Vancouver");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [time, setTime] = useState(new Date());
  const [tzSetting, setTzSetting] = useState<string>(loadTzSetting);
  const [placeTz, setPlaceTz] = useState<string | undefined>(undefined);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [themeId, setThemeId] = useState<string>(loadThemeId);
  const [speaking, setSpeaking] = useState(false);
  const [cachedCommentary, setCachedCommentary] = useState<string>(
    () => localStorage.getItem('snark-commentary') ?? ''
  );
  const lastSnarkKey = useRef<string>('');

  const generateSnark = useGenerateSnark();

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  // Sync dark/light mode for shadcn base components
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  function handleThemeChange(id: string) {
    setThemeId(id);
    saveThemeId(id);
  }

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setPlaceTz(undefined); setCity("My Location"); },
      () => { /* keep Vancouver */ },
      { timeout: 5000 }
    );
  }, []);

  const { data: weather, isLoading: weatherLoading, isError: weatherError } = useGetCurrentWeather(
    { lat: coords.lat, lon: coords.lon, city },
    { query: { queryKey: ['weather-current', coords.lat, coords.lon], staleTime: 5 * 60 * 1000, refetchInterval: 5 * 60 * 1000 } }
  );

  const { data: forecast, isLoading: forecastLoading } = useGetWeatherForecast(
    { lat: coords.lat, lon: coords.lon },
    { query: { queryKey: ['weather-forecast', coords.lat, coords.lon], staleTime: 15 * 60 * 1000, refetchInterval: 15 * 60 * 1000 } }
  );

  const locationTz = placeTz ?? (weather as { timezone?: string } | undefined)?.timezone;
  const effectiveTz = tzSetting === 'location' ? locationTz : tzSetting === 'device' ? undefined : tzSetting;

  function handleTzChange(v: string) {
    setTzSetting(v);
    saveTzSetting(v);
  }

  // Debounced place search so the user can pick the right "Vancouver"
  useEffect(() => {
    if (!searchOpen) return;
    const q = searchTerm.trim();
    if (q.length < 2 || q === city) { setSuggestions([]); return; }
    setSearching(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/weather/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const j = (await r.json()) as { results?: PlaceResult[] };
        setSuggestions(j.results ?? []);
      } catch { /* aborted or offline */ }
      setSearching(false);
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [searchTerm, searchOpen, city]);

  function pickPlace(r: PlaceResult) {
    setCoords({ lat: r.lat, lon: r.lon });
    setCity([r.name, r.region].filter(Boolean).join(', '));
    setPlaceTz(r.timezone ?? undefined);
    setSuggestions([]);
    setSearchOpen(false);
  }

  // Stop TTS and persist commentary when it updates
  useEffect(() => {
    if (!generateSnark.data?.commentary) return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setCachedCommentary(generateSnark.data.commentary);
    localStorage.setItem('snark-commentary', generateSnark.data.commentary);
  }, [generateSnark.data?.commentary]);

  // Generate snark once BOTH weather and forecast are loaded
  // Key is based on actual conditions (not timestamp) to survive refetches
  useEffect(() => {
    if (!weather || !forecast) return;
    const key = `${weather.weatherCode}-${Math.round(weather.temperature)}-${weather.city}`;
    if (lastSnarkKey.current === key) return;
    lastSnarkKey.current = key;
    if (weather.city) setCity(weather.city);

    const today = forecast.daily?.[0];
    const tomorrow = forecast.daily?.[1];
    const maxPrecipChance = forecast.hourly?.length
      ? Math.max(...forecast.hourly.slice(0, 12).map(h => h.precipitationProbability))
      : undefined;

    generateSnark.mutate({
      data: {
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        conditionLabel: weather.conditionLabel,
        city: weather.city || city,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        uvIndex: weather.uvIndex,
        isDay: weather.isDay,
        precipitation: weather.precipitation,
        dailyHigh: today?.tempMax,
        dailyLow: today?.tempMin,
        precipitationChance: maxPrecipChance,
        tomorrowCondition: tomorrow?.conditionLabel,
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.weatherCode, weather?.temperature, weather?.city, forecast?.daily?.[0]?.tempMax]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions[0]) pickPlace(suggestions[0]);
  };

  const handleRefreshSnark = () => {
    if (!weather) return;
    const today = forecast?.daily?.[0];
    const tomorrow = forecast?.daily?.[1];
    const maxPrecipChance = forecast?.hourly?.length
      ? Math.max(...forecast.hourly.slice(0, 12).map(h => h.precipitationProbability))
      : undefined;
    generateSnark.mutate({
      data: {
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        conditionLabel: weather.conditionLabel,
        city: weather.city || city,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        uvIndex: weather.uvIndex,
        isDay: weather.isDay,
        precipitation: weather.precipitation,
        dailyHigh: today?.tempMax,
        dailyLow: today?.tempMin,
        precipitationChance: maxPrecipChance,
        tomorrowCondition: tomorrow?.conditionLabel,
      }
    });
  };

  const handleSpeak = () => {
    const text = generateSnark.data?.commentary || cachedCommentary;
    if (!text) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 0.88;
    utterance.lang = 'en-CA';
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const iconType = weather ? mapWeatherCodeToIcon(weather.weatherCode) : 'cloudy';

  return (
    <div
      className="min-h-[100dvh] w-full font-sans overflow-x-hidden transition-[background-color] duration-700 ease-in-out"
      style={{ background: theme.bg, color: theme.vars['--th-text'], ...theme.vars as React.CSSProperties }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col min-h-[100dvh]">

        {/* ── Header ── */}
        <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 z-10 relative mb-2">
          <div className="min-w-0">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="relative flex items-center gap-2">
                <input
                  autoFocus
                  placeholder="Search city…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-48 rounded-lg px-3 text-sm font-medium outline-none"
                  style={{
                    background: 'var(--th-card2)',
                    border: '1px solid var(--th-border)',
                    color: 'var(--th-text)',
                  }}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
                {(suggestions.length > 0 || (searching && searchTerm.trim().length >= 2)) && (
                  <ul
                    className="absolute left-0 top-12 z-50 w-80 max-w-[85vw] rounded-xl p-1 shadow-2xl"
                    style={{ background: 'var(--th-card2)', backdropFilter: 'blur(16px)', border: '1px solid var(--th-border)' }}
                  >
                    {suggestions.length === 0 && (
                      <li className="px-3 py-2 text-xs" style={{ color: 'var(--th-muted)' }}>Searching…</li>
                    )}
                    {suggestions.map((r, i) => (
                      <li key={`${r.lat}-${r.lon}-${i}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); pickPlace(r); }}
                          className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3 hover:opacity-80"
                          style={{ color: 'var(--th-text)' }}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold truncate">{r.name}</span>
                            <span className="block text-xs truncate" style={{ color: 'var(--th-muted)' }}>
                              {[r.region, r.country].filter(Boolean).join(', ')}
                            </span>
                          </span>
                          {r.timezone && (
                            <span className="text-right text-xs shrink-0" style={{ color: 'var(--th-muted)' }}>
                              <span className="block font-medium">{fmtTime(time, r.timezone)}</span>
                              <span className="block" style={{ color: 'var(--th-faint)' }}>{tzAbbrev(time, r.timezone)}</span>
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            ) : (
              <button
                onClick={() => { setSearchOpen(true); setSearchTerm(city); }}
                className="flex items-center gap-2 max-w-full hover:opacity-75 transition-opacity"
              >
                <MapPin className="w-5 h-5" style={{ color: 'var(--th-muted)' }} />
                <h1 className="text-xl font-semibold tracking-tight truncate" style={{ color: 'var(--th-text)' }}>
                  {weatherLoading && !weather ? 'Locating…' : (weather?.city || city)}
                </h1>
              </button>
            )}
          </div>

          {/* Centre: date with time underneath (timezone lives in Settings) */}
          <div className="text-center leading-tight">
            <div className="text-sm font-semibold" style={{ color: 'var(--th-text)' }}>{fmtDate(time, effectiveTz)}</div>
            <div className="text-xs font-medium" style={{ color: 'var(--th-muted)' }}>{fmtTime(time, effectiveTz)}</div>
          </div>

          <div className="flex items-center justify-end gap-1">
            <ThemePicker current={themeId} onChange={handleThemeChange} />
            <SettingsPanel tzSetting={tzSetting} onChange={handleTzChange} locationTz={locationTz} now={time} effectiveTz={effectiveTz} />
          </div>
        </header>

        {/* ── Loading ── */}
        {weatherLoading && !weather ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 mt-12">
            <div className="w-40 h-40 rounded-full animate-pulse" style={{ background: 'var(--th-card2)' }} />
            <div className="w-32 h-20 rounded-xl animate-pulse" style={{ background: 'var(--th-card2)' }} />
            <div className="w-64 h-32 rounded-xl animate-pulse" style={{ background: 'var(--th-card2)' }} />
          </div>

        /* ── Error ── */
        ) : weatherError ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 mt-12" style={{ color: 'var(--th-text)' }}>
            <AlertCircle className="w-16 h-16 opacity-50" />
            <p className="font-medium">Failed to load weather data. Are you offline or just cursed?</p>
          </div>

        /* ── Weather ── */
        ) : weather ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={weather.updatedAt}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col mt-6"
            >
              {/* Hero */}
              <div className="flex flex-col items-center mb-8">
                <WeatherIcon type={iconType} size="lg" className="mb-4" />

                <div className="flex items-start leading-none">
                  <span
                    className="text-9xl font-black tracking-tighter"
                    style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', color: 'var(--th-text)' }}
                  >
                    {Math.round(weather.temperature)}
                  </span>
                  <span className="text-4xl font-bold mt-3" style={{ color: 'var(--th-muted)' }}>°</span>
                </div>

                <div
                  className="text-xl font-semibold tracking-wide mt-3 capitalize"
                  style={{ fontFamily: "'Fraunces', serif", color: 'var(--th-text)' }}
                >
                  {weather.conditionLabel}
                </div>
                <div className="font-medium mt-1 text-sm" style={{ color: 'var(--th-muted)' }}>
                  Feels like {Math.round(weather.feelsLike)}°
                </div>
              </div>

              {/* Snark card */}
              <div className="relative mb-8 w-full max-w-md mx-auto">
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 z-[-1]"
                  style={{
                    background: 'var(--th-card)',
                    borderTop: '1px solid var(--th-border)',
                    borderLeft: '1px solid var(--th-border)',
                  }}
                />
                <div
                  className="rounded-2xl overflow-hidden relative shadow-sm"
                  style={{
                    background: 'var(--th-card)',
                    border: '1px solid var(--th-border)',
                  }}
                >
                  {/* shimmer line */}
                  <div
                    className="absolute top-0 left-0 w-full h-px"
                    style={{ background: 'linear-gradient(to right, transparent, var(--th-border), transparent)' }}
                  />
                  <div className="p-5 pt-5 pb-5">
                    {/* Card header: date/time + action buttons */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--th-muted)' }}>
                          {fmtDate(time, effectiveTz, true)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--th-faint)' }}>
                          {fmtTime(time, effectiveTz)} · {weather?.conditionLabel}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Speak / Stop */}
                        <button
                          onClick={handleSpeak}
                          disabled={generateSnark.isPending && !cachedCommentary}
                          title={speaking ? "Stop" : "Listen to daily briefing"}
                          className="h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                          style={{ color: speaking ? 'var(--th-text)' : 'var(--th-faint)', background: speaking ? 'var(--th-card2)' : 'transparent' }}
                          onMouseEnter={e => { if (!speaking) e.currentTarget.style.color = 'var(--th-text)'; }}
                          onMouseLeave={e => { if (!speaking) e.currentTarget.style.color = 'var(--th-faint)'; }}
                        >
                          {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        {/* Refresh */}
                        <button
                          onClick={handleRefreshSnark}
                          disabled={generateSnark.isPending}
                          title="New briefing"
                          className="h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
                          style={{ color: 'var(--th-faint)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--th-text)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--th-faint)')}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${generateSnark.isPending ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Commentary */}
                    {generateSnark.isPending && !cachedCommentary ? (
                      <div className="space-y-2">
                        {[1, 0.8, 0.9].map((w, i) => (
                          <div
                            key={i}
                            className="h-4 rounded animate-pulse"
                            style={{ width: `${w * 100}%`, background: 'var(--th-card2)' }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--th-text)', opacity: generateSnark.isPending ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                        {generateSnark.data?.commentary || cachedCommentary || "I have no words for how mediocre this weather is."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                {[
                  { icon: <Droplets className="w-5 h-5" />, label: 'Humidity', value: `${weather.humidity}%` },
                  { icon: <Wind className="w-5 h-5" />,     label: 'Wind',     value: `${Math.round(weather.windSpeed)} km/h` },
                  { icon: <Sun className="w-5 h-5" />,      label: 'UV Index', value: String(weather.uvIndex) },
                  { icon: <Eye className="w-5 h-5" />,       label: 'Vis',      value: `${weather.visibility} km` },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 flex flex-col items-center justify-center gap-1"
                    style={{ background: 'var(--th-card)', border: '1px solid var(--th-border)' }}
                  >
                    <span style={{ color: 'var(--th-muted)' }}>{icon}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--th-faint)' }}>{label}</span>
                    <span className="text-base font-bold" style={{ color: 'var(--th-text)' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Forecast */}
              {forecastLoading ? (
                <div className="space-y-6">
                  {[132, 264].map(h => (
                    <div key={h} className="rounded-xl animate-pulse" style={{ height: h, background: 'var(--th-card2)' }} />
                  ))}
                </div>
              ) : forecast ? (
                <div className="space-y-4 pb-12">

                  {/* Hourly */}
                  <div
                    className="rounded-2xl p-4 overflow-hidden"
                    style={{ background: 'var(--th-card)', border: '1px solid var(--th-border)' }}
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 px-1" style={{ color: 'var(--th-faint)' }}>
                      Hourly Forecast
                    </h3>
                    <ScrollStrip>
                      {forecast.hourly.map((h, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[3.5rem] snap-center">
                          <span className="text-xs font-medium mb-2" style={{ color: 'var(--th-muted)' }}>
                            {fmtHour(h.time, effectiveTz)}
                          </span>
                          <WeatherIcon type={mapWeatherCodeToIcon(h.weatherCode)} size="sm" className="mb-6" />
                          <span className="text-sm font-bold" style={{ color: 'var(--th-text)' }}>
                            {Math.round(h.temperature)}°
                          </span>
                          {h.precipitationProbability > 0 && (
                            <span className="text-[9px] font-bold mt-0.5" style={{ color: 'var(--th-muted)' }}>
                              {h.precipitationProbability}%
                            </span>
                          )}
                        </div>
                      ))}
                    </ScrollStrip>
                  </div>

                  {/* 7-Day */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--th-card)', border: '1px solid var(--th-border)' }}
                  >
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4 px-1" style={{ color: 'var(--th-faint)' }}>
                      7-Day Forecast
                    </h3>
                    <div className="space-y-1">
                      {forecast.daily.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2 py-2 rounded-lg transition-colors"
                          style={{ borderBottom: i < forecast.daily.length - 1 ? '1px solid var(--th-border-faint)' : 'none' }}
                        >
                          <span className="w-16 text-sm font-semibold" style={{ color: 'var(--th-text)' }}>
                            {i === 0 ? 'Today' : d.dayLabel}
                          </span>
                          <div className="flex-1 flex justify-center">
                            <WeatherIcon type={mapWeatherCodeToIcon(d.weatherCode)} size="sm" />
                          </div>
                          <div className="flex items-center gap-2 w-28 justify-end font-semibold text-sm">
                            <span style={{ color: 'var(--th-faint)' }}>{Math.round(d.tempMin)}°</span>
                            <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: 'var(--th-card2)' }}>
                              <div className="h-full rounded-full" style={{ width: '100%', background: 'linear-gradient(to right, var(--th-muted), var(--th-text))' }} />
                            </div>
                            <span style={{ color: 'var(--th-text)' }}>{Math.round(d.tempMax)}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  );
}
