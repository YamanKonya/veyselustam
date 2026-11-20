/**
 * Where a ring sits on a detected hand. Input is MediaPipe's 21 hand landmarks
 * (x, y between 0 and 1 of the picture); output is in picture pixels.
 */
export type FingerId = "index" | "middle" | "ring" | "pinky";
export interface Point {
  x: number;
  y: number;
}
export interface RingPlacement {
  cx: number;
  cy: number;
  /** rotation for the ring picture (radians): its top points toward the fingertip */
  angle: number;
  /** estimated width of that finger in pixels */
  fingerWidth: number;
}

// knuckle (MCP) and first joint (PIP) of each finger
const JOINTS: Record<FingerId, [number, number]> = {
  index: [5, 6],
  middle: [9, 10],
  ring: [13, 14],
  pinky: [17, 18],
};
// neighbouring knuckles: their spacing is close to the finger's own width
const NEIGHBOURS: Record<FingerId, [number, number][]> = {
  index: [[5, 9]],
  middle: [[5, 9], [9, 13]],
  ring: [[9, 13], [13, 17]],
  pinky: [[13, 17]],
};
const WIDTH_FACTOR: Record<FingerId, number> = { index: 0.82, middle: 0.82, ring: 0.82, pinky: 0.7 };
/** how far from the knuckle toward the first joint the ring sits */
const ALONG = 0.42;

export const FINGERS: FingerId[] = ["index", "middle", "ring", "pinky"];

export function placeRing(landmarks: Point[], width: number, height: number, finger: FingerId): RingPlacement | null {
  if (!landmarks || landmarks.length < 21) return null;
  const px = (i: number) => ({ x: landmarks[i].x * width, y: landmarks[i].y * height });
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const [mcpI, pipI] = JOINTS[finger];
  const mcp = px(mcpI);
  const pip = px(pipI);
  const gaps = NEIGHBOURS[finger].map(([a, b]) => dist(px(a), px(b)));
  const fingerWidth = (gaps.reduce((n, g) => n + g, 0) / gaps.length) * WIDTH_FACTOR[finger];
  return {
    cx: mcp.x + (pip.x - mcp.x) * ALONG,
    cy: mcp.y + (pip.y - mcp.y) * ALONG,
    angle: Math.atan2(pip.y - mcp.y, pip.x - mcp.x) + Math.PI / 2,
    fingerWidth,
  };
}
