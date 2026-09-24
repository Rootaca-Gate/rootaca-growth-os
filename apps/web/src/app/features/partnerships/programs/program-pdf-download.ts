import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  if (!images.length) {
    return Promise.resolve();
  }
  return Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  ).then(() => undefined);
}

function waitForFonts(doc: Document): Promise<void> {
  const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts?.ready) {
    return Promise.resolve();
  }
  return fonts.ready.then(() => undefined).catch(() => undefined);
}

function safeFilename(filename: string): string {
  const safe = filename.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'program';
  return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
}

/**
 * html2canvas often mirrors / breaks Arabic when the root document is dir=rtl.
 * Capture from an LTR sandbox while keeping the page itself RTL.
 */
async function capturePage(page: HTMLElement, scale: number, isRtl: boolean): Promise<HTMLCanvasElement> {
  const doc = page.ownerDocument;
  const width = 794;
  const height = 1123;

  const sandbox = doc.createElement('div');
  sandbox.setAttribute('data-pdf-sandbox', 'true');
  sandbox.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${width}px`,
    'margin:0',
    'padding:0',
    'background:#ffffff',
    'direction:ltr',
    'unicode-bidi:normal',
    'z-index:2147483646',
    'overflow:visible',
  ].join(';');

  const clone = page.cloneNode(true) as HTMLElement;
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.minHeight = `${height}px`;
  clone.style.maxHeight = `${height}px`;
  clone.style.overflow = 'hidden';
  clone.style.direction = isRtl ? 'rtl' : 'ltr';
  clone.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

  sandbox.appendChild(clone);
  doc.body.appendChild(sandbox);

  try {
    await waitForImages(doc);
    await new Promise((resolve) => setTimeout(resolve, 50));

    return await html2canvas(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 20000,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc, clonedElement) => {
        clonedDoc.documentElement.setAttribute('dir', 'ltr');
        clonedDoc.documentElement.style.direction = 'ltr';
        clonedDoc.documentElement.style.unicodeBidi = 'normal';
        clonedDoc.body.style.direction = 'ltr';
        clonedDoc.body.style.unicodeBidi = 'normal';
        clonedDoc.body.style.background = '#ffffff';
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';

        const captureStyle = clonedDoc.createElement('style');
        captureStyle.textContent = `
          html, body {
            direction: ltr !important;
            unicode-bidi: normal !important;
          }
          * {
            letter-spacing: normal !important;
            word-spacing: normal !important;
            word-wrap: normal !important;
            overflow-wrap: normal !important;
            text-rendering: geometricPrecision;
          }
          .pdf-page {
            direction: ${isRtl ? 'rtl' : 'ltr'} !important;
            unicode-bidi: isolate;
            box-shadow: none !important;
            margin: 0 !important;
            width: ${width}px !important;
            height: ${height}px !important;
            min-height: ${height}px !important;
            max-height: ${height}px !important;
            overflow: hidden !important;
          }
          .pdf-page * {
            unicode-bidi: isolate;
          }
        `;
        clonedDoc.head.appendChild(captureStyle);

        const el = clonedElement as HTMLElement;
        el.style.direction = isRtl ? 'rtl' : 'ltr';
        el.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
        el.style.boxShadow = 'none';
        el.style.margin = '0';
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.overflow = 'hidden';
      },
    });
  } finally {
    sandbox.remove();
  }
}

/**
 * Renders school-facing Program HTML (`.pdf-page` sheets) into a multi-page A4 PDF.
 */
export async function downloadHtmlAsPdf(html: string, filename: string): Promise<void> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // Keep iframe in LTR coordinate space even when the app shell is RTL.
  iframe.style.cssText =
    'position:fixed;left:-14000px;top:0;width:900px;height:1400px;border:0;opacity:0;pointer-events:none;background:#fff;direction:ltr;';
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error('Could not access PDF render frame');
    }

    doc.open();
    doc.write(html);
    doc.close();

    await new Promise<void>((resolve) => {
      if (doc.readyState === 'complete') {
        resolve();
        return;
      }
      iframe.addEventListener('load', () => resolve(), { once: true });
    });

    await waitForFonts(doc);
    await waitForImages(doc);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const isRtl = doc.documentElement.getAttribute('dir') === 'rtl';
    const pages = Array.from(doc.querySelectorAll('.pdf-page')) as HTMLElement[];
    if (!pages.length) {
      throw new Error('No PDF pages found');
    }

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const scale = 2.25;

    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await capturePage(pages[i], scale, isRtl);
      if (!canvas.width || !canvas.height) {
        throw new Error('Empty PDF page canvas');
      }

      const imgData = canvas.toDataURL('image/png');

      if (i > 0) {
        pdf.addPage();
      }

      // Pages are designed and captured as exact A4 sheets.
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    }

    pdf.save(safeFilename(filename));
  } finally {
    iframe.remove();
  }
}
