import React from 'react';

type State = { error: Error | null };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Bhutan Center UI error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="app-error-shell">
        <section className="app-error-card">
          <h1>ระบบไม่สามารถแสดงหน้านี้ได้</h1>
          <p>ข้อมูลของคุณยังไม่ถูกลบ กรุณากดโหลดหน้าใหม่ หากเกิดหลังเลือกไฟล์ ให้ลองไฟล์ PNG/JPG/WEBP/PDF ที่มีขนาดตามที่ระบบกำหนด</p>
          <button type="button" className="primary-button" onClick={() => window.location.reload()}>โหลดหน้าใหม่</button>
          <details><summary>รายละเอียดข้อผิดพลาด</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{this.state.error.message}</pre></details>
        </section>
      </main>
    );
  }
}
