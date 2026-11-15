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
// stays empty. radius = % of the square (half a ring's size in `rings`), start = angle in degrees from the top,
// seconds = one lap, dir = direction. Each icon drifts along its ring from that starting spot.
const badges: { label: string; radius: number; start: number; seconds: number; dir: 1 | -1; icon: ReactNode }[] = [
  { label: "Figma", radius: 33, start: 7, seconds: 110, dir: 1, icon: img(figma) },
  { label: "ChatGPT", radius: 53, start: 75, seconds: 120, dir: -1, icon: img(gpt) },
  { label: "VS Code", radius: 23, start: 137, seconds: 110, dir: -1, icon: img(vscode) },
  { label: "Claude", radius: 43, start: 233, seconds: 100, dir: 1, icon: img(claude) },
  { label: "Spline", radius: 53, start: 292, seconds: 112, dir: 1, icon: img(spline, 34) },
];

// Ring diameters as % of the square. Neighbouring rings are 10% of the square apart, wider than an icon circle, so
// icons on adjacent rings never touch when they pass.
// The card shows about +-0.385 of the square vertically, so an icon on a ring wider than that goes out of sight at the
// top and bottom. Past HIDE_Y (just beyond where a badge is fully hidden) it skips the unseen stretch and comes back in
// on the opposite side, so it only ever travels the visible arcs. `k` is the half-angle of each hidden stretch.
const HIDE_Y = 0.44;
function orbitVars(b: (typeof badges)[number]) {
  const r = b.radius / 100;
  const k = r > HIDE_Y ? (Math.acos(HIDE_Y / r) * 180) / Math.PI : 0;
  if (!k) return { k: 0, vars: { "--a": `${b.start}deg`, "--d": `${b.seconds}s`, "--dir": b.dir } };
  const span = 180 - 2 * k; // visible arc, in degrees
  const a = ((b.start % 360) + 360) % 360;
  let f = a >= 180 ? 0.5 + (Math.min(Math.max(a, 180 + k), 360 - k) - 180 - k) / span / 2 : (Math.min(Math.max(a, k), 180 - k) - k) / span / 2;
  if (b.dir === -1) f = 1 - f; // reversed playback
  const d = (b.seconds * (360 - 4 * k)) / 360; // same angular speed on the visible arcs as the full lap
  return { k, vars: { "--k": `${k}deg`, "--d": `${d}s`, "--delay": `${-f * d}s`, "--ad": b.dir === 1 ? "normal" : "reverse" } };
}

const rings = [106, 86, 66, 46, 27];

export function ToolsOrbit() {
  return (
    <div
      role="img"
      aria-label="Design tools orbiting: Figma, ChatGPT, VS Code, Claude, Spline"
      className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-3xl border bg-[#0a0a0a] sm:aspect-[2.4/1]"
    >
      <div className="absolute left-1/2 top-1/2 aspect-square h-[130%] -translate-x-1/2 -translate-y-1/2">
        {rings.map((size, i) => (
          <span
            key={size}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: `${size}%`,
              height: `${size}%`,
              transform: "translate(-50%, -50%)",
              background: `oklch(${0.17 - i * 0.02} 0 0)`,
              boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.03)",
            }}
          />
        ))}
        {badges.map((b) => {
          const { k, vars } = orbitVars(b);
          return (
          <span
            key={b.label}
            className={`orbit-arm absolute left-1/2 top-1/2 ${k ? "orbit-skip" : ""}`}
            style={{ "--a": `${b.start}deg`, "--dir": b.dir, ...vars, width: `${b.radius * 2}%`, height: `${b.radius * 2}%` } as CSSProperties}
          >
            <span className="absolute left-1/2 top-0 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center md:h-[54px] md:w-[54px]">
              <span className={`orbit-upright ${k ? "orbit-skip-upright" : ""} grid h-full w-full place-items-center rounded-full border border-white/15 bg-[#141414] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_6px_14px_rgb(0_0_0/0.6)]`}>
                {b.icon}
              </span>
            </span>
          </span>
          );
        })}
      </div>
      {/* Fades the rings into the card edges, as in the reference. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#0a0a0a_0%,transparent_30%,transparent_70%,#0a0a0a_100%)]" />
    </div>
  );
}
