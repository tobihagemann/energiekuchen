// DOM/canvas/Web-Share glue for image export. These touch browser-only APIs (canvas, Image,
// navigator.share) that jsdom does not implement, so they are verified by E2E (e2e/export.spec.ts,
// e2e/sharing.spec.ts) and excluded from the utils coverage gate in jest.config.ts. Pure,
// unit-tested helpers (filename, text wrapping) live in imageExport.ts.

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Serialize a live <svg> element, rasterize it to PNG via an <img>→canvas pipeline, and resolve
// with the PNG Blob. The element MUST carry intrinsic width/height attributes and reference no
// external resources (the wordmark logo is an inline data URI, all paints are inline) — otherwise
// the canvas taints (toBlob throws SecurityError) or the raster silently drops content.
export function rasterizeSvgElement(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Read the intrinsic export size from the attributes, not getBoundingClientRect() — the
    // on-screen preview is scaled down by CSS and would yield a low-res raster.
    const width = parseFloat(svg.getAttribute('width') ?? '');
    const height = parseFloat(svg.getAttribute('height') ?? '');
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      reject(new Error('SVG hat keine gültigen Abmessungen'));
      return;
    }

    const serialized = new XMLSerializer().serializeToString(svg);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

    const image = new Image();
    // Explicit intrinsic dimensions are required for a serialized SVG to rasterize at all in
    // WebKit/Firefox.
    image.width = width;
    image.height = height;
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas-Kontext nicht verfügbar'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('PNG konnte nicht erstellt werden'));
        }, 'image/png');
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Bild konnte nicht gezeichnet werden'));
      }
    };
    image.onerror = () => reject(new Error('SVG konnte nicht geladen werden'));
    image.src = svgUrl;
  });
}

// Whether the platform can share image files via the Web Share API (true on most mobile
// browsers, false on most desktop ones — desktop users download via Exportieren instead).
export function canShareImageFiles(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  try {
    const file = new File([''], 'energiekuchen.png', { type: 'image/png' });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

// Share a PNG Blob through the native share sheet. Callers must pass an already-generated Blob
// and invoke this synchronously from a user gesture — navigator.share() with files requires
// transient activation that an async rasterize would outlive.
export function shareImageFile(blob: Blob, filename: string, opts?: { title?: string; text?: string }): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });
  return navigator.share({ files: [file], title: opts?.title, text: opts?.text });
}
