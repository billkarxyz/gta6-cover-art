// Vice Cover Studio — editor wiring.
//
// Owns the page state (layout, grade, size, caption, photos, per-panel
// crop), binds every control, and re-renders the preview canvas. Photos
// are read from the user's machine with FileReader/object URLs and never
// leave the browser. A `?shot=` query switches to a fixed screenshot scene
// (see shots.js) instead of the interactive editor.

import { EXPORT_SIZES, GRADES, LAYOUTS, drawCover, panelAt } from './render.js';
import { runShot } from './shots.js';

const PREVIEW_LONG = 720;

const state = {
  layout: 'hero',
  grade: 'sunset',
  size: 'wide',
  caption: 'Sunset Heist',
  tagline: 'Neon After Dark',
  photos: [null, null, null],
  panels: [
    { photo: 0, zoom: 1, ox: 0.5, oy: 0.5 },
    { photo: 0, zoom: 1, ox: 0.5, oy: 0.5 },
    { photo: 0, zoom: 1, ox: 0.5, oy: 0.5 },
    { photo: 0, zoom: 1, ox: 0.5, oy: 0.5 },
  ],
};

let selectedPanel = 0;
let fontsDone = false;

const canvas = document.getElementById('preview');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panel-label');
const photoChoice = document.getElementById('panel-photo');
const zoomRange = document.getElementById('panel-zoom');
const xRange = document.getElementById('panel-x');
const yRange = document.getElementById('panel-y');

function previewSize() {
  const size = EXPORT_SIZES[state.size];
  const scale = PREVIEW_LONG / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state, selectedPanel);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not read that image'));
    img.src = url;
  });
}

function loadImageUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function refreshPanelControls() {
  const layout = LAYOUTS[state.layout];
  const count = layout.panels.length;
  if (selectedPanel >= count) selectedPanel = 0;
  const slot = state.panels[selectedPanel];
  panelLabel.textContent = `Panel ${selectedPanel + 1} of ${count} — ${layout.name}`;
  photoChoice.value = String(slot.photo);
  zoomRange.value = String(slot.zoom);
  xRange.value = String(slot.ox);
  yRange.value = String(slot.oy);
  document.getElementById('zoom-value').textContent = `${Math.round(slot.zoom * 100)}%`;
}

function markActive(containerId, value) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('active', button.dataset.value === value);
  });
}

function buildPickers() {
  const layoutBox = document.getElementById('layout-pick');
  Object.entries(LAYOUTS).forEach(([id, layout]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = id;
    button.textContent = layout.name;
    button.addEventListener('click', () => {
      state.layout = id;
      markActive('layout-pick', id);
      refreshPanelControls();
      redraw();
    });
    layoutBox.appendChild(button);
  });

  const gradeBox = document.getElementById('grade-pick');
  Object.entries(GRADES).forEach(([id, grade]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = id;
    button.className = 'swatch';
    button.title = grade.name;
    button.setAttribute('aria-label', grade.name);
    button.style.background = `linear-gradient(135deg, ${grade.washTop}, ${grade.washBottom}), #241a2e`;
    button.addEventListener('click', () => {
      state.grade = id;
      markActive('grade-pick', id);
      document.getElementById('grade-name').textContent = grade.name;
      redraw();
    });
    gradeBox.appendChild(button);
  });

  const sizeBox = document.getElementById('size-pick');
  Object.entries(EXPORT_SIZES).forEach(([id, size]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = id;
    button.textContent = size.label;
    button.addEventListener('click', () => {
      state.size = id;
      markActive('size-pick', id);
      redraw();
    });
    sizeBox.appendChild(button);
  });

  markActive('layout-pick', state.layout);
  markActive('grade-pick', state.grade);
  markActive('size-pick', state.size);
  document.getElementById('grade-name').textContent = GRADES[state.grade].name;
}

function bindControls() {
  ['photo-a', 'photo-b', 'photo-c'].forEach((id, i) => {
    document.getElementById(id).addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        state.photos[i] = await loadImageFile(file);
        document.getElementById(`photo-${'abc'[i]}-name`).textContent = file.name;
        setStatus(`Photo ${'ABC'[i]} loaded.`);
        redraw();
      } catch (err) {
        setStatus(`That photo could not be read. Try a JPG or PNG.`);
      }
    });
  });

  document.getElementById('samples').addEventListener('click', async () => {
    try {
      const [pier, boulevard] = await Promise.all([
        loadImageUrl('samples/pier.jpg'),
        loadImageUrl('samples/boulevard.jpg'),
      ]);
      state.photos[0] = pier;
      state.photos[1] = boulevard;
      document.getElementById('photo-a-name').textContent = 'pier.jpg (sample)';
      document.getElementById('photo-b-name').textContent = 'boulevard.jpg (sample)';
      setStatus('Sample photos loaded into A and B.');
      redraw();
    } catch (err) {
      setStatus('The sample photos could not be loaded.');
    }
  });

  document.getElementById('caption').addEventListener('input', (event) => {
    state.caption = event.target.value;
    redraw();
  });
  document.getElementById('tagline').addEventListener('input', (event) => {
    state.tagline = event.target.value;
    redraw();
  });

  photoChoice.addEventListener('change', () => {
    state.panels[selectedPanel].photo = Number(photoChoice.value);
    redraw();
  });
  zoomRange.addEventListener('input', () => {
    state.panels[selectedPanel].zoom = Number(zoomRange.value);
    document.getElementById('zoom-value').textContent = `${Math.round(Number(zoomRange.value) * 100)}%`;
    redraw();
  });
  xRange.addEventListener('input', () => {
    state.panels[selectedPanel].ox = Number(xRange.value);
    redraw();
  });
  yRange.addEventListener('input', () => {
    state.panels[selectedPanel].oy = Number(yRange.value);
    redraw();
  });

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const rx = (event.clientX - rect.left) / rect.width;
    const ry = (event.clientY - rect.top) / rect.height;
    const hit = panelAt(state.layout, rx, ry);
    if (hit >= 0) {
      selectedPanel = hit;
      refreshPanelControls();
      redraw();
    }
  });

  document.getElementById('export').addEventListener('click', () => {
    const size = EXPORT_SIZES[state.size];
    const out = document.createElement('canvas');
    out.width = size.w;
    out.height = size.h;
    drawCover(out, state);
    out.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — try again.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Saved vice-cover-${size.w}x${size.h}.png`);
    }, 'image/png');
  });
}

async function ensureFonts() {
  if (fontsDone) return;
  try {
    await document.fonts.load('100px Anton');
    await document.fonts.ready;
  } catch (err) {
    // The canvas falls back to sans-serif; the cover still draws.
  }
  fontsDone = true;
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
// The editor UI is always built (the editor screenshot shows it); a shot
// query only presets a fixed scene on top of it.
buildPickers();
bindControls();
refreshPanelControls();
if (shot) {
  runShot(shot, query, state, redraw, ensureFonts);
} else {
  redraw();
  ensureFonts().then(redraw);
}
