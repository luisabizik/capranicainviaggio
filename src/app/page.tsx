'use client';

import { useEffect, useState, useMemo } from 'react';

interface Treno {
  numeroTreno: number;
  categoria: string;
  destinazione: string;
  orarioPartenza: string | number;
  ritardo: number;
  ritardoPartenza?: number;
  ritardoArrivo?: number;
  binarioEffettivoPartenzaDescrizione?: string;
  binarioProgrammatoPartenzaDescrizione?: string;
  inStazione: boolean;
  provvedimento?: number;
  subTitle?: string;
}

export default function Home() {
  const [treni, setTreni] = useState<Treno[]>([]);
  const [filtro, setFiltro] = useState<'TUTTI' | 'ROMA' | 'VITERBO'>('TUTTI');
  const [caricamento, setCaricamento] = useState(true);
  const [ultimoAggiornamento, setUltimoAggiornamento] = useState<string>('');

  const caricaTreni = async () => {
    setCaricamento(true);
    try {
      const res = await fetch('/api/treni');
      if (!res.ok) throw new Error('Errore durante il recupero dei dati');
      const data = await res.json();
      setTreni(Array.isArray(data) ? data : []);
      setUltimoAggiornamento(
        new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setCaricamento(false);
    }
  };

  useEffect(() => {
    caricaTreni();
    const interval = setInterval(caricaTreni, 30000);
    return () => clearInterval(interval);
  }, []);

  const valTs = (val: string | number | undefined): number | null => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') return Number(val);
    return null;
  };

  const formattaOrario = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '--:--';
    const ts = valTs(val);

    if (ts !== null) {
      const d = new Date(ts);
      d.setSeconds(0, 0);
      const ore = String(d.getHours()).padStart(2, '0');
      const minuti = String(d.getMinutes()).padStart(2, '0');
      return `${ore}:${minuti}`;
    }

    if (typeof val === 'string' && val.includes(':')) {
      const [h, m] = val.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    }

    return '--:--';
  };

  // Normalizza il ritardo compensando il minuto di sosta tecnica di arrivo/partenza
  const normalizzaRitardo = (treno: Treno) => {
    const raw = typeof treno.ritardoPartenza === 'number' ? treno.ritardoPartenza : (treno.ritardo || 0);
    if (!raw || raw <= 0) return 0;
    const minuti = Math.floor(raw);
    return Math.max(0, minuti > 0 && typeof treno.ritardoPartenza === 'undefined' ? minuti - 1 : minuti);
  };

  const calcolaOrarioEffettivo = (orario: string | number | undefined, ritardo: number) => {
    if (orario === undefined || orario === null) return '--:--';
    if (ritardo <= 0) return formattaOrario(orario);

    const ts = valTs(orario);
    if (ts !== null) {
      const d = new Date(ts);
      d.setSeconds(0, 0);
      d.setMinutes(d.getMinutes() + ritardo);
      const ore = String(d.getHours()).padStart(2, '0');
      const minuti = String(d.getMinutes()).padStart(2, '0');
      return `${ore}:${minuti}`;
    }

    if (typeof orario === 'string' && orario.includes(':')) {
      const [oreStr, minStr] = orario.split(':');
      const d = new Date();
      d.setHours(Number(oreStr), Number(minStr) + ritardo, 0, 0);
      const ore = String(d.getHours()).padStart(2, '0');
      const minuti = String(d.getMinutes()).padStart(2, '0');
      return `${ore}:${minuti}`;
    }

    return String(orario);
  };

  const treniFiltrati = useMemo(() => {
    return treni.filter((t) => {
      const dest = (t.destinazione || '').toUpperCase();
      if (filtro === 'ROMA') {
        return (
          dest.includes('ROMA') ||
          dest.includes('OSTIENSE') ||
          dest.includes('TIBURTINA') ||
          dest.includes('CESANO') ||
          dest.includes('BRACCIANO')
        );
      }
      if (filtro === 'VITERBO') {
        return dest.includes('VITERBO');
      }
      return true;
    });
  }, [treni, filtro]);

  return (
    <main className="min-h-screen bg-slate-100 font-sans pb-10">
      {/* Header Rosso Trenitalia */}
      <header className="bg-red-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-red-100">
                Linea FL3
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
              Capranica-Sutri
            </h1>
            <p className="text-[11px] font-medium text-red-100">
              {ultimoAggiornamento ? `Aggiornato alle ${ultimoAggiornamento}` : 'Caricamento orari...'}
            </p>
          </div>

          <button
            onClick={caricaTreni}
            disabled={caricamento}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-red-600 font-bold text-xs hover:bg-red-50 active:scale-95 transition shadow-sm disabled:opacity-60"
          >
            <svg
              className={`w-4 h-4 ${caricamento ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Aggiorna</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* Selettore Direzione */}
        <div className="flex p-1 bg-slate-200/90 rounded-2xl shadow-inner">
          {(['TUTTI', 'ROMA', 'VITERBO'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltro(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition duration-150 ${
                filtro === tab
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'TUTTI' ? 'Tutti' : tab === 'ROMA' ? 'Verso Roma' : 'Verso Viterbo'}
            </button>
          ))}
        </div>

        {/* Tabellone Partenze */}
        {caricamento && treni.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Recupero partenze in tempo reale...</p>
          </div>
        ) : treniFiltrati.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200 space-y-1">
            <p className="text-sm font-bold text-slate-900">Nessuna partenza rilevata a breve</p>
            <p className="text-xs text-slate-500">I dati mostrano i treni programmati nei prossimi 60-90 minuti.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {treniFiltrati.map((treno) => {
              const binario =
                treno.binarioEffettivoPartenzaDescrizione ||
                treno.binarioProgrammatoPartenzaDescrizione ||
                '-';
              const soppresso = treno.provvedimento === 1 || treno.provvedimento === 2;
              const ritardo = normalizzaRitardo(treno);
              const inRitardo = ritardo > 0;
              const orarioPrevisto = calcolaOrarioEffettivo(treno.orarioPartenza, ritardo);
              const orarioTeorico = formattaOrario(treno.orarioPartenza);

              return (
                <div
                  key={treno.numeroTreno}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3 hover:shadow-md transition"
                >
                  {/* Riga Superiore: Orario e Destinazione */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black tracking-tight text-slate-900">
                          {inRitardo ? orarioPrevisto : orarioTeorico}
                        </span>
                        {inRitardo && (
                          <span className="text-xs line-through text-slate-400 font-semibold">
                            {orarioTeorico}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">
                          {treno.categoria || 'REG'} {treno.numeroTreno}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900 leading-snug">
                        {treno.destinazione}
                      </p>
                    </div>

                    {/* Badge Stato Ritardo */}
                    <div>
                      {soppresso ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold bg-red-100 text-red-700 border border-red-200">
                          Cancellato
                        </span>
                      ) : inRitardo ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                          +{ritardo} min
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          In orario
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Riga Inferiore: Binario e Info Stazione */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-semibold">Binario</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-black border border-blue-200">
                        {binario}
                      </span>
                      {treno.binarioEffettivoPartenzaDescrizione && (
                        <span className="text-[10px] text-emerald-600 font-bold">✓ confermato</span>
                      )}
                    </div>

                    {treno.inStazione && (
                      <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                        In stazione
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}