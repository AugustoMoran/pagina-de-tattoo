import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  useGetArtistsQuery,
  useUpdateArtistMutation,
  useGetArtistAvailabilityQuery,
} from '../../services/studioApi';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSave } from 'react-icons/hi';

const DAYS = [
  { i: 1, label: 'Lunes' },
  { i: 2, label: 'Martes' },
  { i: 3, label: 'Miércoles' },
  { i: 4, label: 'Jueves' },
  { i: 5, label: 'Viernes' },
  { i: 6, label: 'Sábado' },
  { i: 0, label: 'Domingo' },
];

const emptyBand = (dayOfWeek) => ({
  dayOfWeek,
  startTime: '11:00',
  endTime: '19:00',
  slotMinutes: 60,
});

const toLocalInput = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AgendaAdmin = () => {
  const { data: artists = [], isLoading } = useGetArtistsQuery({ all: 'true' });
  const [updateArtist, { isLoading: saving }] = useUpdateArtistMutation();

  const [artistId, setArtistId] = useState('');
  const [weekly, setWeekly] = useState([]);
  const [extraSlots, setExtraSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [blockedDays, setBlockedDays] = useState([]);
  const [dirty, setDirty] = useState(false);

  const [extraInput, setExtraInput] = useState('');
  const [blockSlotInput, setBlockSlotInput] = useState('');
  const [blockDayInput, setBlockDayInput] = useState('');

  const selected = artists.find((a) => a._id === artistId);

  const range = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 21);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [artistId, dirty]);

  const { data: preview, refetch: refetchPreview } = useGetArtistAvailabilityQuery(
    { id: artistId, ...range },
    { skip: !artistId }
  );

  useEffect(() => {
    if (!artistId && artists[0]?._id) setArtistId(artists[0]._id);
  }, [artists, artistId]);

  useEffect(() => {
    if (!selected) return;
    setWeekly([...(selected.weeklyAvailability || [])]);
    setExtraSlots((selected.extraSlots || []).map((d) => new Date(d).toISOString()));
    setBlockedSlots((selected.blockedSlots || []).map((d) => new Date(d).toISOString()));
    setBlockedDays([...(selected.blockedDays || [])]);
    setDirty(false);
  }, [selected?._id, selected?.updatedAt]);

  const bandsForDay = (day) => weekly.filter((w) => Number(w.dayOfWeek) === day);

  const setDayEnabled = (day, enabled) => {
    setDirty(true);
    if (enabled) {
      if (bandsForDay(day).length === 0) {
        setWeekly((w) => [...w, emptyBand(day)]);
      }
    } else {
      setWeekly((w) => w.filter((b) => Number(b.dayOfWeek) !== day));
    }
  };

  const updateBand = (day, indexInDay, patch) => {
    setDirty(true);
    setWeekly((all) => {
      let seen = 0;
      return all.map((b) => {
        if (Number(b.dayOfWeek) !== day) return b;
        if (seen++ === indexInDay) return { ...b, ...patch };
        return b;
      });
    });
  };

  const addBand = (day) => {
    setDirty(true);
    setWeekly((w) => [...w, emptyBand(day)]);
  };

  const removeBand = (day, indexInDay) => {
    setDirty(true);
    setWeekly((all) => {
      let seen = 0;
      return all.filter((b) => {
        if (Number(b.dayOfWeek) !== day) return true;
        const keep = seen !== indexInDay;
        seen += 1;
        return keep;
      });
    });
  };

  const save = async () => {
    if (!artistId) return;
    try {
      await updateArtist({
        id: artistId,
        weeklyAvailability: weekly,
        extraSlots,
        blockedSlots,
        blockedDays,
      }).unwrap();
      toast.success('Agenda guardada');
      setDirty(false);
      refetchPreview();
    } catch (err) {
      toast.error(err?.data?.message || 'No se pudo guardar');
    }
  };

  const previewByDay = useMemo(() => {
    const map = {};
    for (const iso of preview?.slots || []) {
      const d = new Date(iso);
      const key = d.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      if (!map[key]) map[key] = [];
      map[key].push(
        d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      );
    }
    return map;
  }, [preview]);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Agenda de turnos</h1>
          <p className="text-sm text-ink-soft mt-1">
            Plantilla semanal + excepciones por artista. Lo que configures acá es lo que ve el cliente en /turnos.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!artistId || saving || !dirty}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <HiOutlineSave size={18} />
          {saving ? 'Guardando…' : 'Guardar agenda'}
        </button>
      </div>

      {isLoading ? (
        <p className="text-ink-soft">Cargando artistas…</p>
      ) : artists.length === 0 ? (
        <p className="text-ink-soft">Primero creá un artista en Artistas.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {artists.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => {
                  if (dirty && !confirm('Hay cambios sin guardar. ¿Cambiar de artista?')) return;
                  setArtistId(a._id);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  artistId === a._id
                    ? 'border-primary-400 bg-primary-400/15 text-primary-400'
                    : 'border-surface-border text-ink-soft hover:border-ink/40'
                }`}
              >
                {a.nombre}
              </button>
            ))}
          </div>

          {selected && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Weekly template */}
              <div className="xl:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Semana habitual</h2>
                  <p className="text-xs text-ink-soft">Días sin franjas = no atiende</p>
                </div>

                {DAYS.map(({ i, label }) => {
                  const bands = bandsForDay(i);
                  const on = bands.length > 0;
                  return (
                    <div key={i} className="card p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) => setDayEnabled(i, e.target.checked)}
                            className="w-4 h-4 accent-primary-400"
                          />
                          <span className="font-medium">{label}</span>
                        </label>
                        {on && (
                          <button
                            type="button"
                            onClick={() => addBand(i)}
                            className="text-xs text-primary-400 flex items-center gap-1"
                          >
                            <HiOutlinePlus size={14} /> Otra franja
                          </button>
                        )}
                      </div>

                      {!on ? (
                        <p className="text-xs text-ink-soft">Cerrado</p>
                      ) : (
                        <div className="space-y-2">
                          {bands.map((b, idx) => (
                            <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                              <div>
                                <p className="text-[10px] uppercase text-ink-soft mb-0.5">Desde</p>
                                <input
                                  type="time"
                                  className="input-field text-sm"
                                  value={b.startTime}
                                  onChange={(e) => updateBand(i, idx, { startTime: e.target.value })}
                                />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-ink-soft mb-0.5">Hasta</p>
                                <input
                                  type="time"
                                  className="input-field text-sm"
                                  value={b.endTime}
                                  onChange={(e) => updateBand(i, idx, { endTime: e.target.value })}
                                />
                              </div>
                              <div>
                                <p className="text-[10px] uppercase text-ink-soft mb-0.5">Cada (min)</p>
                                <select
                                  className="input-field text-sm"
                                  value={b.slotMinutes}
                                  onChange={(e) =>
                                    updateBand(i, idx, { slotMinutes: Number(e.target.value) })
                                  }
                                >
                                  {[30, 45, 60, 90, 120].map((m) => (
                                    <option key={m} value={m}>
                                      {m} min
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                type="button"
                                className="text-red-400 text-xs justify-self-end sm:mt-4"
                                onClick={() => removeBand(i, idx)}
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Exceptions + preview */}
              <div className="space-y-4">
                <div className="card p-4 space-y-4">
                  <h2 className="font-semibold">Excepciones</h2>

                  <div>
                    <p className="text-xs text-ink-soft mb-2">Día completo libre (no atiende)</p>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="input-field text-sm flex-1"
                        value={blockDayInput}
                        onChange={(e) => setBlockDayInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => {
                          if (!blockDayInput) return;
                          if (blockedDays.includes(blockDayInput)) return;
                          setBlockedDays((d) => [...d, blockDayInput].sort());
                          setBlockDayInput('');
                          setDirty(true);
                        }}
                      >
                        Bloquear
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {blockedDays.map((d) => (
                        <li key={d} className="flex justify-between text-xs text-ink-soft">
                          <span>{d}</span>
                          <button
                            type="button"
                            className="text-red-400"
                            onClick={() => {
                              setBlockedDays((list) => list.filter((x) => x !== d));
                              setDirty(true);
                            }}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs text-ink-soft mb-2">Abrir un horario suelto</p>
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        className="input-field text-sm flex-1"
                        value={extraInput}
                        onChange={(e) => setExtraInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => {
                          if (!extraInput) return;
                          const iso = new Date(extraInput).toISOString();
                          setExtraSlots((s) => [...s, iso]);
                          setExtraInput('');
                          setDirty(true);
                        }}
                      >
                        Abrir
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                      {extraSlots.map((s) => (
                        <li key={s} className="flex justify-between text-xs text-ink-soft gap-2">
                          <span>{new Date(s).toLocaleString('es-AR')}</span>
                          <button
                            type="button"
                            className="text-red-400"
                            onClick={() => {
                              setExtraSlots((list) => list.filter((x) => x !== s));
                              setDirty(true);
                            }}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs text-ink-soft mb-2">Bloquear un horario puntual</p>
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        className="input-field text-sm flex-1"
                        value={blockSlotInput}
                        onChange={(e) => setBlockSlotInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-secondary text-sm"
                        onClick={() => {
                          if (!blockSlotInput) return;
                          const iso = new Date(blockSlotInput).toISOString();
                          setBlockedSlots((s) => [...s, iso]);
                          setBlockSlotInput('');
                          setDirty(true);
                        }}
                      >
                        Bloquear
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                      {blockedSlots.map((s) => (
                        <li key={s} className="flex justify-between text-xs text-ink-soft gap-2">
                          <span>{new Date(s).toLocaleString('es-AR')}</span>
                          <button
                            type="button"
                            className="text-red-400"
                            onClick={() => {
                              setBlockedSlots((list) => list.filter((x) => x !== s));
                              setDirty(true);
                            }}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Vista previa (21 días)</h2>
                    <span className="text-xs text-primary-400">
                      {preview?.slots?.length || 0} turnos libres
                    </span>
                  </div>
                  {dirty && (
                    <p className="text-xs text-amber-400 mb-2">
                      Guardá para actualizar la preview con los últimos cambios.
                    </p>
                  )}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {Object.keys(previewByDay).length === 0 ? (
                      <p className="text-xs text-ink-soft">
                        Sin horarios libres. Activá días en la semana o abrí un slot extra.
                      </p>
                    ) : (
                      Object.entries(previewByDay).map(([day, times]) => (
                        <div key={day}>
                          <p className="text-xs font-semibold capitalize text-ink mb-1">{day}</p>
                          <div className="flex flex-wrap gap-1">
                            {times.map((t) => (
                              <span
                                key={`${day}-${t}`}
                                className="text-[11px] px-2 py-0.5 rounded border border-surface-border text-ink-soft"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AgendaAdmin;
