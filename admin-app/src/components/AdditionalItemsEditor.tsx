import React from 'react';
import { Check, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { AdditionalCharge, AdditionalChargeBasis } from '../types';
import { makeId } from '../utils/format';
import { normalizeAdditionalCharges } from '../utils/pricing';

interface Props {
  items: AdditionalCharge[];
  passengerCount: number;
  language: 'th' | 'en';
  onChange: (items: AdditionalCharge[]) => void;
  compact?: boolean;
}

type DraftItem = {
  description: string;
  basis: AdditionalChargeBasis;
  quantity: number;
  unitPriceTHB: number;
};

export function makeAdditionalCharge(description = '', passengerCount = 1, basis: AdditionalChargeBasis = 'per_person'): AdditionalCharge {
  const quantity = basis === 'per_person' ? Math.max(1, passengerCount) : 1;
  return { id: makeId('extra'), description, basis, quantity, unitPriceTHB: 0, totalTHB: 0 };
}

export function AdditionalItemsEditor({ items, passengerCount, language, onChange, compact = false }: Props) {
  const th = language === 'th';
  const normalized = normalizeAdditionalCharges(items, passengerCount);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftItem>({ description: '', basis: 'per_person', quantity: Math.max(1, passengerCount), unitPriceTHB: 0 });

  React.useEffect(() => {
    if (draft.basis === 'per_person') setDraft((current) => ({ ...current, quantity: Math.max(1, passengerCount) }));
  }, [passengerCount, draft.basis]);

  function update(id: string, patch: Partial<AdditionalCharge>) {
    const next = items.map((item) => {
      if (item.id !== id) return item;
      const merged = { ...item, ...patch };
      if (patch.basis === 'per_person') merged.quantity = Math.max(1, passengerCount);
      if (patch.basis === 'per_group') merged.quantity = 1;
      const quantity = merged.basis === 'per_person'
        ? Math.max(1, passengerCount)
        : merged.basis === 'per_group'
          ? 1
          : Math.max(0, Number(merged.quantity || 0));
      const unitPriceTHB = Math.max(0, Number(merged.unitPriceTHB || 0));
      return { ...merged, quantity, unitPriceTHB, totalTHB: Math.round(quantity * unitPriceTHB * 100) / 100 };
    });
    onChange(next);
  }

  function openAdd(description = '', basis: AdditionalChargeBasis = 'per_person') {
    setDraft({
      description,
      basis,
      quantity: basis === 'per_person' ? Math.max(1, passengerCount) : 1,
      unitPriceTHB: 0,
    });
    setIsAdding(true);
  }

  function commitAdd() {
    const description = draft.description.trim();
    if (!description) return;
    const quantity = draft.basis === 'per_person'
      ? Math.max(1, passengerCount)
      : draft.basis === 'per_group'
        ? 1
        : Math.max(1, Number(draft.quantity || 1));
    const unitPriceTHB = Math.max(0, Number(draft.unitPriceTHB || 0));
    const item: AdditionalCharge = {
      id: makeId('extra'),
      description,
      basis: draft.basis,
      quantity,
      unitPriceTHB,
      totalTHB: Math.round(quantity * unitPriceTHB * 100) / 100,
    };
    onChange([...items, item]);
    setIsAdding(false);
    window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  const quick = th
    ? [
        ['อัปเกรดโรงแรม', 'per_person'],
        ['ระบำหน้ากาก', 'per_group'],
        ['รถขนกระเป๋า', 'per_group'],
      ] as const
    : [
        ['Hotel upgrade', 'per_person'],
        ['Mask dance', 'per_group'],
        ['Baggage vehicle', 'per_group'],
      ] as const;

  return <section className={`additional-items-editor ${compact ? 'compact' : ''}`}>
    <div className="additional-items-head">
      <div><span><Sparkles/></span><div><h3>{th ? 'รายการเพิ่มเติม' : 'Additional services'}</h3><p>{th ? 'เพิ่มรายละเอียด ราคา และวิธีคิดได้เอง ระบบจะรวมยอดให้อัตโนมัติ' : 'Add custom descriptions, prices and calculation methods. Totals update automatically.'}</p></div></div>
      <button type="button" className="secondary-button" onClick={() => openAdd()}><Plus/>{th ? 'เพิ่มรายการ' : 'Add item'}</button>
    </div>
    <div className="additional-quick-add">
      <small>{th ? 'เพิ่มด่วน:' : 'Quick add:'}</small>
      {quick.map(([label, basis]) => <button key={label} type="button" onClick={() => openAdd(label, basis)}>{label}</button>)}
    </div>

    {isAdding && <div className="additional-add-panel">
      <div className="additional-add-panel-head">
        <div><b>{th ? 'เพิ่มรายการใหม่' : 'Add a new item'}</b><span>{th ? 'กรอกรายละเอียดและราคา แล้วกด “เพิ่มรายการนี้”' : 'Enter the details and price, then confirm.'}</span></div>
        <button type="button" className="icon-button" onClick={() => setIsAdding(false)} aria-label={th ? 'ปิด' : 'Close'}><X/></button>
      </div>
      <div className="additional-add-grid">
        <label><span>{th ? 'รายละเอียด' : 'Description'}</span><input autoFocus value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder={th ? 'เช่น อัปเกรดโรงแรม / ระบำหน้ากาก' : 'e.g. Hotel upgrade / Mask dance'}/></label>
        <label><span>{th ? 'วิธีคิด' : 'Calculation'}</span><select value={draft.basis} onChange={(e) => {
          const basis = e.target.value as AdditionalChargeBasis;
          setDraft({ ...draft, basis, quantity: basis === 'per_person' ? Math.max(1, passengerCount) : 1 });
        }}><option value="per_person">{th ? 'ต่อท่าน' : 'Per person'}</option><option value="per_group">{th ? 'เหมาทั้งกลุ่ม' : 'Per group'}</option><option value="custom">{th ? 'ระบุจำนวนเอง' : 'Custom quantity'}</option></select></label>
        <label><span>{th ? 'จำนวน' : 'Qty'}</span><input type="number" min="1" step="1" value={draft.quantity} disabled={draft.basis !== 'custom'} onChange={(e) => setDraft({ ...draft, quantity: Math.max(1, Number(e.target.value || 1)) })}/></label>
        <label><span>{th ? 'ราคา / หน่วย' : 'Unit price'}</span><div className="additional-money-input"><input type="number" min="0" step="100" value={draft.unitPriceTHB} onChange={(e) => setDraft({ ...draft, unitPriceTHB: Math.max(0, Number(e.target.value || 0)) })}/><em>THB</em></div></label>
      </div>
      <div className="additional-add-summary"><span>{th ? 'ยอดรวมรายการนี้' : 'Item total'}</span><strong>{(Math.max(1, draft.quantity) * Math.max(0, draft.unitPriceTHB)).toLocaleString('en-US', { maximumFractionDigits: 2 })} THB</strong></div>
      <div className="additional-add-actions"><button type="button" className="ghost-button" onClick={() => setIsAdding(false)}>{th ? 'ยกเลิก' : 'Cancel'}</button><button type="button" className="primary-button" disabled={!draft.description.trim()} onClick={commitAdd}><Check/>{th ? 'เพิ่มรายการนี้' : 'Add this item'}</button></div>
    </div>}

    {items.length === 0 ? <div className="additional-empty">{th ? 'ยังไม่มีรายการเพิ่มเติม' : 'No additional services yet'}</div> : <div className="additional-items-list" ref={listRef}>
      <div className="additional-items-labels"><span>{th ? 'รายละเอียด' : 'Description'}</span><span>{th ? 'วิธีคิด' : 'Calculation'}</span><span>{th ? 'จำนวน' : 'Qty'}</span><span>{th ? 'ราคา/หน่วย' : 'Unit price'}</span><span>{th ? 'รวม' : 'Total'}</span><span/></div>
      {items.map((item) => {
        const computed = normalized.find((x) => x.id === item.id) || item;
        return <div className="additional-item-row" key={item.id}>
          <input aria-label={th ? 'รายละเอียดรายการ' : 'Item description'} value={item.description} onChange={(e) => update(item.id, { description: e.target.value })} placeholder={th ? 'เช่น อัปเกรดโรงแรม / ระบำหน้ากาก' : 'e.g. Hotel upgrade / Mask dance'}/>
          <select value={item.basis} onChange={(e) => update(item.id, { basis: e.target.value as AdditionalChargeBasis })}>
            <option value="per_person">{th ? 'ต่อท่าน' : 'Per person'}</option>
            <option value="per_group">{th ? 'เหมาทั้งกลุ่ม' : 'Per group'}</option>
            <option value="custom">{th ? 'ระบุจำนวนเอง' : 'Custom quantity'}</option>
          </select>
          <input type="number" min="0" step="1" value={computed.quantity} disabled={item.basis !== 'custom'} onChange={(e) => update(item.id, { quantity: Math.max(0, Number(e.target.value)) })}/>
          <div className="additional-money-input"><input type="number" min="0" step="100" value={item.unitPriceTHB} onChange={(e) => update(item.id, { unitPriceTHB: Math.max(0, Number(e.target.value)) })}/><em>THB</em></div>
          <strong>{computed.totalTHB.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
          <button type="button" className="icon-button danger" onClick={() => remove(item.id)} title={th ? 'ลบรายการ' : 'Remove item'}><Trash2/></button>
        </div>;
      })}
    </div>}
  </section>;
}
