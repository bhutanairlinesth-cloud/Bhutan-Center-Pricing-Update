export type DocType = 'QT' | 'BK' | 'INV' | 'RC' | 'AG';

export interface DocCounterState {
  year: number;
  counters: Record<DocType, number>;
  prefixes: Record<DocType, string>;
}

export const DEFAULT_DOC_COUNTERS: DocCounterState = {
  year: new Date().getFullYear(),
  counters: { QT: 0, BK: 0, INV: 0, RC: 0, AG: 0 },
  prefixes: { QT: 'QT', BK: 'BK', INV: 'INV', RC: 'RC', AG: 'AG' },
};

export function formatDocNumber(type: DocType, year: number, seq: number, prefixes: Record<DocType, string> = DEFAULT_DOC_COUNTERS.prefixes): string {
  const prefix = prefixes[type] || type;
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
}

export function previewNextDocNumber(state: DocCounterState, type: DocType): string {
  const year = state.year;
  const seq = (state.counters[type] ?? 0) + 1;
  return formatDocNumber(type, year, seq, state.prefixes);
}

/** Increment counter and return the new document number. Handles year rollover. */
export function nextDocNumber(state: DocCounterState, type: DocType): { no: string; state: DocCounterState } {
  const nowYear = new Date().getFullYear();
  let next = { ...state, counters: { ...state.counters }, prefixes: { ...state.prefixes } };
  if (next.year !== nowYear) {
    next = { ...next, year: nowYear, counters: { QT: 0, BK: 0, INV: 0, RC: 0, AG: 0 } };
  }
  const seq = (next.counters[type] ?? 0) + 1;
  next.counters[type] = seq;
  return { no: formatDocNumber(type, next.year, seq, next.prefixes), state: next };
}

/** Legacy numbers (OMG-BH-*, INV-BH-*) are shown as-is; only new docs use PREFIX-YYYY-NNNN. */
export function isLegacyDocNumber(value: string): boolean {
  return /^(OMG-BH-|INV-BH-)/.test(value);
}
