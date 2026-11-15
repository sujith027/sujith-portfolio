import type { CSSProperties, ReactNode } from "react";
import figma from "@/assets/Figma.png";
import gpt from "@/assets/GPT.png";
import vscode from "@/assets/VS code.png";
import claude from "@/assets/Claude.png";
import spline from "@/assets/Spline.png";

// Static concentric rings with tool badges drifting slowly around them. Only the badge arms animate (CSS
// transforms, see .orbit-arm in styles.css); each badge counter-rotates so its icon stays upright.

// `size` is the icon in px on the 54px desktop circle; it is stored as a percentage so it scales down with the circle on mobile.
const img = (src: string, size = 30) => <img src={src} alt="" draggable={false} style={{ width: `${(size / 54) * 100}%`, height: `${(size / 54) * 100}%` }} className="max-w-none select-none object-contain" />;

// ChatGPT and Spline ride the outer ring, then Claude, Figma and VS Code one ring each going inward; the innermost ring
// stays empty. radius = % of the square (half a ring's size in `rings`) and seconds = one lap, each as [phone, desktop]:
// phones use tighter rings (shorter laps keep the on-screen speed), desktop (640px and up) the wider ones. start = angle
// in degrees from the top, dir = direction. Each icon drifts all the way round its ring from that starting spot.
const badges: { label: string; radius: [number, number]; start: number; seconds: [number, number]; dir: 1 | -1; icon: ReactNode }[] = [
  { label: "Figma", radius: [27, 33], start: 157, seconds: [90, 110], dir: 1, icon: img(figma) },
  { label: "ChatGPT", radius: [44, 53], start: 75, seconds: [100, 120], dir: -1, icon: img(gpt) },
  { label: "VS Code", radius: [18.5, 23], start: 337, seconds: [88, 110], dir: 1, icon: img(vscode) },
  { label: "Claude", radius: [35.5, 43], start: 233, seconds: [83, 100], dir: -1, icon: img(claude) },
  { label: "Spline", radius: [44, 53], start: 292, seconds: [93, 112], dir: 1, icon: img(spline, 34) },
];

// Ring diameters as % of the square, [phone, desktop]. Neighbouring rings are 8.5% (phone) / 10% (desktop) of the square
// apart, wider than an icon circle, so icons on adjacent rings never touch when they pass.
// The card shows about +-0.385 of the square vertically, so an icon on a ring wider than that is clipped at the card's top
// and bottom. Once the badge is completely out of sight (centre past HIDE_Y = card edge + half a badge) it skips the rest of
// that stretch and reappears on the opposite side, instead of travelling the rest of the circle unseen; the jump happens
// while it is hidden, so nothing visibly pops. `k` is the half-angle of each skipped stretch (0 = full circle).
const HIDE_Y = 0.435;
function skipFor(radiusPct: number, seconds: number, start: number, dir: 1 | -1) {
  const r = radiusPct / 100;
  const k = r > HIDE_Y ? (Math.acos(HIDE_Y / r) * 180) / Math.PI : 0;
  const span = 180 - 2 * k; // visible arc, in degrees
  const a = ((start % 360) + 360) % 360;
  let f = a >= 180 ? 0.5 + (Math.min(Math.max(a, 180 + k), 360 - k) - 180 - k) / span / 2 : (Math.min(Math.max(a, k), 180 - k) - k) / span / 2;
  if (dir === -1) f = 1 - f; // reversed playback
  const d = (seconds * (360 - 4 * k)) / 360; // same angular speed on the visible arcs as the full lap
  return { k, d, delay: -f * d };
}
function orbitVars(b: (typeof badges)[number]) {
  const m = skipFor(b.radius[0], b.seconds[0], b.start, b.dir);
  const d = skipFor(b.radius[1], b.seconds[1], b.start, b.dir);
  return {
    skip: m.k > 0 || d.k > 0,
    vars: {
      "--dm": `${m.d}s`, "--dd": `${d.d}s`, "--km": `${m.k}deg`, "--kd": `${d.k}deg`,
      "--delm": `${m.delay}s`, "--deld": `${d.delay}s`, "--ad": b.dir === 1 ? "normal" : "reverse",
    },
  };
}

const rings: [number, number][] = [[88, 106], [71, 86], [54, 66], [37, 46], [20, 27]];

export function ToolsOrbit() {
  return (
    <div
      role="img"
      aria-label="Design tools orbiting: Figma, ChatGPT, VS Code, Claude, Spline"
      className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-3xl border bg-[#0a0a0a] sm:aspect-[2.4/1]"
    >
      <div className="absolute left-1/2 top-1/2 aspect-square h-[130%] -translate-x-1/2 -translate-y-1/2">
        {rings.map(([sm, lg], i) => (
          <span
            key={sm}
            className="orbit-ring absolute left-1/2 top-1/2 rounded-full"
            style={{
              "--rm": sm,
              "--rd": lg,
              transform: "translate(-50%, -50%)",
              background: `oklch(${0.17 - i * 0.02} 0 0)`,
              boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.03)",
            } as CSSProperties}
          />
        ))}
        {badges.map((b) => {
          const { skip, vars } = orbitVars(b);
          return (
          <span
            key={b.label}
            className={`orbit-arm absolute left-1/2 top-1/2 ${skip ? "orbit-skip" : ""}`}
            style={{ "--a": `${b.start}deg`, "--dir": b.dir, "--rm": b.radius[0], "--rd": b.radius[1], ...vars } as CSSProperties}
          >
            <span className="absolute left-1/2 top-0 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center md:h-[54px] md:w-[54px]">
              <span className={`orbit-upright ${skip ? "orbit-skip-upright" : ""} grid h-full w-full place-items-center rounded-full border border-white/15 bg-[#141414] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_6px_14px_rgb(0_0_0/0.6)]`}>
                {b.icon}
              </span>
            </span>
          </span>
          );
        })}
      </div>
      {/* Fades the rings into the card edges, as in the reference. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#0a0a0a_0%,transparent_30%,transparent_70%,#0a0a0a_100%)] sm:block" />
    </div>
  );
}
