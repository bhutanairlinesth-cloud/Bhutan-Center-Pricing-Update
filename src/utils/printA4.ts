const NATIVE_A4_PRINT_STYLE = `
  /* Screen: keep the cloned print document completely out of the UI. */
  .a4-native-print-root { display: none !important; }

  @media print {
    @page { size: A4 portrait; margin: 0; }

    html,
    body {
      width: 210mm !important;
      min-width: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Print ONLY the isolated clone. This keeps modal/responsive layout out of
       Chrome's PDF renderer while still using the exact CSS already loaded by
       the live application. */
    body > *:not(.a4-native-print-root) {
      display: none !important;
    }

    .a4-native-print-root,
    .a4-native-print-root * {
      visibility: visible !important;
    }

    .a4-native-print-root {
      display: block !important;
      position: static !important;
      width: 210mm !important;
      min-width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
    }

    .a4-native-print-root #invoice-print-area,
    .a4-native-print-root #quotation-print-area {
      position: static !important;
      inset: auto !important;
      display: block !important;
      width: 210mm !important;
      min-width: 210mm !important;
      max-width: 210mm !important;
      min-height: 297mm !important;
      height: auto !important;
      margin: 0 !important;
      padding: 11mm 12mm 9mm !important;
      overflow: visible !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      transform: none !important;
      zoom: 1 !important;
      box-sizing: border-box !important;
      background: #ffffff !important;
    }

    /* Hard bounds for uploaded logos. A missing stylesheet in a popup used to
       let the raw logo image expand to its natural pixel dimensions. */
    .a4-native-print-root .brand.has-uploaded-logo,
    .a4-native-print-root .quote-header .brand.has-uploaded-logo,
    .a4-native-print-root .invoice-header .brand.has-uploaded-logo {
      display: inline-flex !important;
      width: auto !important;
      max-width: 64mm !important;
      min-width: 0 !important;
      overflow: hidden !important;
    }

    .a4-native-print-root .brand.has-uploaded-logo img,
    .a4-native-print-root .quote-header .brand.has-uploaded-logo img,
    .a4-native-print-root .invoice-header .brand.has-uploaded-logo img {
      display: block !important;
      width: auto !important;
      height: auto !important;
      max-width: 62mm !important;
      max-height: 15mm !important;
      object-fit: contain !important;
      object-position: left center !important;
    }

    .a4-native-print-root img,
    .a4-native-print-root svg {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    /* Preserve desktop document grids regardless of browser/window width. */
    .a4-native-print-root .invoice-meta { grid-template-columns: 1.25fr .75fr !important; }
    .a4-native-print-root .invoice-trip-summary { grid-template-columns: 1.45fr .85fr .55fr !important; }
    .a4-native-print-root .invoice-trip-summary > div {
      border-right: 1px solid #e3e8e5 !important;
      border-bottom: 0 !important;
    }
    .a4-native-print-root .invoice-trip-summary > div:last-child { border-right: 0 !important; }
    .a4-native-print-root .invoice-table-head,
    .a4-native-print-root .invoice-table-row { grid-template-columns: minmax(0, 1fr) 80px 145px !important; }
    .a4-native-print-root .journey-invoice-package-head,
    .a4-native-print-root .journey-invoice-package-row {
      grid-template-columns: minmax(0, 1fr) 48px 52px 108px 120px !important;
    }
    .a4-native-print-root .invoice-passenger-booking-meta { grid-template-columns: repeat(3, 1fr) !important; }
    .a4-native-print-root .invoice-passenger-booking-meta > div {
      border-right: 1px solid #dfe8e3 !important;
      border-bottom: 0 !important;
    }
    .a4-native-print-root .invoice-passenger-booking-meta > div:last-child { border-right: 0 !important; }
    .a4-native-print-root .invoice-passenger-list.two-columns { grid-template-columns: 1fr 1fr !important; }
    .a4-native-print-root .invoice-passenger-list.two-columns li:nth-child(odd) { border-right: 1px solid #e8eeeb !important; }

    .a4-native-print-root .quote-meta-grid { grid-template-columns: 1.2fr .8fr !important; }
    .a4-native-print-root .quote-trip-card { grid-template-columns: 1.4fr .9fr 1fr .7fr !important; }
    .a4-native-print-root .quote-scope-grid { grid-template-columns: minmax(0, 1.68fr) minmax(195px, .82fr) !important; }
    .a4-native-print-root .quote-included ol { columns: 2 !important; }

    .a4-native-print-root header,
    .a4-native-print-root footer,
    .a4-native-print-root .invoice-meta,
    .a4-native-print-root .invoice-trip-summary,
    .a4-native-print-root .journey-invoice-package,
    .a4-native-print-root .journey-payment-breakdown,
    .a4-native-print-root .invoice-passenger-check,
    .a4-native-print-root .invoice-total,
    .a4-native-print-root .invoice-total-readable,
    .a4-native-print-root .invoice-bank-payment,
    .a4-native-print-root .invoice-note,
    .a4-native-print-root .invoice-footer,
    .a4-native-print-root .quote-meta-grid,
    .a4-native-print-root .quote-trip-card,
    .a4-native-print-root .quote-price-table,
    .a4-native-print-root .quote-scope-card,
    .a4-native-print-root .quote-terms,
    .a4-native-print-root .quote-footer {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .a4-native-print-root .no-print,
    .a4-native-print-root .invoice-toolbar,
    .a4-native-print-root .quote-toolbar {
      display: none !important;
    }
  }
`;

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });
  })).then(() => undefined);
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

/**
 * Print an Invoice/Quotation as a stable A4 document using a temporary clone
 * inside the CURRENT page.
 *
 * Earlier versions opened an about:blank popup and copied <link> stylesheets.
 * On some Chrome/Vercel combinations the app stylesheet was not ready when
 * print preview started, causing the uploaded logo to render at its raw size
 * and the document to collapse into tiny/default text across two pages.
 *
 * Keeping the print clone in the live document guarantees that it uses the
 * already-loaded application CSS, web fonts and logo sizing.
 */
export async function printElementAsA4(elementId: string, title: string): Promise<void> {
  const source = document.getElementById(elementId) as HTMLElement | null;
  if (!source) {
    window.print();
    return;
  }

  // Remove a stale clone if a previous browser print dialog was interrupted.
  document.querySelectorAll('.a4-native-print-root').forEach((node) => node.remove());
  document.getElementById('a4-native-print-style')?.remove();

  try {
    await waitForImages(source);
    if ('fonts' in document) await document.fonts.ready;
  } catch {
    // Continue even if a remote logo/font fails. CSS still constrains sizing.
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'a4-native-print-root';
  wrapper.setAttribute('aria-hidden', 'true');

  const clone = source.cloneNode(true) as HTMLElement;
  wrapper.appendChild(clone);

  const style = document.createElement('style');
  style.id = 'a4-native-print-style';
  style.textContent = NATIVE_A4_PRINT_STYLE;

  const oldTitle = document.title;
  if (title) document.title = title;
  document.head.appendChild(style);
  document.body.appendChild(wrapper);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    wrapper.remove();
    style.remove();
    document.title = oldTitle;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  // Wait until the clone has been laid out with the live application's CSS.
  await nextPaint();
  window.print();

  // Some Chromium builds do not reliably fire afterprint when Save as PDF is
  // cancelled. Keep a delayed safety cleanup without affecting the dialog.
  window.setTimeout(cleanup, 90_000);
}
