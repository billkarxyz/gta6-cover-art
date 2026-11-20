// Vice Cover Studio — cover renderer.
//
// Draws a GTA-style multi-panel poster on any 2D canvas at any size. Every
// layout is defined in relative coordinates (0..1 of the canvas), so the
// same state renders a small live preview and a full-size export
// identically. No assets are needed to draw: the sun and the palm trees
// are vector shapes drawn in code, and the only font is Anton (SIL OFL),
// shipped as a file under app/fonts/.

export const EXPORT_SIZES = {
  square: { label: '1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 x 1350', w: 1080, h: 1350 },
  wide: { label: '1920 x 1080', w: 1920, h: 1080 },
};

// A panel is either a rectangle {x, y, w, h} or a polygon {poly: [[x, y], …]},
// all in relative units. `band` is the caption band (relative rect) or null
// when the caption floats over the art. `sun` and `palm` place the vector
// decorations; `captionAt` is where the caption text anchors ('band' | 'top').
export const LAYOUTS = {
  hero: {
    name: 'Hero Split',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.82 },
      { x: 0.64, y: 0.0, w: 0.36, h: 0.4 },
      { x: 0.64, y: 0.42, w: 0.36, h: 0.4 },
    ],
    band: { x: 0.0, y: 0.84, w: 1.0, h: 0.16 },
    captionAt: 'band',
    sun: { x: 0.93, y: 0.92, r: 0.05 },
    palm: { x: 0.03, y: 0.8, s: 0.16 },
  },
  triple: {
    name: 'Triple Deck',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.27 },
      { x: 0.0, y: 0.29, w: 1.0, h: 0.27 },
      { x: 0.0, y: 0.58, w: 1.0, h: 0.24 },
    ],
    band: { x: 0.0, y: 0.84, w: 1.0, h: 0.16 },
    captionAt: 'band',
    sun: { x: 0.9, y: 0.92, r: 0.05 },
    palm: null,
  },
  grid: {
    name: 'Comic Grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.49, h: 0.4 },
      { x: 0.51, y: 0.0, w: 0.49, h: 0.4 },
      { x: 0.0, y: 0.42, w: 0.49, h: 0.4 },
      { x: 0.51, y: 0.42, w: 0.49, h: 0.4 },
    ],
    band: { x: 0.0, y: 0.84, w: 1.0, h: 0.16 },
    captionAt: 'band',
    sun: { x: 0.93, y: 0.92, r: 0.05 },
    palm: null,
  },
  slash: {
    name: 'Neon Slash',
    panels: [
      { poly: [[0, 0], [1, 0], [0.42, 0.82], [0, 0.82]] },
      { poly: [[0.58, 0], [1, 0], [1, 0.82], [0.42, 0.82]] },
    ],
    band: { x: 0.0, y: 0.84, w: 1.0, h: 0.16 },
    captionAt: 'band',
    sun: { x: 0.9, y: 0.92, r: 0.05 },
    palm: { x: 0.04, y: 0.8, s: 0.15 },
  },
  spotlight: {
    name: 'Spotlight',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 1.0 },
      { x: 0.6, y: 0.56, w: 0.36, h: 0.38 },
    ],
    band: null,
    captionAt: 'top',
    sun: null,
    palm: { x: 0.05, y: 0.96, s: 0.2 },
  },
};

// A grade is a colour wash drawn over the finished panels plus the colours
// of the caption band, the lettering and the accent bar.
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    washTop: 'rgba(255, 110, 40, 0.30)',
    washBottom: 'rgba(220, 30, 120, 0.36)',
    band: '#180a20',
    caption: '#ffffff',
    accent: '#ffb020',
  },
  neon: {
    name: 'Neon Nights',
    washTop: 'rgba(0, 220, 255, 0.24)',
    washBottom: 'rgba(255, 45, 170, 0.32)',
    band: '#0a0a26',
    caption: '#ffffff',
    accent: '#00e5ff',
  },
  gold: {
    name: 'Golden Hour',
    washTop: 'rgba(255, 190, 60, 0.32)',
    washBottom: 'rgba(255, 120, 20, 0.24)',
    band: '#1d1206',
    caption: '#fff7e0',
    accent: '#ffd23f',
  },
  midnight: {
    name: 'Midnight Drive',
    washTop: 'rgba(40, 80, 255, 0.26)',
    washBottom: 'rgba(120, 20, 180, 0.38)',
    band: '#070714',
    caption: '#eaf2ff',
    accent: '#7fb2ff',
  },
  palm: {
    name: 'Retro Palm',
    washTop: 'rgba(0, 200, 170, 0.26)',
    washBottom: 'rgba(160, 220, 60, 0.24)',
    band: '#06231a',
    caption: '#f2fff8',
    accent: '#7dffb0',
  },
};

