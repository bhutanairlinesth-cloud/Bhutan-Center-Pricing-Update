import React from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
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

export function makeAdditionalCharge(description = '', passengerCount = 1, basis: AdditionalChargeBasis = 'per_person'): AdditionalCharge {
  const quantity = basis === 'per_person' ? Math.max(1, passengerCount) : 1;
  return { id: makeId('extra'), description, basis, quantity, unitPriceTHB: 0, totalTHB: 0 };
}

export function AdditionalItemsEditor({ items, passengerCount, language, onChange, compact = false }: Props) {
  const th = language === 'th';
  const normalized = normalizeAdditionalCharges(items, passengerCount);

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

  function add(description = '', basis: AdditionalChargeBasis = 'per_person') {
    onChange([...items, makeAdditionalCharge(description, passengerCount, basis)]);
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
      <div><span><Sparkles/></span><div><h3>{th ? 'รายการเพิ่มเติม' : 'Additional services'}</h3><p>{th ? 'เพิ่มรายการได้ไม่จำกัด ระบบคำนวณยอดให้อัตโนมัติ' : 'Add unlimited items; totals are calculated automatically.'}</p></div></div>
      <button type="button" className="secondary-button" onClick={() => add()}><Plus/>{th ? 'เพิ่มรายการ' : 'Add item'}</button>
    </div>
    <div className="additional-quick-add">
      <small>{th ? 'เพิ่มด่วน:' : 'Quick add:'}</small>
      {quick.map(([label, basis]) => <button key={label} type="button" onClick={() => add(label, basis)}>{label}</button>)}
    </div>
    {items.length === 0 ? <div className="additional-empty">{th ? 'ยังไม่มีรายการเพิ่มเติม' : 'No additional services yet'}</div> : <div className="additional-items-list">
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
