import { useLayoutEffect, useRef, useState } from "react";

type Point = [number, number];

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const add = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Point, s: number): Point => [a[0] * s, a[1] * s];
const len = (a: Point) => Math.hypot(a[0], a[1]);
const normalize = (a: Point): Point => {
  const l = len(a);
  return l === 0 ? [0, 0] : [a[0] / l, a[1] / l];
};

/** Builds an SVG path for a polygon with independently rounded corners, by
 * inserting a quadratic curve at each vertex between points inset toward
 * its two neighbours. Works for convex and concave vertices alike, which a
 * plain `border-radius` can't express for a shape like a folder tab. */
function roundedPolygonPath(points: Point[], radii: number[]): string {
  const n = points.length;
  const inset = (i: number) => {
    const prev = points[(i - 1 + n) % n]!;
    const v = points[i]!;
    const next = points[(i + 1) % n]!;
    const r = Math.min(radii[i]!, len(sub(prev, v)) / 2, len(sub(next, v)) / 2);
    const p1 = add(v, scale(normalize(sub(prev, v)), r));
    const p2 = add(v, scale(normalize(sub(next, v)), r));
    return { p1, p2, v };
  };

  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const { p1, p2, v } = inset(i);
    parts.push(i === 0 ? `M ${p1[0]} ${p1[1]}` : `L ${p1[0]} ${p1[1]}`);
    parts.push(`Q ${v[0]} ${v[1]} ${p2[0]} ${p2[1]}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

/** Outline of a manila-folder tab: a small raised tab at the top-left,
 * joined by a short diagonal to the main rounded-rectangle body below it. */
export function folderPath(w: number, h: number): string {
  if (w <= 0 || h <= 0) return "";
  const r = 12;
  const tr = 7;
  // Never narrower than ~150px: the step label ("PASSO 0X") sits inside
  // this tab, and on narrow mobile screens 34% of the box width alone
  // isn't enough room for it — the diagonal cut then clips off the number.
  const tw = Math.min(Math.max(w * 0.34, 150), 230, w - 20);
  const th = Math.min(Math.max(h * 0.34, 18), 32);
  const dx = th * 0.9;

  const points: Point[] = [
    [0, 0],
    [tw, 0],
    [tw + dx, th],
    [w, th],
    [w, h],
    [0, h],
  ];
  const radii = [r, tr, tr, r, 0, 0];
  return roundedPolygonPath(points, radii);
}

/** Tracks an element's rendered size (via ResizeObserver) so a folder path
 * can be recomputed to match, including while its CSS transition runs. */
export function useFolderSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}
