// Fixed scenes for the maker's screenshots. A `?shot=` query names the
// scene and its options, shots.json at the repository root lists the ones
// the screenshots in screenshots/ were taken from:
//   ?shot=cover   the cover alone, filling the window (body.shot-cover)
//   ?shot=editor  the editor with photos loaded and a panel selected
// Shared options: layout, grade, size, caption, sub, and photos — a comma
// list of sample ids, one per panel. window.__shotReady is set once the
// scene is painted, fonts included, so a screenshot never catches it half
// drawn.

export async function runShot(query, { state, SIZES, loadImage, redraw }) {
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size') && SIZES[query.get('size')]) state.size = query.get('size');
  if (query.get('caption') !== null) state.caption = query.get('caption');
  if (query.get('sub') !== null) state.subtitle = query.get('sub');

  const photos = (query.get('photos') ?? 'sunset-drive').split(',');
  for (let i = 0; i < photos.length && i < state.slots.length; i++) {
    state.slots[i].img = await loadImage(`samples/${photos[i]}.jpg`);
  }
  if (shot === 'editor') {
    state.selected = 0;
    document.getElementById('caption').value = state.caption;
    document.getElementById('subtitle').value = state.subtitle;
  }
  await document.fonts.load('700 90px "Cover Sans"');
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
