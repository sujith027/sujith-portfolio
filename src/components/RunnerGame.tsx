import { useEffect, useRef, useState, type FormEvent } from "react";
import { Play, Save, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type LeaderboardEntry = { name: string; score: number };

const LEADERBOARD_KEY = "runner-leaderboard-v1";
const LEADERBOARD_LIMIT = 6;

// A small geometric side-scroller: a block-bodied runner on a dark strip, hopping spikes, stepping onto raised
// platforms and ducking under floating bars. Everything is vector shapes in one monochrome palette.
// Units are css px and seconds; "height" means pixels above the ground line.
const HEIGHT = 150;
const GROUND = 118; // y of the ground line
const PLAYER_X = 64; // fixed screen x of the runner's left edge
const PLAYER_W = 22, PLAYER_H = 26, DUCK_W = 28, DUCK_H = 15;
const GRAVITY = 2300;
const JUMP_SPEED = 560; // initial upward speed; apex is ~68px
const SHORT_HOP_SPEED = 220; // releasing jump early cuts upward speed to this
const FAST_FALL = 2.4; // gravity multiplier while holding duck in mid-air
const JUMP_BUFFER = 0.1; // seconds a too-early jump press is remembered
const START_SPEED = 280, END_SPEED = 620, NARROW_END_SPEED = 520, SPEED_PER_POINT = 0.34;
const SCORE_PER_PX = 0.04;
const FIRST_OBSTACLE_AT = 160; // px beyond the right edge where the first pattern starts
const SPIKE_W = 14, SPIKE_H = 16, BIG_SPIKE_W = 22, BIG_SPIKE_H = 34;
const BAR_W = 56, BAR_BOTTOM = 17, BAR_THICK = 8; // a standing runner hits it, a ducking runner passes under
const RESTART_DELAY = 700; // ms after a crash before the keyboard can restart the run
const STEP = 1 / 120; // physics sub-step, so a fast game can't tunnel through an edge

// Palette (the strip is dark in both site themes, so these don't read the theme).
const INK = "#ececec", SOFT = "#c9c9c9", MID = "#8c8c8c", DIM = "#4a4a4a", PANEL = "#1b1b1d", VOID = "#0f0f10";

type Piece =
  | { kind: "spike"; x: number; n: number; big: boolean; base: number }
  | { kind: "plat"; x: number; w: number; h: number }
  | { kind: "bar"; x: number };
type Item =
  | { kind: "spike"; x: number; w: number; h: number; base: number; n: number; big: boolean }
  | { kind: "plat"; x: number; w: number; h: number }
  | { kind: "bar"; x: number; w: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number };

const spike = (x: number, n = 1, big = false, base = 0): Piece => ({ kind: "spike", x, n, big, base });
const plat = (x: number, w: number, h: number): Piece => ({ kind: "plat", x, w, h });
const bar = (x: number): Piece => ({ kind: "bar", x });

// Obstacle patterns, introduced as the score climbs. `br` is a breathing distance that grows with speed, so
// the space between two jumps always leaves time to land and react. Pattern ids stop the same one repeating.
const PATTERNS: { id: string; from: number; build: (br: number) => Piece[] }[] = [
  { id: "single", from: 0, build: () => [spike(0)] },
  { id: "twin", from: 30, build: (br) => [spike(0), spike(SPIKE_W + br)] },
  { id: "double", from: 70, build: () => [spike(0, 2)] },
  { id: "hop", from: 100, build: (br) => [spike(0), plat(SPIKE_W + br, 96, 24)] },
  { id: "large", from: 150, build: () => [spike(0, 1, true)] },
  {
    id: "perch", from: 190,
    build: (br) => { const at = br * 0.85 + 8; return [plat(0, at + SPIKE_W + 36, 26), spike(at, 1, false, 26)]; },
  },
  {
    id: "hopPerch", from: 230,
    build: (br) => {
      const at = br * 0.85 + 8, start = SPIKE_W + br;
      return [spike(0), plat(start, at + SPIKE_W + 30, 24), spike(start + at, 1, false, 24)];
    },
  },
  { id: "bar", from: 260, build: () => [bar(0)] },
  {
    id: "largeStep", from: 290,
    build: (br) => [spike(0, 1, true), plat(BIG_SPIKE_W + br, 90, 28), spike(BIG_SPIKE_W + br + 90 + br * 0.9)],
  },
  { id: "triple", from: 330, build: () => [spike(0, 3)] },
  { id: "largeSmall", from: 370, build: () => [spike(0, 1, true), spike(BIG_SPIKE_W)] },
  {
    id: "stairs", from: 410,
    build: (br) => { const first = br + 60; return [plat(0, first, 22), plat(first, 84, 42)]; },
  },
  { id: "barSpike", from: 450, build: (br) => [bar(0), spike(BAR_W + br)] },
  { id: "spikeBar", from: 490, build: (br) => [spike(0), bar(SPIKE_W + br)] },
];

const pieceWidth = (piece: Piece) =>
  piece.kind === "spike" ? piece.n * (piece.big ? BIG_SPIKE_W : SPIKE_W) : piece.kind === "plat" ? piece.w : BAR_W;
const itemWidth = (item: Item) => (item.kind === "spike" ? item.w * item.n : item.w);
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry["name"] === "string" && typeof entry["score"] === "number" && Number.isFinite(entry["score"]);
}

