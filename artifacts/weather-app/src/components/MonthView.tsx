import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cake, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import { WeatherIcon, mapWeatherCodeToIcon } from './WeatherIcons';

export interface BirthdayEntry {
  name: string;
  firstName: string;
  month: number;
  day: number;
  year: number | null;
  kind: 'friend' | 'collaborator';
}

interface MonthDay {
  date: string;
  weatherCode: number;
  conditionLabel: string;
  tempMax: number;
  tempMin: number;
}

/** Birthdays that fall in `month` (1-12); empty when the Birthday Book isn't reachable. */
export function useBirthdays(month: number) {
  return useQuery({
    queryKey: ['birthdays', month],
    queryFn: async () => {
      try {
        const r = await fetch(`/api/birthdays/month?month=${month}`);
        if (!r.ok) return [] as BirthdayEntry[];
        return ((await r.json()) as { birthdays?: BirthdayEntry[] }).birthdays ?? [];
      } catch {
        return [] as BirthdayEntry[];
      }
    },
    staleTime: 10 * 60 * 1000,
  });
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Calendar month grid with a weather icon (and birthday marker) on each day. */
export function MonthView({
  lat, lon, todayYmd,
}: {
  lat: number; lon: number;
  /** today's date at the selected location, "YYYY-MM-DD" */
  todayYmd: string;
}) {
  const [ty, tm] = todayYmd.split('-').map(Number);
  const [view, setView] = useState({ year: ty, month: tm });
  const [listOpen, setListOpen] = useState(false);

  const weatherQ = useQuery({
    queryKey: ['weather-month', lat, lon, view.year, view.month],
    queryFn: async () => {
      const r = await fetch(`/api/weather/month?lat=${lat}&lon=${lon}&year=${view.year}&month=${view.month}`);
      if (!r.ok) throw new Error('month weather failed');
      return ((await r.json()) as { days: MonthDay[] }).days;
    },
    staleTime: 30 * 60 * 1000,
  });
  const birthdaysQ = useBirthdays(view.month);

  const shift = (delta: number) =>
    setView(v => {
      const m = v.month - 1 + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 };
    });

  const daysInMonth = new Date(Date.UTC(view.year, view.month, 0)).getUTCDate();
  const leading = new Date(Date.UTC(view.year, view.month - 1, 1)).getUTCDay();
  const byDay = new Map<number, MonthDay>();
  weatherQ.data?.forEach(d => byDay.set(Number(d.date.slice(8, 10)), d));
  const birthdaysByDay = new Map<number, BirthdayEntry[]>();
  birthdaysQ.data?.forEach(b => birthdaysByDay.set(b.day, [...(birthdaysByDay.get(b.day) ?? []), b]));

  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(view.year, view.month - 1, 1)));
  const isTodayMonth = view.year === ty && view.month === tm;
  const todayDay = Number(todayYmd.slice(8, 10));
  const navBtn = 'w-7 h-7 rounded-full flex items-center justify-center transition-opacity hover:opacity-70';

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <button className={navBtn} style={{ color: 'var(--th-text)' }} aria-label="Previous month" onClick={() => shift(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          className="text-sm font-semibold hover:opacity-70"
          style={{ color: 'var(--th-text)', fontFamily: "'Fraunces', serif" }}
          title="Back to this month"
          onClick={() => setView({ year: ty, month: tm })}
        >
          {title}
        </button>
        <button className={navBtn} style={{ color: 'var(--th-text)' }} aria-label="Next month" onClick={() => shift(1)}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase tracking-widest pb-1" style={{ color: 'var(--th-faint)' }}>
            {w}
          </div>
        ))}

        {Array.from({ length: leading }).map((_, i) => <div key={`pad-${i}`} />)}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const w = byDay.get(day);
          const bdays = birthdaysByDay.get(day);
          const isToday = isTodayMonth && day === todayDay;
          return (
            <div
              key={day}
              title={[w && `${w.conditionLabel}, ${w.tempMax}° / ${w.tempMin}°`, bdays && bdays.map(b => `${b.name}'s birthday`).join(', ')]
                .filter(Boolean).join(' · ') || undefined}
              className="relative rounded-lg overflow-hidden flex flex-col items-center pt-1 pb-1.5 min-h-[4.6rem]"
              style={{
                background: isToday ? 'var(--th-card2)' : 'var(--th-card)',
                border: `1px solid ${isToday ? 'var(--th-text)' : 'var(--th-border-faint)'}`,
              }}
            >
              <span className="self-start pl-1.5 text-[10px] font-bold leading-none" style={{ color: isToday ? 'var(--th-text)' : 'var(--th-muted)' }}>
                {day}
              </span>
              {bdays && <Cake className="absolute top-1 right-1 w-3 h-3" style={{ color: 'var(--th-text)' }} aria-label="Birthday" />}
              <div className="flex-1 flex items-center justify-center">
                {w ? (
                  <WeatherIcon type={mapWeatherCodeToIcon(w.weatherCode)} size="sm" px={34} />
                ) : (
                  <span className="text-xs" style={{ color: 'var(--th-ultra)' }}>{weatherQ.isLoading ? '' : '–'}</span>
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none" style={{ color: 'var(--th-text)' }}>
                {w ? `${w.tempMax}°` : ' '}
              </span>
            </div>
          );
        })}
      </div>

      {weatherQ.isError && (
        <p className="text-xs mt-3 px-1" style={{ color: 'var(--th-muted)' }}>Couldn't load the weather for this month.</p>
      )}

      {birthdaysQ.data && birthdaysQ.data.length > 0 && (
        <div className="mt-4 px-1">
          <button
            onClick={() => setListOpen(o => !o)}
            aria-expanded={listOpen}
            className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-widest hover:opacity-70"
            style={{ color: 'var(--th-faint)' }}
          >
            <span>Birthdays · {birthdaysQ.data.length}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${listOpen ? 'rotate-180' : ''}`} />
          </button>
          {listOpen && (
            <ul className="mt-2 columns-2 sm:columns-3 gap-4">
              {birthdaysQ.data.map(b => (
                <li key={`${b.name}-${b.day}`} className="flex items-baseline gap-1.5 text-xs py-0.5 break-inside-avoid" style={{ color: 'var(--th-text)' }}>
                  <span className="w-5 shrink-0 text-right font-bold" style={{ color: 'var(--th-muted)' }}>{b.day}</span>
                  <span className="font-medium truncate" title={b.kind === 'collaborator' ? `${b.name} (collaborator)` : b.name}>
                    {b.name}
                  </span>
                  {b.kind === 'collaborator' && <span className="shrink-0 text-[9px]" style={{ color: 'var(--th-faint)' }}>★</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
