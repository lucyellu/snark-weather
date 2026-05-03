import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Droplets, Wind, Sun, Eye, RefreshCw, AlertCircle, Palette, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGetCurrentWeather, useGetWeatherForecast, useGeocodeCity, useGenerateSnark } from '@workspace/api-client-react';
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
  /* 4 ── Mint — hsl(144°) */
  {
    id: 'mint',
    label: 'Mint',
    bg: 'hsl(144,100%,80%)',
    swatch: 'hsl(144,100%,80%)',
    vars: {
      '--th-text':          'hsl(144,100%,18%)',
      '--th-muted':         'hsla(144,100%,18%,0.62)',
      '--th-faint':         'hsla(144,100%,18%,0.36)',
      '--th-ultra':         'hsla(144,100%,18%,0.20)',
      '--th-card':          'hsla(144,100%,18%,0.07)',
      '--th-card2':         'hsla(144,100%,18%,0.13)',
      '--th-border':        'hsla(144,100%,18%,0.18)',
      '--th-border-faint':  'hsla(144,100%,18%,0.09)',
      '--th-spinner':       'hsl(144,100%,18%)',
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
  /* 6 ── Lavender — hsl(270°) */
  {
    id: 'lavender',
    label: 'Lavender',
    bg: 'hsl(270,100%,80%)',
    swatch: 'hsl(270,100%,80%)',
    vars: {
      '--th-text':          'hsl(270,100%,20%)',
      '--th-muted':         'hsla(270,100%,20%,0.62)',
      '--th-faint':         'hsla(270,100%,20%,0.36)',
      '--th-ultra':         'hsla(270,100%,20%,0.20)',
      '--th-card':          'hsla(270,100%,20%,0.07)',
      '--th-card2':         'hsla(270,100%,20%,0.13)',
      '--th-border':        'hsla(270,100%,20%,0.18)',
      '--th-border-faint':  'hsla(270,100%,20%,0.09)',
      '--th-spinner':       'hsl(270,100%,20%)',
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

/* ── App ──────────────────────────────────────────────────── */
export default function App() {
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 49.2827, lon: -123.1207 });
  const [city, setCity] = useState<string>("Vancouver");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [time, setTime] = useState(new Date());
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
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setCity("My Location"); },
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

  const { refetch: fetchGeocode } = useGeocodeCity(
    { city: searchTerm },
    { query: { enabled: false } }
  );

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    try {
      const result = await fetchGeocode();
      if (result.data) {
        setCoords({ lat: result.data.lat, lon: result.data.lon });
        setCity(result.data.city || searchTerm);
        setSearchOpen(false);
      }
    } catch { /* noop */ }
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
        <header className="flex items-center justify-between z-10 relative mb-2">
          <div className="flex-1">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
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
              </form>
            ) : (
              <button
                onClick={() => { setSearchOpen(true); setSearchTerm(city); }}
                className="flex items-center gap-2 hover:opacity-75 transition-opacity"
              >
                <MapPin className="w-5 h-5" style={{ color: 'var(--th-muted)' }} />
                <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--th-text)' }}>
                  {weatherLoading && !weather ? 'Locating…' : (weather?.city || city)}
                </h1>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemePicker current={themeId} onChange={handleThemeChange} />
            <div className="text-right text-sm font-medium" style={{ color: 'var(--th-muted)' }}>
              <div>{format(time, "h:mm a")}</div>
              <div className="text-xs" style={{ color: 'var(--th-faint)' }}>{format(time, "EEE, MMM d")}</div>
            </div>
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
                          {format(time, "EEEE, MMM d")}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--th-faint)' }}>
                          {format(time, "h:mm a")} · {weather?.conditionLabel}
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
                    <div className="flex gap-4 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: 'none' }}>
                      {forecast.hourly.map((h, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[3.5rem] snap-center">
                          <span className="text-xs font-medium mb-2" style={{ color: 'var(--th-muted)' }}>
                            {format(new Date(h.time), "ha")}
                          </span>
                          <WeatherIcon type={mapWeatherCodeToIcon(h.weatherCode)} size="sm" className="mb-2" />
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
                    </div>
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
