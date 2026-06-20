import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileUp, Loader2, Maximize2, RefreshCcw, Sparkles, Trophy, Upload, Users, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const normalizeName = (name: string) => name.trim().replace(/\s+/g, ' ');

function parseNames(raw: string) {
  return raw
    .split(/\r?\n|\t|,|;|\|/g)
    .map(normalizeName)
    .filter(Boolean);
}

function uniquePreserveOrder(names: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 160 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: -12 + Math.random() * 18,
        size: 6 + Math.random() * 12,
        hue: Math.floor(Math.random() * 360),
        delay: Math.random() * 0.25,
        duration: 1.8 + Math.random() * 1.8,
        drift: -220 + Math.random() * 440,
        rotate: Math.random() * 1080,
      })),
    [active]
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size * 1.35,
            borderRadius: 4,
            background: `hsl(${p.hue} 95% 60%)`,
            boxShadow: '0 0 18px rgba(255,255,255,0.85)',
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
            transform: `translateY(-50%) rotate(${p.rotate}deg)`,
            ['--drift' as any]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function FlashOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return <div className="pointer-events-none fixed inset-0 z-[9998] bg-white/95 animate-[flash_0.55s_ease-out_forwards]" />;
}

function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const spinTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);

  const getCtx = () => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  };

  const tone = (frequency: number, duration: number, type: OscillatorType = 'sine', gainValue = 0.05) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const startSpinSound = () => {
    stopAll();
    spinTimerRef.current = window.setInterval(() => {
      tone(240 + Math.random() * 220, 0.06, 'triangle', 0.03);
    }, 120);
  };

  const startTickSound = () => {
    stopTickSound();
    tickTimerRef.current = window.setInterval(() => {
      tone(1020, 0.02, 'square', 0.015);
    }, 90);
  };

  const stopSpinSound = () => {
    if (spinTimerRef.current) {
      window.clearInterval(spinTimerRef.current);
      spinTimerRef.current = null;
    }
  };

  const stopTickSound = () => {
    if (tickTimerRef.current) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  };

  const stopAll = () => {
    stopSpinSound();
    stopTickSound();
  };

  const ding = () => {
    tone(784, 0.12, 'sine', 0.08);
    setTimeout(() => tone(988, 0.14, 'sine', 0.08), 90);
    setTimeout(() => tone(1175, 0.18, 'sine', 0.07), 180);
  };

  return { startSpinSound, startTickSound, stopAll, ding };
}

