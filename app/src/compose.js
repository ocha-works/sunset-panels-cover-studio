// The cover renderer: draws a whole cover onto a 2D context at any size.
// A cover is a stack of layers, back to front:
//   1. each panel's photo (or a drawn placeholder scene), clipped to the
//      panel's polygon, with the grade's filter and overlay wash;
//   2. white keylines along every seam and around the frame;
//   3. a soft vignette so the lettering sits on a darker foot;
//   4. the subtitle on its slanted banner, then the caption in big condensed
//      capitals with a dark outline and a gradient fill.
// Everything is drawn from the state object main.js keeps; this file holds
// no state of its own, so the preview and the PNG export draw identically.

import { GRADES } from './grades.js';
import { panelsFor } from './layouts.js';

export const TITLE_FONT = '"Cover Sans", "Arial Narrow Bold", sans-serif';

/** Traces a unit-space polygon on ctx, scaled to the canvas size. */
function tracePanel(ctx, polygon, w, h) {
  ctx.beginPath();
  polygon.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * w, y * h);
    else ctx.lineTo(x * w, y * h);
  });
  ctx.closePath();
}

/** The axis-aligned box a polygon covers, in unit space. */
function panelBox(polygon) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const [x, y] of polygon) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Draws an image so it covers the box (in pixels), scaled by `zoom` and
 * shifted by the panel's pan offsets (-0.5..0.5 of the overflow each way).
 */
