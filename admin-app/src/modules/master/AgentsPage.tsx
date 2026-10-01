import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Agent } from '../../types';
import { database } from '../../db/database';
import { makeId } from '../../utils/format';
import { ListPage } from '../../shared/ListPage';
import { FormActionBar, PageHeader, SectionCard, Toggle } from '../../shared/ui';

function newAgent(): Agent {
  const now = new Date().toISOString();
  return { id: makeId('agt'), code: '', name: '', contactName: '', phone: '', email: '', active: true, note: '', createdAt: now, updatedAt: now };
}

export function AgentsPage({ detailId, onNavigate }: { detailId?: string; onNavigate?: (path: string) => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const listPath = '/admin/agents';
  const go = (path: string) => onNavigate?.(path);

  async function load() {
    setAgents(await database.getAgents());
  }

  useEffect(() => { void load(); }, []);

  async function persist(agent: Agent) {
    await database.saveAgent({ ...agent, updatedAt: new Date().toISOString() });
    await load();
  }

  async function save(agent: Agent) {
    await persist(agent);
    go(listPath);
  }

  if (detailId) {
    const isNew = detailId === 'new';
    const existing = isNew ? null : agents.find((a) => a.id === detailId);
    if (isNew || existing) {
      return (
        <AgentDetailPage
          agent={existing ?? newAgent()}
          isNew={isNew}
          onBack={() => go(listPath)}
          onSave={save}
        />
      );
    }
  }

  return (
    <ListPage
      title="เอเจนต์"
      rows={agents}
      getRowId={(a) => a.id}
      searchKeys={['code', 'name', 'contactName', 'phone', 'email']}
      onRowClick={(a) => go(`${listPath}/${a.id}`)}
      onCreate={() => go(`${listPath}/new`)}
      createLabel="เพิ่มเอเจนต์"
      columns={[
        { key: 'code', header: 'รหัส', render: (a) => <strong className="mono">{a.code}</strong> },
        { key: 'name', header: 'ชื่อ', render: (a) => a.name },
        { key: 'contact', header: 'ติดต่อ', render: (a) => a.contactName || a.phone || '—' },
        { key: 'status', header: 'สถานะ', render: (a) => (
          <span onClick={(e) => e.stopPropagation()}>
            <Toggle
              checked={a.active}
              ariaLabel={`เปิดใช้งาน ${a.name || a.code}`}
              onChange={(active) => void persist({ ...a, active })}
            />
          </span>
        ) },
      ]}
    />
  );
}

function AgentDetailPage({ agent, isNew, onBack, onSave }: {
  agent: Agent;
  isNew: boolean;
  onBack: () => void;
  onSave: (agent: Agent) => Promise<void>;
}) {
  const [form, setForm] = useState(agent);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try { await onSave(form); } finally { setBusy(false); }
  }

  return (
    <div className="module-detail-page bo-detail-page has-form-actions">
      <PageHeader
        breadcrumb={[{ label: 'เอเจนต์', onClick: onBack }]}
        title={isNew ? 'เพิ่มเอเจนต์' : (form.code || form.name || 'เอเจนต์')}
        subtitle={isNew ? 'กรอกรหัสและข้อมูลติดต่อ' : form.name}
        onBack={onBack}
      />
      <SectionCard title="ข้อมูลเอเจนต์">
        <form id="agent-detail-form" className="module-form" onSubmit={(e) => void submit(e)}>
          <label>รหัส<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label>
          <label>ชื่อบริษัท<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label>ผู้ติดต่อ<input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></label>
          <label>โทร<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>อีเมล<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>หมายเหตุ<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} /></label>
          <Toggle
            checked={form.active}
            label="เปิดใช้งาน"
            ariaLabel="เปิดใช้งานเอเจนต์"
            onChange={(active) => setForm({ ...form, active })}
          />
        </form>
      </SectionCard>
      <FormActionBar>
        <button type="button" className="ghost-button" disabled={busy} onClick={onBack}><X size={16} />ยกเลิก</button>
        <button type="submit" form="agent-detail-form" className="primary-button" disabled={busy}><Save size={16} />บันทึก</button>
      </FormActionBar>
    </div>
  );
}
