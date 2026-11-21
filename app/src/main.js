// Sunset Panels: the editor's wiring. It keeps one state object — the post
// size, the panel layout, the colour grade, the caption and subtitle, and
// one slot per panel holding its photo and how that photo is framed — and
// re-renders the preview from compose.js whenever anything changes. Photos
// are read from the visitor's own machine with FileReader and object URLs;
// nothing is uploaded anywhere, and the app makes no network request.

import { renderCover } from './compose.js';
import { panelsFor, pointInPanel } from './layouts.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square post · 1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait post · 1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide cover · 1920 × 1080' },
};

export const SAMPLES = [
  { id: 'sunset-drive', name: 'Sunset Drive' },
  { id: 'boulevard', name: 'Boulevard' },
  { id: 'pier', name: 'The Pier' },
];

const INKS = {
  grade: null,
  white: ['#ffffff', '#f4f4f8', '#c9c9d6'],
  gold: ['#fffbe8', '#ffe08a', '#ff9a3d'],
  candy: ['#ffffff', '#ffb3d9', '#ff2e88'],
};

export const state = {
  size: '1920x1080',
  layout: 'diagonal',
  grade: 'sunset',
  caption: 'Vice Heat',
  subtitle: 'One last ride on the sunset strip',
  ink: INKS.grade,
  slots: [0, 1, 2, 3].map(() => ({ img: null, zoom: 1, ox: 0, oy: 0 })),
  selected: 0,
};

const canvas = document.getElementById('stage');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const panelName = document.getElementById('panel-name');

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The panel polygons of the current layout at the current size. */
export function currentPanels() {
  const { w, h } = SIZES[state.size];
  return panelsFor(state.layout, w / h);
}

/** Re-renders the preview canvas from the state. */
export function redraw() {
  const { w, h } = SIZES[state.size];
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  renderCover(canvas.getContext('2d'), w, h, state);
  syncPanelControls();
}

/** Shows the selected panel's framing values in its sliders. */
function syncPanelControls() {
  const slot = state.slots[state.selected];
  panelName.textContent = `Panel ${state.selected + 1}`;
  zoomInput.value = String(Math.round((slot.zoom ?? 1) * 100));
  panXInput.value = String(Math.round((slot.ox ?? 0) * 100));
  panYInput.value = String(Math.round((slot.oy ?? 0) * 100));
}

/** Puts an image into the selected panel (or into every panel). */
export function assignPhoto(img, all = false) {
  if (all) {
    for (const slot of state.slots) if (!slot.img) slot.img = img;
    state.slots[0].img = img;
  } else {
    state.slots[state.selected].img = img;
  }
  redraw();
}

/** Marks one of the segmented button groups as chosen and stores it. */
function wireGroup(id, apply) {
  const group = document.getElementById(id);
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (!btn) return;
    group.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
    apply(btn.dataset.value);
    redraw();
  });
}

wireGroup('sizes', (v) => { state.size = v; });
wireGroup('layouts', (v) => { state.layout = v; });
wireGroup('grades', (v) => { state.grade = v; });
wireGroup('inks', (v) => { state.ink = INKS[v]; });

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  assignPhoto(img);
  status.textContent = `${file.name} is in panel ${state.selected + 1}. It never leaves your machine.`;
});

document.getElementById('samples').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-sample]');
  if (!btn) return;
  const img = await loadImage(`samples/${btn.dataset.sample}.jpg`);
  assignPhoto(img);
  status.textContent = `Sample photo in panel ${state.selected + 1}.`;
});

document.getElementById('fill-all').addEventListener('click', async () => {
  const any = state.slots.find((s) => s.img)?.img
    ?? (await loadImage('samples/sunset-drive.jpg'));
  for (const slot of state.slots) slot.img = any;
  redraw();
  status.textContent = 'One photo now fills every panel — swap any panel with your own.';
});

zoomInput.addEventListener('input', () => {
  state.slots[state.selected].zoom = Number(zoomInput.value) / 100;
  redraw();
});
panXInput.addEventListener('input', () => {
  state.slots[state.selected].ox = Number(panXInput.value) / 100;
  redraw();
});
panYInput.addEventListener('input', () => {
  state.slots[state.selected].oy = Number(panYInput.value) / 100;
  redraw();
});

// Clicking the preview selects the panel under the pointer; dragging pans
// the selected panel's photo inside its frame.
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const panels = currentPanels();
  const hit = panels.findIndex((p) => pointInPanel(p, x, y));
  if (hit >= 0) state.selected = hit;
  drag = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const slot = state.slots[state.selected];
  slot.ox = Math.max(-0.5, Math.min(0.5, (slot.ox ?? 0) + (e.clientX - drag.x) / rect.width * 1.6));
  slot.oy = Math.max(-0.5, Math.min(0.5, (slot.oy ?? 0) + (e.clientY - drag.y) / rect.height * 1.6));
  drag = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

document.getElementById('export').addEventListener('click', () => {
  const { w, h } = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  renderCover(out.getContext('2d'), w, h, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sunset-panels-${state.size}.png`;
    a.click();
    status.textContent = `Saved sunset-panels-${state.size}.png — post it anywhere.`;
  }, 'image/png');
});

// A ?shot= query builds a fixed scene for the maker's screenshots instead
// of the empty editor; otherwise open with the hero sample already placed
// so the first thing a visitor sees is a finished-looking cover.
const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query, { state, SIZES, loadImage, redraw });
} else {
  (async () => {
    await document.fonts.load('700 90px "Cover Sans"');
    state.slots[0].img = await loadImage('samples/sunset-drive.jpg');
    redraw();
  })();
}