function drawPhotoCover(ctx, img, box, slot) {
  const bw = box.maxX - box.minX;
  const bh = box.maxY - box.minY;
  const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight) * (slot.zoom ?? 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = box.minX + (bw - dw) / 2 + (slot.ox ?? 0) * Math.max(0, dw - bw);
  const dy = box.minY + (bh - dh) / 2 + (slot.oy ?? 0) * Math.max(0, dh - bh);
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** A palm silhouette: a curved trunk and six drooping fronds, drawn in ink. */
function drawPalm(ctx, x, y, s, ink) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.055;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.3, y - s * 0.86);
  ctx.stroke();
  const [tx, ty] = [x + s * 0.3, y - s * 0.86];
  for (const a of [-2.9, -2.35, -1.8, -1.25, -0.7, -0.15]) {
    ctx.lineWidth = s * 0.04;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(
      tx + Math.cos(a) * s * 0.34, ty + Math.sin(a) * s * 0.3 - s * 0.1,
      tx + Math.cos(a) * s * 0.52, ty + Math.sin(a) * s * 0.42 + s * 0.16,
    );
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * The scene a panel shows before a photo is loaded: a grade-coloured sky, a
 * low sun, a sea band and palm silhouettes, so an empty cover still reads
 * as a poster and invites a photo.
 */
function drawPlaceholder(ctx, box, grade, w) {
  const bw = box.maxX - box.minX;
  const bh = box.maxY - box.minY;
  const sky = ctx.createLinearGradient(0, box.minY, 0, box.maxY);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(box.minX, box.minY, bw, bh);
  const sunR = bh * 0.2;
  ctx.fillStyle = 'rgba(255, 236, 190, 0.9)';
  ctx.beginPath();
  ctx.arc(box.minX + bw * 0.68, box.minY + bh * 0.52, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = grade.sea;
  ctx.fillRect(box.minX, box.minY + bh * 0.66, bw, bh * 0.34);
  drawPalm(ctx, box.minX + bw * 0.16, box.minY + bh * 0.98, bh * 0.62, 'rgba(8, 2, 18, 0.85)');
  drawPalm(ctx, box.minX + bw * 0.94, box.minY + bh * 0.99, bh * 0.45, 'rgba(8, 2, 18, 0.7)');
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `700 ${Math.max(13, w * 0.016)}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD A PHOTO', box.minX + bw / 2, box.minY + bh * 0.3);
}

/** Lays the grade's overlay gradient over one panel's box. */
function washPanel(ctx, box, grade) {
  const g = ctx.createLinearGradient(0, box.minY, 0, box.maxY);
  g.addColorStop(0, grade.overlay[0]);
  g.addColorStop(0.55, grade.overlay[1]);
  g.addColorStop(1, grade.overlay[2]);
  ctx.fillStyle = g;
  ctx.fillRect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);
}

/** Fits the caption into maxWidth by shrinking its font size. */
function fitFontSize(ctx, text, maxWidth, start) {
  let size = start;
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size *= 0.94;
    ctx.font = `700 ${size}px ${TITLE_FONT}`;
  }
  return size;
}

/** The subtitle's slanted banner, drawn centred at (cx, cy). */
function drawSubtitle(ctx, text, cx, cy, w, grade) {
  const label = text.trim().toUpperCase();
  if (!label) return;
  const size = Math.max(14, w * 0.021);
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  try { ctx.letterSpacing = `${size * 0.32}px`; } catch { /* older engines */ }
  const tw = ctx.measureText(label).width + size * 0.32 * label.length;
  const bw = tw + size * 1.7;
  const bh = size * 2.05;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, 0, -0.18, 1, 0, 0);
  ctx.fillStyle = grade.banner;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = size * 0.5;
  ctx.shadowOffsetY = size * 0.16;
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, size * 0.16, size * 0.06);
  ctx.restore();
  try { ctx.letterSpacing = '0px'; } catch { /* older engines */ }
}

/** The caption: condensed capitals, dark outline, grade gradient fill. */
function drawCaption(ctx, text, w, h, grade, inkStops) {
  const label = text.trim().toUpperCase();
  if (!label) return;
  const stops = inkStops ?? grade.title;
  ctx.save();
  ctx.translate(w / 2, 0);
  ctx.transform(0.86, 0, 0, 1, 0, 0);
  const size = fitFontSize(ctx, label, (w * 0.94) / 0.86, h * 0.155);
  ctx.font = `700 ${size}px ${TITLE_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const y = h - h * 0.055;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#180826';
  ctx.lineWidth = size * 0.17;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.22;
  ctx.shadowOffsetY = size * 0.07;
  ctx.strokeText(label, 0, y);
  ctx.shadowColor = 'transparent';
  const fill = ctx.createLinearGradient(0, y - size, 0, y);
  fill.addColorStop(0, stops[0]);
  fill.addColorStop(0.55, stops[1]);
  fill.addColorStop(1, stops[2]);
  ctx.fillStyle = fill;
  ctx.fillText(label, 0, y);
  ctx.restore();
}

/**
 * Draws the cover described by `state` onto ctx at w x h pixels.
 * state: { layout, grade, caption, subtitle, ink, slots } where slots[i]
 * is { img, zoom, ox, oy } for panel i (img an Image or null).
 */
export function renderCover(ctx, w, h, state) {
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const polygons = panelsFor(state.layout, w / h);
  ctx.fillStyle = '#150722';
  ctx.fillRect(0, 0, w, h);

  polygons.forEach((polygon, i) => {
    const slot = state.slots[i] ?? {};
    const unit = panelBox(polygon);
    const box = {
      minX: unit.minX * w, minY: unit.minY * h,
      maxX: unit.maxX * w, maxY: unit.maxY * h,
    };
    ctx.save();
    tracePanel(ctx, polygon, w, h);
    ctx.clip();
    if (slot.img) {
      ctx.filter = grade.filter;
      drawPhotoCover(ctx, slot.img, box, slot);
      ctx.filter = 'none';
    } else {
      drawPlaceholder(ctx, box, grade, w);
    }
    washPanel(ctx, box, grade);
    ctx.restore();
  });

  // Keylines: a white seam over every panel edge, then the frame.
  const seam = Math.max(5, w * 0.0055);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = seam;
  ctx.lineJoin = 'round';
  for (const polygon of polygons) {
    tracePanel(ctx, polygon, w, h);
    ctx.stroke();
  }
  ctx.strokeStyle = '#180826';
  ctx.lineWidth = seam * 0.45;
  ctx.strokeRect(seam * 0.2, seam * 0.2, w - seam * 0.4, h - seam * 0.4);

  // Vignette to seat the lettering.
  const vig = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.3, w / 2, h * 0.55, h * 1.05);
  vig.addColorStop(0, 'rgba(10, 0, 22, 0)');
  vig.addColorStop(1, 'rgba(10, 0, 22, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawSubtitle(ctx, state.subtitle ?? '', w / 2, h * 0.8, w, grade);
  drawCaption(ctx, state.caption ?? '', w, h, grade, state.ink);
}