function panelRect(panel, w, h) {
  if (panel.poly) {
    const xs = panel.poly.map((p) => p[0]);
    const ys = panel.poly.map((p) => p[1]);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    return {
      x: x0 * w,
      y: y0 * h,
      w: (Math.max(...xs) - x0) * w,
      h: (Math.max(...ys) - y0) * h,
    };
  }
  return { x: panel.x * w, y: panel.y * h, w: panel.w * w, h: panel.h * h };
}

function clipPanel(ctx, panel, w, h) {
  ctx.beginPath();
  if (panel.poly) {
    panel.poly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px * w, py * h);
      else ctx.lineTo(px * w, py * h);
    });
    ctx.closePath();
  } else {
    ctx.rect(panel.x * w, panel.y * h, panel.w * w, panel.h * h);
  }
  ctx.clip();
}

function strokePanel(ctx, panel, w, h, lineWidth, color) {
  ctx.beginPath();
  if (panel.poly) {
    panel.poly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px * w, py * h);
      else ctx.lineTo(px * w, py * h);
    });
    ctx.closePath();
  } else {
    ctx.rect(panel.x * w, panel.y * h, panel.w * w, panel.h * h);
  }
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// Cover-fits `img` into rect (px, py, pw, ph) with a zoom factor and a pan
// point (ox, oy in 0..1: 0.5 is centred). With zoom >= 1 the image always
// covers the rect, so the pan never shows a gap.
function drawPhotoInto(ctx, img, px, py, pw, ph, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = px + (pw - dw) * ox;
  const dy = py + (ph - dh) * oy;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawPlaceholder(ctx, px, py, pw, ph, label) {
  const g = ctx.createLinearGradient(px, py, px, py + ph);
  g.addColorStop(0, '#3a2b4d');
  g.addColorStop(1, '#1a1030');
  ctx.fillStyle = g;
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `${Math.max(14, ph * 0.09)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, px + pw / 2, py + ph / 2);
  ctx.textBaseline = 'alphabetic';
}

// A synthwave sun: a yellow-to-pink disc with horizontal slits that widen
// towards the bottom. Drawn on a scratch canvas so the slits erase only
// the sun, never the photo underneath.
function drawSun(ctx, cx, cy, r) {
  const size = Math.ceil(r * 2 + 4);
  const scratch = document.createElement('canvas');
  scratch.width = size;
  scratch.height = size;
  const s = scratch.getContext('2d');
  const g = s.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#ffd319');
  g.addColorStop(0.55, '#ff7a3d');
  g.addColorStop(1, '#ff2975');
  s.fillStyle = g;
  s.beginPath();
  s.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  s.fill();
  s.globalCompositeOperation = 'destination-out';
  let y = size * 0.52;
  let gap = size * 0.02;
  while (y < size) {
    s.fillRect(0, y, size, gap);
    y += gap + size * 0.09;
    gap *= 1.7;
  }
  ctx.drawImage(scratch, cx - size / 2, cy - size / 2);
}

// A palm silhouette: a curved trunk and seven drooping fronds, drawn as
// filled paths. Original vector art, no asset.
function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Trunk: a tapering curve leaning right.
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.quadraticCurveTo(-2, -60, 14, -105);
  ctx.quadraticCurveTo(20, -108, 22, -103);
  ctx.quadraticCurveTo(10, -55, 8, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds fan out from the crown: long tapered leaves that droop at the
  // tip. Each leaf is two close quadratic curves, so it reads as a thin
  // blade rather than a blob.
  const crownX = 18;
  const crownY = -104;
  for (let i = 0; i < 7; i += 1) {
    const a = (-165 + i * 26) * (Math.PI / 180);
    const len = 78 - Math.abs(i - 3) * 7;
    const tipX = crownX + Math.cos(a) * len;
    const tipY = crownY + Math.sin(a) * len * 0.5 + 34;
    const midX = crownX + Math.cos(a) * len * 0.55;
    const midY = crownY + Math.sin(a) * len * 0.28 - 14;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + 4, midY + 9, crownX, crownY + 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

function drawCaptionBlock(ctx, text, tagline, x, y, w, h, grade) {
  const caption = (text || '').trim().toUpperCase();
  const sub = (tagline || '').trim().toUpperCase();
  if (!caption && !sub) return;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const pad = w * 0.04;
  // With a tagline, the caption takes the upper part of the block and the
  // accent bar sits between the two lines; without one, the caption is
  // centred and the bar tucks right under it.
  const capH = sub ? h * 0.44 : h * 0.56;
  const capY = sub ? y + h * 0.3 : y + h * 0.48;
  if (caption) {
    const size = fitFont(ctx, caption, w - pad * 2, capH, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.06;
    ctx.strokeText(caption, x + pad, capY);
    ctx.fillStyle = grade.caption;
    ctx.fillText(caption, x + pad, capY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    // Accent bar under the caption.
    ctx.fillStyle = grade.accent;
    const barW = Math.min(ctx.measureText(caption).width, w - pad * 2);
    ctx.fillRect(x + pad, capY + size * 0.58, barW, Math.max(3, h * 0.045));
  }
  if (sub) {
    const size = fitFont(ctx, sub, w - pad * 2, h * 0.2, 'Anton, sans-serif');
    ctx.font = `${size}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, size * 0.18)}px`; } catch (e) { /* older browsers */ }
    ctx.fillStyle = grade.accent;
    ctx.fillText(sub, x + pad, y + h * 0.83);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older browsers */ }
  }
  ctx.restore();
}

// The whole cover. `state` holds layout, grade, caption, tagline, photos
// (array of images, may hold nulls) and panels (per-panel {photo, zoom,
// ox, oy}). `highlight` is an optional panel index to outline (editor use).
export function drawCover(canvas, state, highlight = -1) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const unit = Math.min(w, h);

  ctx.fillStyle = grade.band;
  ctx.fillRect(0, 0, w, h);

  const border = Math.max(3, unit * 0.008);
  layout.panels.forEach((panel, i) => {
    const rect = panelRect(panel, w, h);
    const slot = (state.panels && state.panels[i]) || { photo: 0, zoom: 1, ox: 0.5, oy: 0.5 };
    const img = state.photos ? state.photos[slot.photo] : null;
    ctx.save();
    clipPanel(ctx, panel, w, h);
    if (img) {
      drawPhotoInto(ctx, img, rect.x, rect.y, rect.w, rect.h, slot.zoom, slot.ox, slot.oy);
    } else {
      drawPlaceholder(ctx, rect.x, rect.y, rect.w, rect.h, 'ADD PHOTO');
    }
    ctx.restore();
    strokePanel(ctx, panel, w, h, border, '#ffffff');
    if (i === highlight) {
      strokePanel(ctx, panel, w, h, Math.max(4, border * 1.8), grade.accent);
    }
  });

  // Colour grade wash + vignette.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, 0, 0, h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Decorations. The palm is drawn in a ~110-unit space, so scale it to
  // `s` of the canvas's short side.
  if (layout.palm) {
    drawPalm(ctx, layout.palm.x * w, layout.palm.y * h, (unit * layout.palm.s) / 110, 'rgba(0, 0, 0, 0.45)');
  }

  // Caption.
  if (layout.captionAt === 'band' && layout.band) {
    const b = layout.band;
    const bx = b.x * w;
    const by = b.y * h;
    const bw = b.w * w;
    const bh = b.h * h;
    ctx.fillStyle = grade.band;
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(bx, by, bw, Math.max(3, unit * 0.006));
    if (layout.sun) {
      drawSun(ctx, layout.sun.x * w, layout.sun.y * h, layout.sun.r * unit);
    }
    const textW = layout.sun ? bw * 0.8 : bw;
    drawCaptionBlock(ctx, state.caption, state.tagline, bx, by, textW, bh, grade);
  } else {
    // Floating caption over a top scrim.
    const scrim = ctx.createLinearGradient(0, 0, 0, h * 0.34);
    scrim.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    scrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, w, h * 0.34);
    drawCaptionBlock(ctx, state.caption, state.tagline, w * 0.04, h * 0.03, w * 0.92, h * 0.2, grade);
  }
}

// Hit-test: which panel (if any) contains the relative point (rx, ry)?
export function panelAt(layoutId, rx, ry) {
  const layout = LAYOUTS[layoutId] || LAYOUTS.hero;
  for (let i = layout.panels.length - 1; i >= 0; i -= 1) {
    const p = layout.panels[i];
    if (p.poly) {
      // Ray-casting point-in-polygon test.
      let inside = false;
      for (let a = 0, b = p.poly.length - 1; a < p.poly.length; b = a, a += 1) {
        const [xi, yi] = p.poly[a];
        const [xj, yj] = p.poly[b];
        if ((yi > ry) !== (yj > ry) && rx < ((xj - xi) * (ry - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      if (inside) return i;
    } else if (rx >= p.x && rx <= p.x + p.w && ry >= p.y && ry <= p.y + p.h) {
      return i;
    }
  }
  return -1;
}