export default function RandomClassPicker() {
  const [input, setInput] = useState('');
  const [pool, setPool] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('아직 추첨 전');
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const [flash, setFlash] = useState(false);
  const [status, setStatus] = useState('학생 이름을 한 번에 붙여넣고 등록하세요.');
  const [menuOpen, setMenuOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownMode, setCountdownMode] = useState<'draw' | null>(null);
  const [fullscreenLabel, setFullscreenLabel] = useState('전체화면');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const spinIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const { startSpinSound, startTickSound, stopAll, ding } = useAudio();

  const remainingCount = pool.length;

  const clearTimers = () => {
    if (spinIntervalRef.current) window.clearInterval(spinIntervalRef.current);
    if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
    if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
    spinIntervalRef.current = null;
    stopTimeoutRef.current = null;
    countdownTimerRef.current = null;
    stopAll();
  };

  const addNamesToPool = (names: string[], sourceLabel: string) => {
    const cleaned = uniquePreserveOrder(names.map(normalizeName).filter(Boolean));
    if (!cleaned.length) {
      setStatus('가져올 이름이 없어요.');
      return;
    }
    const merged = uniquePreserveOrder([...pool, ...cleaned]);
    setPool(merged);
    setStatus(`${sourceLabel}에서 ${cleaned.length}명 등록 완료! 현재 후보 ${merged.length}명`);
  };

  const registerNames = () => {
    const parsed = uniquePreserveOrder(parseNames(input));
    if (!parsed.length) {
      setStatus('붙여넣은 이름이 보이지 않아요.');
      return;
    }
    const merged = uniquePreserveOrder([...pool, ...parsed]);
    setPool(merged);
    setInput('');
    setStatus(`${parsed.length}명 등록 완료! 현재 후보 ${merged.length}명`);
  };

  const readFileText = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.SheetNames[0];
      if (!sheet) return [] as string[];
      const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheet], { header: 1, raw: false, blankrows: false });
      const flattened = rows.flatMap((row) => row.map((cell) => String(cell ?? '').trim()).filter(Boolean));
      return uniquePreserveOrder(flattened);
    }
    const text = await file.text();
    return uniquePreserveOrder(parseNames(text));
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const names = await readFileText(file);
      setFileName(file.name);
      addNamesToPool(names, file.name);
    } catch {
      setStatus('파일을 읽는 데 실패했어요. txt, csv, xls, xlsx 형식을 확인해 주세요.');
    } finally {
      e.target.value = '';
      setMenuOpen(false);
    }
  };

  const startCountdown = (done: () => void) => {
    clearTimers();
    setCountdownMode('draw');
    setCountdown(3);
    let current = 3;
    countdownTimerRef.current = window.setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdown(null);
        setCountdownMode(null);
        done();
      }
    }, 700);
  };

  const drawWinner = () => {
    if (spinning || pool.length === 0) return;
    setWinner(null);
    setConfetti(false);
    setFlash(false);
    startCountdown(() => {
      setSpinning(true);
      setStatus('두근두근 추첨 중...');
      startSpinSound();
      startTickSound();

      const candidates = [...pool];
      let i = 0;
      spinIntervalRef.current = window.setInterval(() => {
        setDisplayName(candidates[i % candidates.length]);
        i += 1;
      }, 65);

      const spinTime = 2600 + Math.random() * 1400;
      stopTimeoutRef.current = window.setTimeout(() => {
        clearTimers();
        const pickedIndex = Math.floor(Math.random() * pool.length);
        const picked = pool[pickedIndex];
        const nextPool = pool.filter((n) => n !== picked);
        setDisplayName(picked);
        setWinner(picked);
        setPool(nextPool);
        setHistory((prev) => [picked, ...prev]);
        setSpinning(false);
        setStatus('당첨!');
        setFlash(true);
        ding();
        setConfetti(true);
        window.setTimeout(() => setFlash(false), 560);
        window.setTimeout(() => setConfetti(false), 3600);
      }, spinTime);
    });
  };

  const resetPool = () => {
    clearTimers();
    if (history.length === 0) {
      setStatus('초기화할 당첨자가 아직 없어요.');
      return;
    }
    setPool((prev) => uniquePreserveOrder([...prev, ...history]));
    setHistory([]);
    setWinner(null);
    setDisplayName('초기화 완료');
    setStatus('뽑힌 학생을 다시 후보로 돌려놨어요.');
  };

  const toggleFullscreen = async () => {
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setFullscreenLabel('전체화면 해제');
      } else {
        await document.exitFullscreen();
        setFullscreenLabel('전체화면');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreenLabel(document.fullscreenElement ? '전체화면 해제' : '전체화면');
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      clearTimers();
    };
  }, []);

  return (
    <div className="min-h-screen bg-pink-200 text-pink-950" style={{ fontFamily: 'Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @keyframes confetti-fall { 0% { transform: translateY(-20%) translateX(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(230vh) translateX(var(--drift, 50px)) rotate(1080deg); opacity: 0; } }
        @keyframes pulseGlow { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255,255,255,0)); } 50% { transform: scale(1.03); filter: drop-shadow(0 0 18px rgba(255,255,255,0.5)); } }
        @keyframes menuPop { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes flash { 0% { opacity: 0; } 20% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>

      <FlashOverlay active={flash} />
      <ConfettiBurst active={confetti} />

      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="pointer-events-none fixed inset-0 z-[9997] flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
          >
            <div className="rounded-full bg-white px-12 py-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.3)]">
              <div className="text-sm font-black uppercase tracking-[0.35em] text-pink-500">추첨 시작</div>
              <div className="mt-2 text-[clamp(64px,10vw,140px)] font-black leading-none text-fuchsia-700">{countdown}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 md:p-8">
        <header className="rounded-3xl bg-white/75 p-5 shadow-2xl backdrop-blur md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                <Sparkles className="h-4 w-4" /> 교실 랜덤 추첨기
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">오늘의 당첨 학생은?</h1>
              <p className="mt-2 text-lg font-semibold text-pink-900/80 md:text-2xl">Excel 복사 붙여넣기 OK, 한 번 뽑힌 학생은 다시 안 뽑혀요.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center md:min-w-[300px]">
              <div className="rounded-2xl bg-pink-100 p-4 shadow-lg">
                <div className="text-sm font-bold text-pink-700">남은 후보</div>
                <div className="mt-1 text-4xl font-black">{remainingCount}</div>
              </div>
              <div className="rounded-2xl bg-pink-100 p-4 shadow-lg">
                <div className="text-sm font-bold text-pink-700">당첨자</div>
                <div className="mt-1 text-4xl font-black">{history.length}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6 rounded-3xl bg-white/80 p-5 shadow-2xl backdrop-blur md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <label className="block text-xl font-extrabold">학생 이름 붙여넣기</label>
                <button onClick={() => setMenuOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-pink-700 shadow-md ring-2 ring-pink-200 transition hover:scale-[1.02]">
                  <Upload className="h-4 w-4" /> 파일등록 메뉴
                </button>
              </div>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18 }} className="mb-4 rounded-3xl bg-pink-50 p-4 shadow-inner" style={{ animation: 'menuPop 0.18s ease-out' }}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-black text-pink-900">파일로 등록하기</div>
                        <div className="mt-1 text-sm font-semibold text-pink-900/70">txt, csv, xls, xlsx 파일을 불러올 수 있어요.</div>
                      </div>
                      <button onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-2 text-sm font-bold text-pink-700 shadow">
                        <X className="h-4 w-4" /> 닫기
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-3 text-lg font-black text-white shadow-lg transition hover:scale-[1.02]">
                        <FileUp className="h-5 w-5" /> 파일 선택
                      </button>
                      <div className="rounded-full bg-white px-4 py-3 text-sm font-bold text-pink-700 shadow">최근 파일: {fileName || '없음'}</div>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".txt,.csv,.xls,.xlsx,.xlsm" className="hidden" onChange={handleFilePick} />
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={'예시:\n김민준\t이서연\t박지후\n최하린\n오세진\nExcel에서 복사한 표도 그대로 붙여넣어 보세요.'}
                className="min-h-[200px] w-full rounded-3xl border-4 border-pink-300 bg-pink-50 p-5 text-xl font-semibold outline-none transition focus:border-pink-500"
                style={{ lineHeight: 1.6 }}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={registerNames} className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-6 py-4 text-xl font-black text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98]">
                  <Users className="h-5 w-5" /> 등록하기
                </button>
                <button onClick={drawWinner} disabled={spinning || pool.length === 0} className="inline-flex items-center gap-2 rounded-full bg-fuchsia-700 px-6 py-4 text-xl font-black text-white shadow-xl transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                  {spinning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trophy className="h-5 w-5" />} 랜덤 뽑기
                </button>
                <button onClick={toggleFullscreen} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-xl font-black text-pink-700 shadow-xl ring-4 ring-pink-200 transition hover:scale-[1.02] active:scale-[0.98]">
                  <Maximize2 className="h-5 w-5" /> {fullscreenLabel}
                </button>
                <button onClick={resetPool} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-xl font-black text-pink-700 shadow-xl ring-4 ring-pink-200 transition hover:scale-[1.02] active:scale-[0.98]">
                  <RefreshCcw className="h-5 w-5" /> 초기화
                </button>
              </div>
              <p className="mt-3 text-lg font-semibold text-pink-900/80">{status}</p>
            </div>

            <div className="rounded-3xl bg-pink-100 p-5 shadow-inner">
              <div className="text-lg font-black text-pink-800">추첨 화면</div>
              <div className="mt-4 flex min-h-[280px] items-center justify-center rounded-3xl bg-gradient-to-br from-pink-300 via-pink-200 to-rose-100 p-6 text-center shadow-inner" style={{ animation: spinning ? 'pulseGlow 0.9s ease-in-out infinite' : undefined }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayName}
                    initial={{ opacity: 0, scale: 0.7, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.22 }}
                    className="text-5xl font-black tracking-tight text-pink-950 md:text-7xl"
                  >
                    {displayName}
                  </motion.div>
                </AnimatePresence>
              </div>
              {winner && (
                <div className="mt-4 rounded-2xl bg-white p-4 text-center text-2xl font-black text-fuchsia-700 shadow-lg">
                  🎉 당첨자: {winner}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl bg-white/80 p-5 shadow-2xl backdrop-blur md:p-8">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">당첨된 학생</h2>
              <p className="mt-1 text-lg font-semibold text-pink-900/70">한 번 뽑힌 학생은 목록에 쌓이고 후보에서는 빠집니다.</p>
            </div>

            <div className="rounded-3xl bg-pink-50 p-4 shadow-inner">
              {history.length === 0 ? (
                <div className="py-10 text-center text-xl font-bold text-pink-800/60">아직 당첨자가 없어요.</div>
              ) : (
                <ol className="grid gap-3">
                  {history.map((name, idx) => (
                    <li key={`${name}-${idx}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-xl font-extrabold shadow-md">
                      <span>{name}</span>
                      <span className="rounded-full bg-pink-200 px-3 py-1 text-base text-pink-900">#{history.length - idx}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="rounded-3xl bg-pink-100 p-4 shadow-inner">
              <div className="mb-3 text-xl font-black text-pink-900">현재 후보</div>
              {pool.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-center text-lg font-bold text-pink-700">남은 학생이 없어요. 초기화하면 다시 후보로 돌아갑니다.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pool.map((name) => (
                    <span key={name} className="rounded-full bg-white px-4 py-2 text-lg font-bold shadow">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </main>

        <div className="pointer-events-none fixed right-4 top-4 z-[9996] rounded-full bg-white/80 px-4 py-2 text-sm font-black text-pink-700 shadow-lg backdrop-blur">TV 화면용 모드</div>
      </div>
    </div>
  );
}
