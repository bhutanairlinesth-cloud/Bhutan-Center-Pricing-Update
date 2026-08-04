const A4_PRINT_OVERRIDES = `
  @page { size: A4 portrait; margin: 0; }

  html,
  body {
    width: 210mm !important;
    min-width: 210mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body *,
  .a4-print-root,
  .a4-print-root * {
    visibility: visible !important;
  }

  .a4-print-root {
    width: 210mm !important;
    min-height: 297mm !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
  }

  #invoice-print-area,
  #quotation-print-area {
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
    box-sizing: border-box !important;
    background: #ffffff !important;
  }

  /* Preserve the desktop document grid even when the print viewport is narrow. */
  .invoice-meta { grid-template-columns: 1.25fr .75fr !important; }
  .invoice-trip-summary { grid-template-columns: 1.45fr .85fr .55fr !important; }
  .invoice-trip-summary > div {
    border-right: 1px solid #e3e8e5 !important;
    border-bottom: 0 !important;
  }
  .invoice-trip-summary > div:last-child { border-right: 0 !important; }
  .invoice-table-head,
  .invoice-table-row { grid-template-columns: minmax(0, 1fr) 80px 145px !important; }
  .journey-invoice-package-head,
  .journey-invoice-package-row {
    grid-template-columns: minmax(0, 1fr) 48px 52px 108px 120px !important;
  }
  .invoice-passenger-booking-meta { grid-template-columns: repeat(3, 1fr) !important; }
  .invoice-passenger-booking-meta > div {
    border-right: 1px solid #dfe8e3 !important;
    border-bottom: 0 !important;
  }
  .invoice-passenger-booking-meta > div:last-child { border-right: 0 !important; }
  .invoice-passenger-list.two-columns { grid-template-columns: 1fr 1fr !important; }
  .invoice-passenger-list.two-columns li:nth-child(odd) { border-right: 1px solid #e8eeeb !important; }

  .quote-meta-grid { grid-template-columns: 1.2fr .8fr !important; }
  .quote-trip-card { grid-template-columns: 1.4fr .9fr 1fr .7fr !important; }
  .quote-scope-grid { grid-template-columns: minmax(0, 1.68fr) minmax(195px, .82fr) !important; }
  .quote-included ol { columns: 2 !important; }

  header,
  footer,
  section,
  .invoice-meta,
  .invoice-trip-summary,
  .journey-invoice-package,
  .journey-payment-breakdown,
  .invoice-passenger-check,
  .invoice-total,
  .invoice-note,
  .invoice-footer,
  .quote-meta-grid,
  .quote-trip-card,
  .quote-price-table,
  .quote-scope-grid,
  .quote-terms,
  .quote-footer {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .no-print,
  .modal-layer,
  .modal-backdrop,
  .modal-card > header,
  .invoice-toolbar,
  .quote-toolbar {
    display: none !important;
  }

  @media print {
    html,
    body,
    .a4-print-root {
      width: 210mm !important;
      min-width: 210mm !important;
    }

    #invoice-print-area,
    #quotation-print-area {
      page-break-after: auto !important;
    }
  }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function collectStyles(): string {
  return Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');
}


function fitDocumentToSingleA4Page(doc: Document, elementId: string): void {
  const page = doc.getElementById(elementId) as HTMLElement | null;
  if (!page) return;

  const cssPixelsPerMillimetre = 96 / 25.4;
  const targetHeight = 297 * cssPixelsPerMillimetre;

  // Measure real content without the A4 minimum-height placeholder.
  page.style.setProperty('zoom', '1', 'important');
  page.style.setProperty('width', '210mm', 'important');
  page.style.setProperty('min-width', '210mm', 'important');
  page.style.setProperty('max-width', '210mm', 'important');
  page.style.setProperty('height', 'auto', 'important');
  page.style.setProperty('min-height', '0', 'important');

  const naturalHeight = page.scrollHeight;
  if (!naturalHeight || naturalHeight <= targetHeight) {
    page.style.setProperty('min-height', '297mm', 'important');
    return;
  }

  // Keep normal-size documents unchanged. For a slightly long invoice,
  // reduce it just enough to stay on one A4 page. Very long documents are
  // capped at 76% and are allowed to continue on another A4 page rather than
  // becoming unreadably small.
  const scale = Math.max(0.76, Math.min(1, (targetHeight / naturalHeight) * 0.98));
  page.style.setProperty('zoom', String(scale), 'important');
  page.style.setProperty('width', `${210 / scale}mm`, 'important');
  page.style.setProperty('min-width', `${210 / scale}mm`, 'important');
  page.style.setProperty('max-width', `${210 / scale}mm`, 'important');
  page.style.setProperty('min-height', `${297 / scale}mm`, 'important');
}

async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      image.addEventListener('load', () => resolve(), { once: true });
      image.addEventListener('error', () => resolve(), { once: true });
    });
  }));
}

/**
 * Prints a cloned document in an isolated A4 window.
 * This prevents responsive modal styles and scroll containers from changing
 * the invoice/quotation layout when Chrome opens the print preview.
 */
export async function printElementAsA4(elementId: string, title: string): Promise<void> {
  const source = document.getElementById(elementId);
  if (!source) {
    window.print();
    return;
  }

  // Open synchronously inside the click event so browsers do not block it.
  const printWindow = window.open('', '_blank', 'popup=yes,width=900,height=1100');
  if (!printWindow) {
    window.print();
    return;
  }

  const safeTitle = escapeHtml(title || 'A4 Document');
  const styles = collectStyles();
  const baseHref = escapeHtml(document.baseURI);

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="${document.documentElement.lang || 'th'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="${baseHref}" />
  <title>${safeTitle}</title>
  ${styles}
  <style>${A4_PRINT_OVERRIDES}</style>
</head>
<body>
  <main class="a4-print-root">${source.outerHTML}</main>
</body>
</html>`);
  printWindow.document.close();

  const runPrint = async () => {
    try {
      if ('fonts' in printWindow.document) {
        await printWindow.document.fonts.ready;
      }
      await waitForImages(printWindow.document);
    } catch {
      // Continue printing even if a remote font or logo cannot be loaded.
    }

    fitDocumentToSingleA4Page(printWindow.document, elementId);

    // Give Chromium one extra paint so the measured A4 layout is stable.
    printWindow.requestAnimationFrame(() => {
      printWindow.requestAnimationFrame(() => {
        printWindow.focus();
        printWindow.print();
      });
    });
  };

  if (printWindow.document.readyState === 'complete') {
    void runPrint();
  } else {
    printWindow.addEventListener('load', () => { void runPrint(); }, { once: true });
  }

  printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true });
}
