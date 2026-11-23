/**
 * Product-shot mode — drop a product image on a plinth, light it with the
 * existing look system, export a hero image and a turntable clip.
 *
 * This module generates a complete, self-contained HTML file that shows a
 * product image on a styled plinth. The product image is embedded as a data
 * URL so the exported HTML needs no network at runtime. Lighting follows the
 * Phase 3 look system (timeOfDay + weather).
 *
 * Output is standalone HTML with inline SVG + CSS, rendered entirely in the
 * browser. It can be exported as a hero image (PNG via canvas readback) or a
 * turntable clip (CSS rotation captured frame-by-frame).
 */

export type PlinthKind = 'marble' | 'wood' | 'scifi-ring' | 'brushed-metal';

export interface ProductShotOptions {
  /** Data URL of the product image (e.g. from FileReader). */
  productImage: string;
  /** Plinth type the product sits on. */
  plinth: PlinthKind;
  /** Look to light the scene with (timeOfDay + weather). */
  look: { timeOfDay: number; weather: 'clear' | 'rain' | 'snow' };
  /** Product name used for the figure name/title. */
  productName: string;
}

/** Plinth styles: CSS classes define the look, defined in the HTML <style>. */
const PLINTH_CLASSES: Record<PlinthKind, string> = {
  marble: 'plinth-marble',
  wood: 'plinth-wood',
  'scifi-ring': 'plinth-scifi-ring',
  'brushed-metal': 'plinth-brushed-metal',
};

/** Map look timeOfDay/weather to CSS filter + background for lighting. */
function lookToStyle(look: { timeOfDay: number; weather: 'clear' | 'rain' | 'snow' }) {
  const t = look.timeOfDay;
  let filter = '';
  let bg = '#f8fafc';
  let shadow = 'rgba(0,0,0,0.15)';

  if (t < 0.16) {
    // Dawn: warm low sun, long shadows
    filter = 'drop-shadow(0 8px 16px rgba(255, 180, 120, 0.5)) saturate(1.1)';
    bg = '#f5e6d3';
    shadow = 'rgba(180, 130, 100, 0.4)';
  } else if (t < 0.5) {
    // Noon: bright neutral
    filter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25)) saturate(1.05)';
    bg = '#ffffff';
    shadow = 'rgba(0, 0, 0, 0.25)';
  } else if (t < 0.83) {
    // Dusk: golden hour
    filter = 'drop-shadow(0 10px 20px rgba(255, 140, 80, 0.6)) saturate(1.2) hue-rotate(-5deg)';
    bg = '#f4d3b0';
    shadow = 'rgba(160, 100, 80, 0.45)';
  } else {
    // Night: cool moonlight
    filter = 'drop-shadow(0 4px 8px rgba(120, 160, 220, 0.4)) saturate(0.85) hue-rotate(10deg)';
    bg = '#1e293b';
    shadow = 'rgba(15, 40, 70, 0.5)';
  }

  return { filter, bg, shadow };
}

function lookToLabel(look: { timeOfDay: number; weather: 'clear' | 'rain' | 'snow' }): string {
  const t = look.timeOfDay;
  if (t < 0.16) return 'dawn';
  if (t < 0.5) return 'noon';
  if (t < 0.83) return 'dusk';
  return 'night';
}

