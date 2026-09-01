"use client";

import { useEffect, useMemo, useState } from "react";
import { getWixStep2Progress, type SeoPage, type SeoState } from "@/lib/seo-config";

type Tab = "checklist" | "pages" | "redirects" | "settings";
const LOCAL_KEY = "bhutan-center-seo-draft-v1";

function StatusIcon({ ok }: { ok: boolean }) {
  return <span className={`seo-status-icon ${ok ? "ok" : "warn"}`}>{ok ? "✓" : "!"}</span>;
}

function taskLabel(key: keyof SeoPage["tasks"]) {
  return { title: "SEO title", description: "Meta description", alt: "Image ALT", links: "Internal links" }[key];
}

export default function SeoCenter({ initialState }: { initialState: SeoState }) {
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState<Tab>("checklist");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialState.pages[0]?.id ?? "");
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) setState(JSON.parse(saved));
      const sessionToken = sessionStorage.getItem("bhutan-admin-token");
      if (sessionToken) setToken(sessionToken);
    } catch {}
  }, []);

  const progress = useMemo(() => getWixStep2Progress(state.pages), [state.pages]);
  const selected = state.pages.find((page) => page.id === selectedId) ?? state.pages[0];
  const filteredPages = state.pages.filter((page) => page.name.toLowerCase().includes(query.toLowerCase()) || page.currentPath.toLowerCase().includes(query.toLowerCase()));

  function updatePage(id: string, patch: Partial<SeoPage>) {
    setState((prev) => ({ ...prev, pages: prev.pages.map((page) => page.id === id ? { ...page, ...patch } : page) }));
  }

  function toggleTask(page: SeoPage, key: keyof SeoPage["tasks"]) {
    updatePage(page.id, { tasks: { ...page.tasks, [key]: !page.tasks[key] } });
  }

  async function save() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    if (token) sessionStorage.setItem("bhutan-admin-token", token);
    setNotice("บันทึก Draft ใน Browser แล้ว");
    try {
      const response = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ state }),
      });
      if (response.ok) setNotice("บันทึก SEO ลงฐานข้อมูลเรียบร้อยแล้ว");
      else if (response.status === 503) setNotice("บันทึก Draft แล้ว · เชื่อม Supabase + Admin Token เพื่อบันทึกแบบถาวร");
      else if (response.status === 401) setNotice("บันทึก Draft แล้ว · Admin Token ไม่ถูกต้อง");
    } catch {
      setNotice("บันทึก Draft ใน Browser แล้ว · ยังไม่ได้เชื่อมฐานข้อมูล");
    }
  }

  function addRedirect() {
    setState((prev) => ({ ...prev, redirects: [...prev.redirects, { id: `r-${Date.now()}`, from: "", to: "", type: 301, enabled: true }] }));
  }

  const step1 = [
    ["Set the homepage’s title for search results", true],
    ["Add the homepage’s description for search results", true],
    ["Add text to the homepage", true],
    ["Allow indexing to make your homepage visible in search results", state.site.homepageIndexing],
    ["Optimize the site for mobile devices", state.site.mobileOptimized],
    ["Connect this site to a custom domain", state.site.customDomainConnected],
    ["Connect this site to Google Search Console", state.site.googleSearchConsoleConnected],
  ] as const;

  return <div className="seo-admin-shell">
    <aside className="seo-sidebar">
      <div className="seo-brand"><span className="seo-brand-mark">BC</span><div><strong>BHUTAN CENTER</strong><small>Website Admin</small></div></div>
      <nav>
        <button className={tab === "checklist" ? "active" : ""} onClick={() => setTab("checklist")}>✓ SEO Setup Checklist</button>
        <button className={tab === "pages" ? "active" : ""} onClick={() => setTab("pages")}>▤ Pages & Metadata</button>
        <button className={tab === "redirects" ? "active" : ""} onClick={() => setTab("redirects")}>↪ Redirect Manager</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>⚙ SEO & GEO Settings</button>
      </nav>
      <div className="seo-sidebar-note"><strong>SEO-safe migration</strong><span>Preserve URL history, metadata, canonical, sitemap and Search Console signals.</span></div>
    </aside>

    <main className="seo-admin-main">
      <header className="seo-admin-header">
        <div><span className="seo-breadcrumb">Website / SEO & GEO</span><h1>{tab === "checklist" ? "SEO Setup Checklist" : tab === "pages" ? "Pages & Metadata" : tab === "redirects" ? "Redirect Manager" : "SEO & GEO Settings"}</h1><p>Imported from the Wix SEO checklist snapshot · 1 Sep 2026</p></div>
        <div className="seo-save-box"><input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Admin token"/><button onClick={save}>Save changes</button>{notice && <small>{notice}</small>}</div>
      </header>

      {tab === "checklist" && <>
        <section className="seo-top-strip"><div><span>Business / Brand Name</span><strong>{state.site.brandName}</strong></div><div><span>Keywords</span><strong>{state.site.keywords.join(", ")}</strong></div></section>
        <div className="seo-stat-grid">
          <div className="seo-stat"><span>Wix baseline</span><strong>{progress.completed}/{progress.total}</strong><small>{progress.missing} tasks need attention</small></div>
          <div className="seo-stat"><span>Homepage</span><strong>7/7</strong><small>Google-ready checklist</small></div>
          <div className="seo-stat"><span>Imported pages</span><strong>{state.pages.length}</strong><small>44 pages captured from Wix</small></div>
          <div className="seo-stat"><span>Migration protection</span><strong>ON</strong><small>Legacy URL lock + canonical</small></div>
        </div>

        <section className="seo-panel">
          <div className="seo-panel-heading"><div><span>Step 1</span><h2>Get the homepage ready for Google Search</h2></div><div className="seo-progress-pill">7/7 ✓</div></div>
          {step1.map(([label, ok]) => <div className="seo-check-row" key={label}><StatusIcon ok={ok}/><span>{label}</span></div>)}
        </section>

        <section className="seo-panel">
          <div className="seo-panel-heading"><div><span>Step 2</span><h2>Optimize the site pages for search engines</h2></div><div className="seo-progress-pill">{progress.completed}/{progress.total}</div></div>
          <div className="seo-inline-toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาหน้า..."/><span>{filteredPages.length} pages</span></div>
          <div className="seo-checklist-pages">
            {filteredPages.map((page) => {
              const keys: (keyof SeoPage["tasks"])[] = page.name === "หน้าหลัก" ? ["alt", "links"] : ["title", "description", "alt", "links"];
              return <div className="seo-page-block" key={page.id}>
                <button className="seo-page-title" onClick={() => { setSelectedId(page.id); setTab("pages"); }}><strong>{page.name}</strong><span>{page.legacyUrl || page.currentPath || "URL pending"} →</span></button>
                {keys.map((key) => <button className="seo-check-row seo-check-button" key={key} onClick={() => toggleTask(page, key)}><StatusIcon ok={page.tasks[key]}/><span>{taskLabel(key)}</span><small>{page.tasks[key] ? "Complete" : "Needs attention"}</small></button>)}
              </div>;
            })}
          </div>
        </section>

        <section className="seo-panel">
          <div className="seo-panel-heading"><div><span>Step 3</span><h2>Keep building on this site's SEO progress</h2></div></div>
          <div className="seo-assistant-grid">
            <div><strong>SEO Assistant</strong><p>ตรวจ title, description, H1, ALT, internal links และ indexability เป็นระยะ</p></div>
            <div><strong>Search Console Watch</strong><p>หลังย้ายเว็บให้ติดตาม Coverage, Clicks, Impressions และหน้า 404 เพื่อจับ Ranking drop เร็วที่สุด</p></div>
            <div><strong>SEO + GEO</strong><p>ใช้ Structured Data, เนื้อหาที่ตอบคำถามชัดเจน และข้อมูลบริษัทที่สอดคล้องกัน เพื่อรองรับทั้ง Search และ AI discovery</p></div>
          </div>
        </section>
      </>}

      {tab === "pages" && <div className="seo-editor-layout">
        <section className="seo-page-list-panel">
          <input className="seo-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pages"/>
          {filteredPages.map((page) => <button key={page.id} className={`seo-page-list-item ${selected?.id === page.id ? "active" : ""}`} onClick={() => setSelectedId(page.id)}><span>{page.name}</span><small>{Object.values(page.tasks).filter(Boolean).length}/4</small></button>)}
        </section>
        {selected && <section className="seo-editor-card">
          <div className="seo-editor-title"><div><span>Page SEO</span><h2>{selected.name}</h2></div><label className="seo-switch"><input type="checkbox" checked={selected.indexable} onChange={(e) => updatePage(selected.id, { indexable: e.target.checked })}/><span/> Index</label></div>
          <label>SEO title<input value={selected.title} onChange={(e) => updatePage(selected.id, { title: e.target.value, ogTitle: e.target.value })}/><small>{selected.title.length} characters</small></label>
          <label>Meta description<textarea rows={4} value={selected.description} onChange={(e) => updatePage(selected.id, { description: e.target.value, ogDescription: e.target.value })}/><small>{selected.description.length} characters</small></label>
          <div className="seo-two-col"><label>Current website path<input value={selected.currentPath} onChange={(e) => updatePage(selected.id, { currentPath: e.target.value })}/></label><label>Legacy Wix URL<input value={selected.legacyUrl ?? ""} onChange={(e) => updatePage(selected.id, { legacyUrl: e.target.value })} disabled={selected.lockLegacyUrl}/>{selected.lockLegacyUrl && <small>🔒 Locked to protect existing ranking</small>}</label></div>
          <label>Canonical URL<input value={selected.canonicalUrl ?? ""} onChange={(e) => updatePage(selected.id, { canonicalUrl: e.target.value })}/></label>
          <label>Focus keywords<input value={selected.focusKeywords.join(", ")} onChange={(e) => updatePage(selected.id, { focusKeywords: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })}/></label>
          <div className="seo-two-col"><label>Schema type<select value={selected.schemaType} onChange={(e) => updatePage(selected.id, { schemaType: e.target.value as SeoPage["schemaType"] })}><option>WebPage</option><option>TouristTrip</option><option>Article</option><option>Hotel</option><option>FAQPage</option></select></label><label>OG Image<input value={selected.ogImage ?? ""} onChange={(e) => updatePage(selected.id, { ogImage: e.target.value })} placeholder="https://..."/></label></div>
          <div className="seo-task-editor"><strong>Checklist</strong>{(["title","description","alt","links"] as const).map((key) => <button key={key} onClick={() => toggleTask(selected, key)}><StatusIcon ok={selected.tasks[key]}/>{taskLabel(key)}</button>)}</div>
          <div className="seo-google-preview"><span>Google preview</span><h3>{selected.title}</h3><small>{selected.canonicalUrl || `${state.site.domain}${selected.currentPath}`}</small><p>{selected.description}</p></div>
        </section>}
      </div>}

      {tab === "redirects" && <section className="seo-panel">
        <div className="seo-panel-heading"><div><span>Migration safety</span><h2>301 / 308 Redirect Manager</h2><p>ใช้เฉพาะหน้าที่จำเป็นต้องเปลี่ยน URL; หน้าที่มี Ranking ดีควรรักษา URL เดิมก่อน</p></div><button className="seo-secondary-button" onClick={addRedirect}>+ Add redirect</button></div>
        <div className="seo-redirect-head"><span>Old URL</span><span>Destination</span><span>Type</span><span>Status</span></div>
        {state.redirects.map((rule, index) => <div className="seo-redirect-row" key={rule.id}><input value={rule.from} onChange={(e) => setState(prev => ({...prev, redirects: prev.redirects.map((r,i) => i===index ? {...r,from:e.target.value}:r)}))}/><input value={rule.to} onChange={(e) => setState(prev => ({...prev, redirects: prev.redirects.map((r,i) => i===index ? {...r,to:e.target.value}:r)}))}/><select value={rule.type} onChange={(e) => setState(prev => ({...prev, redirects: prev.redirects.map((r,i) => i===index ? {...r,type:Number(e.target.value) as 301|308}:r)}))}><option value="301">301</option><option value="308">308</option></select><label className="seo-switch"><input type="checkbox" checked={rule.enabled} onChange={(e) => setState(prev => ({...prev, redirects: prev.redirects.map((r,i) => i===index ? {...r,enabled:e.target.checked}:r)}))}/><span/> {rule.enabled ? "Active" : "Draft"}</label></div>)}
        <div className="seo-warning-box"><strong>Important</strong><p>อย่าเปิด Redirect จนกว่าจะยืนยัน URL Mapping ครบทุกหน้าจาก Wix และทดสอบ staging แล้ว เพราะเป้าหมายของการย้ายครั้งนี้คือรักษา Ranking เดิมให้มากที่สุด</p></div>
      </section>}

      {tab === "settings" && <div className="seo-settings-grid">
        <section className="seo-panel"><div className="seo-panel-heading"><div><span>Site identity</span><h2>Business & Keywords</h2></div></div><label>Business / Brand Name<input value={state.site.brandName} onChange={(e) => setState(prev => ({...prev,site:{...prev.site,brandName:e.target.value}}))}/></label><label>Website name<input value={state.site.siteName} onChange={(e) => setState(prev => ({...prev,site:{...prev.site,siteName:e.target.value}}))}/></label><label>Primary domain<input value={state.site.domain} onChange={(e) => setState(prev => ({...prev,site:{...prev.site,domain:e.target.value}}))}/></label><label>Target keywords<textarea rows={5} value={state.site.keywords.join("\n")} onChange={(e) => setState(prev => ({...prev,site:{...prev.site,keywords:e.target.value.split("\n").map(x=>x.trim()).filter(Boolean)}}))}/></label></section>
        <section className="seo-panel"><div className="seo-panel-heading"><div><span>Technical SEO</span><h2>Search & GEO Controls</h2></div></div>{[
          ["googleSearchConsoleConnected","Google Search Console connected"], ["customDomainConnected","Custom domain connected"], ["homepageIndexing","Homepage indexing"], ["mobileOptimized","Mobile optimized"], ["sitemapEnabled","Automatic sitemap.xml"], ["robotsEnabled","robots.txt"], ["organizationSchemaEnabled","TravelAgency / Organization Schema"], ["geoEnabled","GEO / AI discovery fields"],
        ].map(([key,label]) => <label className="seo-setting-toggle" key={key}><div><strong>{label}</strong><small>{key === "geoEnabled" ? "Structured facts, clear entity data and crawlable answers for AI discovery." : "Managed by the website SEO layer."}</small></div><input type="checkbox" checked={Boolean(state.site[key as keyof SeoState["site"]])} onChange={(e) => setState(prev => ({...prev,site:{...prev.site,[key]:e.target.checked}}))}/></label>)}</section>
        <section className="seo-panel seo-full"><div className="seo-panel-heading"><div><span>Migration gate</span><h2>Do not switch the domain until these are green</h2></div></div><div className="seo-migration-grid"><div>✓ Export Wix URLs + metadata</div><div>✓ Preserve high-ranking URLs</div><div>✓ Canonical tags</div><div>✓ XML sitemap</div><div>✓ robots.txt</div><div>✓ Structured Data</div><div>○ Validate all redirects</div><div>○ Compare staging vs Wix</div><div>○ Re-submit sitemap after launch</div><div>○ Watch Search Console 30 days</div></div></section>
      </div>}
    </main>
  </div>;
}
