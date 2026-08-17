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
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f4f7f5', color: '#173b30' }}>
        <section style={{ width: 'min(620px,100%)', background: '#fff', border: '1px solid #dce7e2', borderRadius: 18, padding: 28 }}>
          <h1 style={{ margin: '0 0 10px', fontSize: 24 }}>ระบบไม่สามารถแสดงหน้านี้ได้</h1>
          <p style={{ margin: '0 0 16px', lineHeight: 1.6 }}>ข้อมูลของคุณยังไม่ถูกลบ กรุณากดโหลดหน้าใหม่ หากเกิดหลังเลือกไฟล์ ให้ลองไฟล์ PNG/JPG/WEBP/PDF ที่มีขนาดตามที่ระบบกำหนด</p>
          <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 10, padding: '12px 18px', background: '#146b50', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>โหลดหน้าใหม่</button>
          <details style={{ marginTop: 18, color: '#66756e', fontSize: 12 }}><summary>รายละเอียดข้อผิดพลาด</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{this.state.error.message}</pre></details>
        </section>
      </main>
    );
  }
}
