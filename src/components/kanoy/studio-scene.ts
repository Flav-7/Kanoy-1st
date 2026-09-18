/**
 * Single source of truth for the pinned studio walk-through: where each
 * floating screen sits, how far the camera travels, and how many viewport
 * heights of scroll that takes. StudioAndPortal (the scene itself) and
 * StudioBackdrop (the office photo behind it, which zooms with the same
 * scroll) both read from here, so changing the number of screens can never
 * leave one of them out of step with the other.
 */

/** Placement of a screen inside the studio volume. */
export type Placement = {
  x: number; // vw offset from centre
  y: number; // vh offset from centre
  z: number; // depth in px (larger = deeper in the room)
  w: number; // screen width in px
  rotY: number;
  rotX?: number;
  float?: number;
  device?: "monitor" | "panel" | "tablet";
};

/** One entry per portfolio project, in the same order as MINI_SITES. */
export const PLACEMENTS: Placement[] = [
  { x: -16, y: 1, z: 1700, w: 460, rotY: 26, device: "monitor" },
  { x: 17, y: -4, z: 2450, w: 420, rotY: -24, device: "panel", float: 1 },
  { x: -19, y: -7, z: 3200, w: 380, rotY: 22, device: "panel", float: -1 },
  { x: 15, y: 5, z: 3950, w: 480, rotY: -20, device: "monitor" },
  { x: -13, y: 6, z: 4700, w: 320, rotY: 18, device: "tablet", float: 1 },
];

/** Distance between consecutive screens, and the run-out past the last one. */
const SCREEN_GAP = 750;

/** The camera travels until it is one gap past the last screen. */
export const CAMERA_TRAVEL = PLACEMENTS[PLACEMENTS.length - 1]!.z + SCREEN_GAP;

// Scroll speed: 9200px of camera travel used to take 760vh of scroll. That
// ratio is kept fixed so each screen still takes the same amount of scrolling
// to pass, however many screens there are.
const VH_PER_CAMERA_PX = 760 / 9200;

/** Height of the pinned section, in vh — also the backdrop's scroll range. */
export const STUDIO_VH = Math.round(CAMERA_TRAVEL * VH_PER_CAMERA_PX);

/** Converts a distance scrolled into the pin (in vh) to 0..1 scene progress. */
export const vhToProgress = (vh: number) => vh / STUDIO_VH;