export function RunnerGame() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [scoreSaved, setScoreSaved] = useState(false);
  const startedRef = useRef(false);
  const restartRef = useRef<() => void>(() => {});
  const jumpRef = useRef<() => void>(() => {});
  const releaseRef = useRef<() => void>(() => {});
  const duckRef = useRef<(down: boolean) => void>(() => {});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LEADERBOARD_KEY);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;
      const entries = parsed
        .filter(isLeaderboardEntry)
        .map(({ name, score }) => ({ name: name.trim().slice(0, 24), score: Math.floor(score) }))
        .filter(({ name, score }) => name.length > 0 && score >= 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, LEADERBOARD_LIMIT);
      setLeaderboard(entries);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0, dpr = 1;
    let running = false, crashed = false, crashedAt = 0, raf = 0, last = 0;

    // Runner state. `height` is the feet's height above the ground (platform tops count as ground).
    let height = 0, vy = 0, grounded = true, downHeld = false, ducking = false, jumpBuffer = 0, squash = 0, runPhase = 0;
    let speed = START_SPEED, points = 0, shownScore = -1;
    let items: Item[] = [], particles: Particle[] = [];
    let cursor = 0, lastPattern = "", groundOffset = 0, stars: { x: number; y: number; r: number }[] = [];

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round(width / 40) }, () => ({ x: Math.random() * width, y: randomBetween(8, GROUND - 30), r: Math.random() * 0.8 + 0.4 }));
      draw();
    };

    const maxSpeed = () => (width < 520 ? NARROW_END_SPEED : END_SPEED);

    const reset = () => {
      height = 0; vy = 0; grounded = true; ducking = false; jumpBuffer = 0; squash = 0; runPhase = 0;
      speed = START_SPEED; points = 0; shownScore = -1;
      items = []; particles = []; cursor = width + FIRST_OBSTACLE_AT; lastPattern = ""; groundOffset = 0;
      crashed = false; running = true; startedRef.current = true;
      setStarted(true); setOver(false); setScore(0); setPlayerName(""); setScoreSaved(false);
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };

    const startJump = () => {
      if (!running) return;
      if (grounded) { vy = JUMP_SPEED; grounded = false; ducking = false; squash = 0; }
      else jumpBuffer = JUMP_BUFFER;
    };
    const endJump = () => {
      if (vy > SHORT_HOP_SPEED) vy = SHORT_HOP_SPEED;
    };
    const setDuck = (down: boolean) => { downHeld = down; };
    restartRef.current = reset;
    jumpRef.current = startJump;
    releaseRef.current = endJump;
    duckRef.current = setDuck;

    const spawn = () => {
      const unlocked = PATTERNS.filter((pattern) => pattern.from <= points);
      // Never repeat the previous pattern, unless it is the only one unlocked yet.
      const eligible = unlocked.length > 1 ? unlocked.filter((pattern) => pattern.id !== lastPattern) : unlocked;
      // The three newest patterns get double weight so a fresh tier shows up quickly.
      const pool = eligible.flatMap((pattern, index) => (index >= eligible.length - 3 ? [pattern, pattern] : [pattern]));
      const pattern = pool[Math.floor(Math.random() * pool.length)]!;
      lastPattern = pattern.id;
      const breathing = speed * 0.5 + 46;
      const x0 = Math.max(cursor, width + 8);
      let extent = 0;
      for (const piece of pattern.build(breathing)) {
        const x = x0 + piece.x;
        extent = Math.max(extent, piece.x + pieceWidth(piece));
        if (piece.kind === "spike") items.push({ kind: "spike", x, w: piece.big ? BIG_SPIKE_W : SPIKE_W, h: piece.big ? BIG_SPIKE_H : SPIKE_H, base: piece.base, n: piece.n, big: piece.big });
        else if (piece.kind === "plat") items.push({ kind: "plat", x, w: piece.w, h: piece.h });
        else items.push({ kind: "bar", x, w: BAR_W });
      }
      const gap = speed * 0.62 + 70;
      cursor = x0 + extent + randomBetween(gap, gap * 1.7);
    };

    const crash = () => {
      crashed = true; running = false; startedRef.current = false; crashedAt = performance.now();
      if (!reduceMotion) {
        const bodyTop = GROUND - height - (ducking ? DUCK_H : PLAYER_H);
        particles = Array.from({ length: 16 }, () => ({
          x: PLAYER_X + PLAYER_W / 2, y: bodyTop + 10, vx: randomBetween(-160, 220), vy: randomBetween(-280, 60), life: randomBetween(0.4, 0.8), size: randomBetween(2, 4.5),
        }));
      }
      setStarted(false); setOver(true);
    };

    // One physics sub-step: scroll the world, move the runner, resolve landings and walls, then test hazards.
    const step = (dt: number) => {
      const shift = speed * dt;
      for (const item of items) item.x -= shift;
      items = items.filter((item) => item.x + itemWidth(item) > -20);
      cursor -= shift;
      groundOffset = (groundOffset - shift) % 44;
      if (cursor <= width + 8) spawn();

      // Duck only on the ground; in the air the same key drops the runner faster.
      ducking = downHeld && grounded;
      const bodyH = ducking ? DUCK_H : PLAYER_H, bodyW = ducking ? DUCK_W : PLAYER_W;
      const left = PLAYER_X + 2, right = PLAYER_X + bodyW - 2;

      const previous = height;
      vy -= GRAVITY * (downHeld && !grounded ? FAST_FALL : 1) * dt;
      height += vy * dt;

      let support = 0;
      for (const item of items) {
        if (item.kind !== "plat" || !(item.x < right && item.x + item.w > left)) continue;
        if (previous >= item.h - 0.5 && height <= item.h) support = Math.max(support, item.h);
        else if (height < item.h - 3) { crash(); return; } // ran into the platform's side
      }
      if (height <= support) {
        if (!grounded && vy < -200) {
          squash = 0.12;
          if (!reduceMotion) for (let i = 0; i < 5; i++) particles.push({ x: PLAYER_X + 6 + i * 3, y: GROUND - support, vx: randomBetween(-90, 20), vy: randomBetween(-70, -20), life: 0.3, size: 2 });
        }
        height = support; vy = 0; grounded = true;
        if (jumpBuffer > 0) { jumpBuffer = 0; vy = JUMP_SPEED; grounded = false; }
      } else {
        grounded = false;
      }

      // Hazards: spikes are a wide low box plus a narrow tall one (a forgiving triangle); bars are a plain box.
      const feet = height + 1, top = height + bodyH - 3;
      for (const item of items) {
        if (item.kind === "spike") {
          if (!(item.x < right && item.x + item.w * item.n > left)) continue;
          for (let i = 0; i < item.n; i++) {
            const sx = item.x + i * item.w;
            const lowBox = sx + item.w * 0.12 < right && sx + item.w * 0.88 > left && feet < item.base + item.h * 0.4 && top > item.base;
            const tallBox = sx + item.w * 0.32 < right && sx + item.w * 0.68 > left && feet < item.base + item.h * 0.85 && top > item.base;
            if (lowBox || tallBox) { crash(); return; }
          }
        } else if (item.kind === "bar") {
          if (item.x < right && item.x + item.w > left && feet < BAR_BOTTOM + BAR_THICK && top > BAR_BOTTOM) { crash(); return; }
        }
      }
    };

    function update(delta: number) {
      const dt = Math.min(delta, 50) / 1000;
      points += speed * dt * SCORE_PER_PX;
      speed = Math.min(maxSpeed(), START_SPEED + points * SPEED_PER_POINT);
      jumpBuffer = Math.max(0, jumpBuffer - dt);
      squash = Math.max(0, squash - dt);
      runPhase += dt * (6 + speed / 60);
      const steps = Math.max(1, Math.ceil(dt / STEP));
      for (let i = 0; i < steps && running; i++) step(dt / steps);
      const shown = Math.floor(points);
      if (shown !== shownScore) { shownScore = shown; setScore(shown); }
    }

    function drawRunner() {
      const duck = ducking && grounded && !crashed;
      const w = duck ? DUCK_W : PLAYER_W;
      const legH = duck ? 3 : 6;
      const feetY = GROUND - height;
      // Slight stretch while rising, squash on landing.
      const stretch = crashed ? 1 : !grounded ? 1 + Math.min(0.1, Math.abs(vy) / 6000) : squash > 0 ? 1 - squash * 0.9 : 1;
      const bodyHeight = ((duck ? DUCK_H : PLAYER_H) - legH) * stretch;
      const bodyTop = feetY - legH - bodyHeight;
      const bodyWidth = w + (stretch < 1 ? (1 - stretch) * 14 : 0);
      ctx.fillStyle = crashed ? MID : INK;
      ctx.beginPath();
      ctx.roundRect(PLAYER_X - (bodyWidth - w) / 2, bodyTop, bodyWidth, bodyHeight, 6);
      ctx.fill();
      // Legs alternate while running and tuck while airborne.
      const lift = grounded && running && !duck ? Math.sin(runPhase) : 0;
      const back = grounded || crashed ? (lift > 0 ? 2.5 : 0) : 3;
      const front = grounded || crashed ? (lift > 0 ? 0 : 2.5) : 3;
      ctx.fillStyle = SOFT;
      ctx.fillRect(PLAYER_X + 4, feetY - legH - back, 5, legH);
      ctx.fillRect(PLAYER_X + w - 10, feetY - legH - front, 5, legH);
      // Visor on the side the runner is facing.
      ctx.fillStyle = VOID;
      ctx.beginPath();
      ctx.roundRect(PLAYER_X + w - 14, bodyTop + (duck ? 2 : 5), 11, duck ? 6 : 8, 3);
      ctx.fill();
      if (crashed) {
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.5;
        const ex = PLAYER_X + w - 11, ey = bodyTop + (duck ? 4 : 7);
        ctx.beginPath();
        ctx.moveTo(ex, ey); ctx.lineTo(ex + 5, ey + 4);
        ctx.moveTo(ex + 5, ey); ctx.lineTo(ex, ey + 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = INK;
        ctx.fillRect(PLAYER_X + w - 8, bodyTop + (duck ? 3.5 : 7), 4, 3);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, HEIGHT);
      // Background: a few faint dots drifting slowly for depth.
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      for (const star of stars) {
        const x = reduceMotion ? star.x : (((star.x - points * 2.2 * star.r) % width) + width) % width;
        ctx.fillRect(x, star.y, star.r * 1.6, star.r * 1.6);
      }
      // Ground: a line, then scrolling dashes beneath it that give the feeling of speed.
      ctx.fillStyle = MID;
      ctx.fillRect(0, GROUND, width, 1.5);
      ctx.fillStyle = DIM;
      for (let x = groundOffset - 44; x < width; x += 44) {
        ctx.fillRect(x, GROUND + 9, 16, 1.5);
        ctx.fillRect(x + 22, GROUND + 19, 9, 1.5);
      }
      for (const item of items) {
        if (item.kind === "plat") {
          ctx.fillStyle = PANEL;
          ctx.fillRect(item.x, GROUND - item.h, item.w, item.h);
          ctx.fillStyle = SOFT;
          ctx.fillRect(item.x, GROUND - item.h, item.w, 2);
          ctx.fillStyle = DIM;
          ctx.fillRect(item.x, GROUND - item.h, 1.5, item.h);
        } else if (item.kind === "bar") {
          const y = GROUND - BAR_BOTTOM - BAR_THICK;
          ctx.fillStyle = SOFT;
          ctx.fillRect(item.x, y, item.w, BAR_THICK);
          ctx.fillStyle = VOID;
          for (let x = item.x + 6; x < item.x + item.w - 4; x += 10) {
            ctx.beginPath();
            ctx.moveTo(x, y + BAR_THICK); ctx.lineTo(x + 3, y); ctx.lineTo(x + 6, y); ctx.lineTo(x + 3, y + BAR_THICK);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = INK;
          ctx.fillRect(item.x, y - 3, 3, BAR_THICK + 6);
          ctx.fillRect(item.x + item.w - 3, y - 3, 3, BAR_THICK + 6);
        } else {
          const baseY = GROUND - item.base;
          ctx.fillStyle = item.big ? INK : SOFT;
          ctx.beginPath();
          for (let i = 0; i < item.n; i++) {
            const sx = item.x + i * item.w;
            ctx.moveTo(sx, baseY); ctx.lineTo(sx + item.w / 2, baseY - item.h); ctx.lineTo(sx + item.w, baseY);
            ctx.closePath();
          }
          ctx.fill();
        }
      }
      drawRunner();
      ctx.fillStyle = INK;
      for (const particle of particles) {
        ctx.globalAlpha = Math.max(0, Math.min(1, particle.life * 2.2));
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      ctx.globalAlpha = 1;
    }

    function loop(now: number) {
      const delta = now - last;
      last = now;
      if (running) update(delta);
      if (particles.length) {
        const dt = Math.min(delta, 50) / 1000;
        for (const particle of particles) {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.vy += 900 * dt;
          particle.life -= dt;
        }
        particles = particles.filter((particle) => particle.life > 0);
      }
      draw();
      if (running || particles.length) raf = requestAnimationFrame(loop);
    }

    const inView = () => {
      const bounds = canvas.getBoundingClientRect();
      return bounds.top < innerHeight && bounds.bottom > 0;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!inView() || (event.target instanceof HTMLElement && event.target.closest("input, textarea, button, a, [role=dialog]"))) return;
      if (event.code === "Space" || event.code === "ArrowUp") {
        // After a crash the same keys play again (after a beat, so a panicked key-mash doesn't skip the score
        // screen); otherwise the page scrolls as usual until a run is under way.
        if (!running && !crashed) return;
        event.preventDefault();
        if (!running) { if (!event.repeat && performance.now() - crashedAt > RESTART_DELAY) reset(); }
        else if (!event.repeat) startJump();
      } else if (event.code === "ArrowDown" && running) {
        event.preventDefault();
        setDuck(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") endJump();
      else if (event.code === "ArrowDown") setDuck(false);
    };

    size();
    addEventListener("resize", size);
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", size);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const qualifies = score > 0 && (
    leaderboard.length < LEADERBOARD_LIMIT || score > leaderboard[leaderboard.length - 1]!.score
  );

  const saveScore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = playerName.trim().slice(0, 24);
    if (!name || !qualifies) return;

    const next = [...leaderboard, { name, score }]
      .sort((left, right) => right.score - left.score)
      .slice(0, LEADERBOARD_LIMIT);
    setLeaderboard(next);
    setScoreSaved(true);
    try {
      window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
    } catch {
      // Keep the score for this session when browser storage is unavailable.
    }
  };

  const exitGame = () => {
    startedRef.current = false;
    setStarted(false);
    setOver(false);
    setScore(0);
    setPlayerName("");
    setScoreSaved(false);
  };

  // Touch: tapping the game or the Jump pad jumps (lift to release); holding the Duck pad ducks.
  const onPointerDown = () => {
    if (startedRef.current) jumpRef.current();
    else restartRef.current();
  };
  const onPointerEnd = () => releaseRef.current();
  const onDuckDown = () => {
    if (startedRef.current) duckRef.current(true);
    else restartRef.current();
  };
  const onDuckEnd = () => duckRef.current(false);

  return (
    <div className="relative select-none rounded-[10px] border bg-card p-4">
      <div className="relative z-30 flex items-center justify-between px-2 text-sm font-semibold text-muted-foreground">
        <span>
          <span className="pointer-coarse:hidden">SPACE / ↑ Jump · ↓ Duck</span>
          <span className="hidden pointer-coarse:inline">Tap Jump · Hold Duck</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg text-foreground tabular-nums">{String(score).padStart(5, "0")}</span>
          <Dialog open={leaderboardOpen} onOpenChange={setLeaderboardOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Open leaderboard" title="Leaderboard">
                <Trophy aria-hidden className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Leaderboard</DialogTitle>
                <DialogDescription>Top six runs on this browser</DialogDescription>
              </DialogHeader>
              {leaderboard.length > 0 ? (
                <ol className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <li key={`${entry.name}-${entry.score}-${index}`} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                      <span className="w-6 text-sm font-semibold text-muted-foreground">{index + 1}.</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{entry.name}</span>
                      <span className="font-display font-bold tabular-nums">{String(entry.score).padStart(5, "0")}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">No scores yet. Set the first record!</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <canvas
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        aria-label="Endless runner mini game"
        className="mt-2 h-[150px] w-full cursor-pointer touch-none rounded-lg bg-linear-to-b from-[#161617] to-[#0b0b0c]"
      />
      {/* Phones: two big pads under the game so the thumbs never cover the action. */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:hidden">
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          aria-hidden
          className="grid h-28 touch-none place-items-center rounded-lg border border-dashed text-sm font-semibold text-muted-foreground active:bg-accent"
        >
          Jump ↑
        </div>
        <div
          onPointerDown={onDuckDown}
          onPointerUp={onDuckEnd}
          onPointerCancel={onDuckEnd}
          onPointerLeave={onDuckEnd}
          aria-hidden
          className="grid h-28 touch-none place-items-center rounded-lg border border-dashed text-sm font-semibold text-muted-foreground active:bg-accent"
        >
          Duck ↓ (hold)
        </div>
      </div>
      {!started && !over && (
        <div className="absolute inset-0 grid place-items-center rounded-[10px] bg-background/70 backdrop-blur-sm">
          <button onClick={() => restartRef.current()} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105">
            <Play aria-hidden className="h-4 w-4 fill-current" />
            Start game
          </button>
        </div>
      )}
      {over && (
        <div className="absolute inset-x-0 bottom-0 top-12 z-20 grid place-items-center rounded-b-[10px] bg-background/80 p-3 backdrop-blur-sm md:top-0 md:rounded-[10px] md:p-4">
          <div className="w-full max-w-sm text-center animate-scale-in">
            <p className="font-display text-2xl font-bold md:text-3xl">Run over</p>
            <p className="text-sm text-muted-foreground md:mt-1 md:text-base">Score {score}</p>
            {scoreSaved ? (
              <p className="mt-4 text-sm font-semibold text-primary md:mt-3">Added to the leaderboard</p>
            ) : qualifies ? (
              <form onSubmit={saveScore} className="mt-4 space-y-2 md:mt-3">
                <label className="sr-only" htmlFor="runner-player-name">Your name</label>
                <div className="relative">
                  <input
                    id="runner-player-name"
                    autoComplete="nickname"
                    maxLength={24}
                    required
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder="Enter your name"
                    className="h-9 w-full rounded-md border bg-background py-2 pl-3 pr-20 md:h-10 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <button
                    type="submit"
                    aria-label="Save score"
                    title="Save score"
                    className="absolute right-1 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-md bg-transparent px-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Save aria-hidden className="h-3.5 w-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground md:mt-3">Not in the top six this time.</p>
            )}
            <div className="mt-5 flex justify-center gap-3 md:mt-3 md:gap-2">
              <Button type="button" onClick={() => restartRef.current()}>Retry ↻</Button>
              <Button type="button" variant="outline" onClick={exitGame}>Exit game</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