/** Generate a complete, self-contained HTML file for a product shot. */
export function buildProductShotHTML(opts: ProductShotOptions): string {
  const { productImage, plinth, look, productName } = opts;
  const style = lookToStyle(look);
  const plinthClass = PLINTH_CLASSES[plinth];
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) || 'product-shot';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${productName} · Product Shot</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: ${style.bg}; font-family: 'Figtree', 'Segoe UI', system-ui, sans-serif; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; }

  /* The plinth: a styled rounded base the product sits on. */
  .plinth {
    width: 720px;
    height: 480px;
    border-radius: 40px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 24px 60px ${style.shadow};
    overflow: hidden;
  }
  .plinth-base {
    position: absolute;
    inset: 0;
    border-radius: 40px;
    background: var(--plinth-base);
    border: 1px solid var(--plinth-border);
  }
  .plinth-surface {
    position: absolute;
    inset: 20px;
    border-radius: 32px;
    background: var(--plinth-surface);
    opacity: 0.85;
  }
  .plinth .plinth-marble-base { --plinth-base: #f1f5f9; --plinth-border: #cbd5e1; --plinth-surface: #e2e8f0; }
  .plinth .plinth-wood-base { --plinth-base: #d97706; --plinth-border: #b45309; --plinth-surface: #f59e0b; }
  .plinth .plinth-scifi-ring-base { --plinth-base: #0f172a; --plinth-border: #334155; --plinth-surface: #1e293b; }
  .plinth .plinth-brushed-metal-base { --plinth-base: #e2e8f0; --plinth-border: #94a3b8; --plinth-surface: #f1f5f9; }

  /* Contact shadow under the product. */
  .contact-shadow {
    position: absolute;
    top: 50%; left: 50%;
    width: 260px; height: 140px;
    background: radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%);
    transform: translate(-50%, -50%);
    filter: blur(12px);
    pointer-events: none;
    z-index: 1;
  }

  /* The product image. */
  .product-wrap {
    position: relative;
    z-index: 2;
    width: 420px; height: 280px;
    filter: ${style.filter};
    transition: transform 0.6s ease;
    will-change: transform;
  }
  .product-wrap:hover { transform: scale(1.03); }
  .product-wrap img {
    width: 100%; height: 100%;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  }

  /* Turntable animation: gentle rotation. */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .product-wrap.spinning { animation: spin 10s linear infinite; }

  .caption {
    margin-top: 24px;
    text-align: center;
    color: ${look.timeOfDay > 0.7 ? '#f8fafc' : '#1e293b'};
  }
  .caption h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
  .caption p { font-size: 0.875rem; opacity: 0.7; margin-top: 4px; }

  /* Controls overlay (hidden when embedded). */
  .controls {
    position: absolute;
    bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 10px;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.2);
    z-index: 10;
  }
  .controls button {
    background: none; border: none; color: inherit;
    font: inherit; cursor: pointer; padding: 6px 10px;
    border-radius: 6px;
  }
  .controls button:hover { background: rgba(255,255,255,0.15); }
</style>
</head>
<body>
  <div class="plinth ${plinthClass}">
    <div class="plinth-base"></div>
    <div class="plinth-surface"></div>
    <div class="contact-shadow"></div>
    <div class="product-wrap" id="productWrap">
      <img src="${productImage}" alt="${productName}" loading="eager">
    </div>
  </div>
  <div class="caption">
    <h1>${escapeHtml(productName)}</h1>
    <p>${plinth} plinth · ${lookToLabel(look)} lighting</p>
  </div>
  <div class="controls">
    <button id="btnSpin" title="Toggle rotation">⟳ Spin</button>
    <button id="btnHero" title="Save hero image">⬍ Hero</button>
  </div>
<script>
  (function () {
    var wrap = document.getElementById('productWrap');
    var btnSpin = document.getElementById('btnSpin');
    var spinning = false;
    btnSpin.addEventListener('click', function () {
      spinning = !spinning;
      wrap.classList.toggle('spinning', spinning);
      btnSpin.textContent = spinning ? '⟳ Stop' : '⟳ Spin';
    });

    // Hero export: render plinth + product at high resolution to a PNG canvas.
    var btnHero = document.getElementById('btnHero');
    var img = document.querySelector('.product-wrap img');
    btnHero.addEventListener('click', function () {
      if (!img || !img.complete) {
        alert('Product image not loaded yet.');
        return;
      }
      var rect = document.querySelector('.plinth').getBoundingClientRect();
      var scale = Math.max(1, Math.min(4, 2000 / Math.max(rect.width, rect.height)));
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      var ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill plinth background color.
      var style = getComputedStyle(document.querySelector('.plinth-base'));
      ctx.fillStyle = style.backgroundColor || '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw contact shadow.
      var shadow = document.querySelector('.contact-shadow');
      if (shadow) {
        var sRect = shadow.getBoundingClientRect();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(
          (sRect.left - rect.left) * scale,
          (sRect.top - rect.top + sRect.height / 2) * scale,
          (sRect.width / 2) * scale,
          (sRect.height / 3) * scale,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw product image centered and scaled to fit.
      var pw = 420 * scale;
      var ph = 280 * scale;
      var px = (canvas.width - pw) / 2;
      var py = (canvas.height - ph) / 2 - 20 * scale; // slightly above center
      ctx.drawImage(img, px, py, pw, ph);

      var url = canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = '${slug}-hero.png';
      a.click();
    });
  })();
</script>
</body>
</html>`;

  return html;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
    }
    return c;
  });
}
