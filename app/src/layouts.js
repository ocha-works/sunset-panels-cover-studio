// Panel layouts for the cover maker. Every layout is a function of the canvas
// aspect ratio (width / height) and returns a list of panels; each panel is a
// polygon of [x, y] points in unit space (0..1 across, 0..1 down). The
// renderer clips the panel's photo to its polygon, so the slanted seams are
// the whole trick: neighbouring panels share an edge, and the keyline stroke
// drawn over the seams gives the multi-panel poster look.

/** Slant of the diagonal seams, in unit x, kept gentler on tall canvases. */
function slantFor(aspect) {
  return Math.min(0.2, 0.11 + 0.05 * aspect);
}

/** Three tall panels cut by two parallel diagonal seams. */
function diagonalTrio(aspect) {
  const s = slantFor(aspect);
  return [
    [[0, 0], [0.46, 0], [0.46 - s, 1], [0, 1]],
    [[0.46, 0], [0.74, 0], [0.74 - s, 1], [0.46 - s, 1]],
    [[0.74, 0], [1, 0], [1, 1], [0.74 - s, 1]],
  ];
}

/** Four panels: a two-by-two grid whose seams lean like a opened comic page. */
function gridStory(aspect) {
  const s = slantFor(aspect) * 0.7;
  const midY = 0.54;
  return [
    [[0, 0], [0.58, 0], [0.58 - s, midY], [0, midY]],
    [[0.58, 0], [1, 0], [1, midY], [0.58 - s, midY]],
    [[0, midY], [0.58 - s, midY], [0.58 - 2 * s, 1], [0, 1]],
    [[0.58 - s, midY], [1, midY], [1, 1], [0.58 - 2 * s, 1]],
  ];
}

/** One wide hero panel on top, three strips fanned beneath it. */
function heroStrips(aspect) {
  const s = slantFor(aspect) * 0.5;
  const seam = 0.62;
  return [
    [[0, 0], [1, 0], [1, seam - 0.03], [0, seam + 0.03]],
    [[0, seam + 0.03], [0.37, seam + 0.005], [0.37 - s, 1], [0, 1]],
    [[0.37, seam + 0.005], [0.69, seam - 0.015], [0.69 - s, 1], [0.37 - s, 1]],
    [[0.69, seam - 0.015], [1, seam - 0.03], [1, 1], [0.69 - s, 1]],
  ];
}

export const LAYOUTS = {
  diagonal: { label: 'Diagonal Trio', build: diagonalTrio },
  grid: { label: 'Grid Story', build: gridStory },
  hero: { label: 'Hero & Strips', build: heroStrips },
};

/** Builds the panel polygons for a layout id at a canvas aspect ratio. */
export function panelsFor(layoutId, aspect) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.diagonal;
  return layout.build(aspect);
}

/** True when the unit-space point (x, y) falls inside the polygon. */
export function pointInPanel(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
