// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, filling the viewport.
// Extra query params preset the scene: photo / photo2 pick the samples
// (samples/<name>.jpg), layout, grade and size pick the state, caption and
// tagline set the words, p0..p3 pick each panel's photo (0, 1 or 2) and
// z0..z3, x0..x3, y0..y3 set each panel's zoom and pan.
// window.__shotReady is set once the scene is painted.

import { EXPORT_SIZES, GRADES, LAYOUTS, drawCover } from './render.js';

function loadSample(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`no sample ${name}`));
    img.src = `samples/${name}.jpg`;
  });
}

function syncControls(state) {
  const caption = document.getElementById('caption');
  const tagline = document.getElementById('tagline');
  if (caption) caption.value = state.caption;
  if (tagline) tagline.value = state.tagline;
  const gradeName = document.getElementById('grade-name');
  if (gradeName && GRADES[state.grade]) gradeName.textContent = GRADES[state.grade].name;
  [['layout-pick', state.layout], ['grade-pick', state.grade], ['size-pick', state.size]].forEach(
    ([id, value]) => {
      const box = document.getElementById(id);
      if (!box) return;
      box.querySelectorAll('button').forEach((button) => {
        button.classList.toggle('active', button.dataset.value === value);
      });
    },
  );
  const photoA = document.getElementById('photo-a-name');
  if (photoA && state.photos[0]) photoA.textContent = 'pier.jpg (sample)';
  const photoB = document.getElementById('photo-b-name');
  if (photoB && state.photos[1]) photoB.textContent = 'boulevard.jpg (sample)';
}

export async function runShot(shot, query, state, redraw, ensureFonts) {
  const layout = query.get('layout');
  if (layout && LAYOUTS[layout]) state.layout = layout;
  const grade = query.get('grade');
  if (grade && GRADES[grade]) state.grade = grade;
  const size = query.get('size');
  if (size && EXPORT_SIZES[size]) state.size = size;
  const caption = query.get('caption');
  if (caption !== null) state.caption = caption;
  const tagline = query.get('tagline');
  if (tagline !== null) state.tagline = tagline;

  const first = query.get('photo') || 'pier';
  const second = query.get('photo2');
  try {
    state.photos[0] = await loadSample(first);
    if (second) state.photos[1] = await loadSample(second);
  } catch (err) {
    // The scene still renders with placeholders.
  }
  for (let i = 0; i < 4; i += 1) {
    const pick = query.get(`p${i}`);
    if (pick !== null) state.panels[i].photo = Number(pick);
    const zoom = query.get(`z${i}`);
    if (zoom !== null) state.panels[i].zoom = Number(zoom);
    const ox = query.get(`x${i}`);
    if (ox !== null) state.panels[i].ox = Number(ox);
    const oy = query.get(`y${i}`);
    if (oy !== null) state.panels[i].oy = Number(oy);
  }

  await ensureFonts();
  syncControls(state);

  const canvas = document.getElementById('preview');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Draw at the viewport's own size so the screenshot is 1:1 crisp.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCover(canvas, state);
  } else {
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
