import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem { id: string; message: string; kind: ToastKind; }

export function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return <div className="toast-stack" aria-live="polite">
    {items.map((item) => <div key={item.id} className={`toast ${item.kind}`}>
      {item.kind === 'success' ? <CheckCircle2/> : <AlertCircle/>}
      <span>{item.message}</span>
      <button onClick={() => onDismiss(item.id)} aria-label="Close"><X/></button>
    </div>)}
  </div>;
}

export function Modal({ open, title, children, onClose, wide = false, closeOnBackdrop = true, closeOnEscape = true }: {
  open: boolean; title?: string; children: React.ReactNode; onClose: () => void; wide?: boolean; closeOnBackdrop?: boolean; closeOnEscape?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape' && closeOnEscape) onClose(); };
    document.addEventListener('keydown', handler);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', handler); document.body.classList.remove('modal-open'); };
  }, [open, onClose, closeOnEscape]);
  if (!open) return null;
  return <div className="modal-layer" role="dialog" aria-modal="true">
    <button className="modal-backdrop" onClick={closeOnBackdrop ? onClose : undefined} aria-label="Close modal"/>
    <section className={`modal-card ${wide ? 'wide' : ''}`}>
      <header><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X/></button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return <div className="empty-state"><div className="empty-orb"/><strong>{title}</strong>{detail && <p>{detail}</p>}</div>;
}
