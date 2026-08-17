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

type ModalBoundaryState = { error: Error | null };

class ModalContentBoundary extends React.Component<React.PropsWithChildren<{ resetKey: string }>, ModalBoundaryState> {
  state: ModalBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ModalBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Modal content render error', error, info);
  }

  componentDidUpdate(prevProps: Readonly<React.PropsWithChildren<{ resetKey: string }>>) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <div className="modal-safe-error" role="alert">
      <AlertCircle/>
      <div>
        <strong>ไม่สามารถแสดงรายละเอียดส่วนนี้ได้</strong>
        <span>กรุณาปิดหน้าต่างนี้แล้วเปิดใหม่ ข้อมูลที่บันทึกไว้ในระบบจะไม่หาย</span>
        <details><summary>รายละเอียดข้อผิดพลาด</summary><pre>{this.state.error.message}</pre></details>
      </div>
    </div>;
  }
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
  const resetKey = `${title || 'modal'}:${open ? '1' : '0'}`;

  return <div className="modal-layer modal-layer-safe" role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
    <button type="button" className="modal-backdrop" onClick={closeOnBackdrop ? onClose : undefined} aria-label="Close modal"/>
    <section className={`modal-card ${wide ? 'wide' : ''}`}>
      <header className="modal-safe-header">
        <h2>{title || 'รายละเอียด'}</h2>
        <button type="button" onClick={onClose} aria-label="Close"><X/></button>
      </header>
      <div className="modal-body">
        <ModalContentBoundary resetKey={resetKey}>{children}</ModalContentBoundary>
      </div>
    </section>
    <button type="button" className="modal-emergency-close" onClick={onClose} aria-label="Close dialog" title="Close"><X/></button>
  </div>;
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return <div className="empty-state"><div className="empty-orb"/><strong>{title}</strong>{detail && <p>{detail}</p>}</div>;
}
