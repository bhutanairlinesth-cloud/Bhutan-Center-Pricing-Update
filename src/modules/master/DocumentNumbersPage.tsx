import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { database } from '../../db/database';
import { DocCounterState, DocType, previewNextDocNumber } from '../../shared/docNumber';
import { FormActionBar, PageHeader, SectionCard } from '../../shared/ui';

const DOC_LABELS: Record<DocType, string> = {
  QT: 'ใบเสนอราคา (Quotation)',
  BK: 'การจอง (Booking)',
  INV: 'ใบแจ้งหนี้ (Invoice)',
  RC: 'ใบเสร็จ (Receipt)',
  AG: 'เอเจนต์ (Agent code prefix)',
};

export function DocumentNumbersPage() {
  const [state, setState] = useState<DocCounterState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void database.getDocCounters().then(setState);
  }, []);

  async function save() {
    if (!state) return;
    setSaving(true);
    try {
      await database.saveDocCounters(state);
    } finally {
      setSaving(false);
    }
  }

  if (!state) return <div className="module-loading">Loading...</div>;

  return (
    <div className="module-list-page bo-list-page has-form-actions">
      <PageHeader
        title="เลขที่เอกสาร"
        subtitle="Format: PREFIX-YYYY-NNNN — legacy numbers are never renamed"
      />
      <SectionCard title="">
        <div className="module-table-wrap bo-table-wrap">
          <table className="module-table bo-table">
            <thead>
              <tr>
                <th>ประเภทเอกสาร</th>
                <th>Prefix</th>
                <th>Counter {state.year}</th>
                <th>เลขถัดไป (preview)</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(DOC_LABELS) as DocType[]).map((type) => (
                <tr key={type}>
                  <td><strong>{DOC_LABELS[type]}</strong></td>
                  <td>
                    <input
                      value={state.prefixes[type]}
                      onChange={(e) => setState({ ...state, prefixes: { ...state.prefixes, [type]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') } })}
                      className="mono"
                    />
                  </td>
                  <td>{state.counters[type]}</td>
                  <td><strong className="mono">{previewNextDocNumber(state, type)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      <FormActionBar>
        <button type="button" className="primary-btn" disabled={saving} onClick={() => void save()}>
          <Save size={16} />{saving ? 'Saving...' : 'บันทึก prefix'}
        </button>
      </FormActionBar>
    </div>
  );
}
