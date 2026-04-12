const state = {
  reports: [],
  filtered: [],
  activeDate: null,
  activeDoc: 'report',
};

const els = {
  reportList: document.getElementById('reportList'),
  pageTitle: document.getElementById('pageTitle'),
  pageMeta: document.getElementById('pageMeta'),
  docTabs: document.getElementById('docTabs'),
  viewer: document.getElementById('viewer'),
  searchInput: document.getElementById('searchInput'),
  relatedLinks: document.getElementById('relatedLinks'),
};

const DOC_LABELS = {
  report: '主報告',
  autoReport: '自動摘要',
  patreon: 'Patreon 長文',
  telegram: 'Telegram',
  threads: 'Threads',
  discord: 'Discord',
};

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.json();
}

async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  return res.text();
}

function getReportByDate(date) {
  return state.reports.find((item) => item.date === date);
}

function buildDocOptions(report) {
  const docs = [
    { key: 'report', label: DOC_LABELS.report, path: report.reportPath },
  ];
  if (report.autoReportPath) docs.push({ key: 'autoReport', label: DOC_LABELS.autoReport, path: report.autoReportPath });
  for (const key of ['patreon', 'telegram', 'threads', 'discord']) {
    if (report.posts?.[key]) docs.push({ key, label: DOC_LABELS[key], path: report.posts[key] });
  }
  return docs;
}

function renderList() {
  els.reportList.innerHTML = '';
  if (!state.filtered.length) {
    els.reportList.innerHTML = '<p class="muted">冇符合結果。</p>';
    return;
  }
  state.filtered.forEach((report) => {
    const a = document.createElement('a');
    a.href = `?date=${encodeURIComponent(report.date)}`;
    a.className = `report-item ${report.date === state.activeDate ? 'active' : ''}`;
    a.innerHTML = `<div class="date">${report.date}</div><div class="sub">主報告${report.autoReportPath ? ' + 自動摘要' : ''}</div>`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      state.activeDate = report.date;
      state.activeDoc = 'report';
      syncUrl();
      render();
    });
    els.reportList.appendChild(a);
  });
}

function renderTabs(report) {
  const docs = buildDocOptions(report);
  els.docTabs.innerHTML = '';
  docs.forEach((doc) => {
    const button = document.createElement('button');
    button.className = `doc-tab ${doc.key === state.activeDoc ? 'active' : ''}`;
    button.textContent = doc.label;
    button.addEventListener('click', () => {
      state.activeDoc = doc.key;
      render();
    });
    els.docTabs.appendChild(button);
  });
}

function renderLinks(report) {
  const links = [];
  links.push({ label: '原始主報告', path: report.reportPath });
  if (report.autoReportPath) links.push({ label: '原始自動摘要', path: report.autoReportPath });
  if (report.autoJsonPath) links.push({ label: '自動摘要 JSON', path: report.autoJsonPath });
  for (const [key, path] of Object.entries(report.posts || {})) {
    links.push({ label: `${DOC_LABELS[key]} 原文`, path });
  }
  els.relatedLinks.innerHTML = '';
  links.forEach((item) => {
    const a = document.createElement('a');
    a.href = item.path;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.textContent = item.label;
    els.relatedLinks.appendChild(a);
  });
}

async function renderViewer(report) {
  const doc = buildDocOptions(report).find((item) => item.key === state.activeDoc) || buildDocOptions(report)[0];
  const markdown = await fetchText(doc.path);
  const html = marked.parse(markdown, { breaks: true, gfm: true });
  els.viewer.innerHTML = DOMPurify.sanitize(html);
}

function syncUrl() {
  const url = new URL(window.location.href);
  if (state.activeDate) url.searchParams.set('date', state.activeDate);
  history.replaceState({}, '', url);
}

async function render() {
  renderList();
  const report = getReportByDate(state.activeDate);
  if (!report) {
    els.pageTitle.textContent = '未有報告';
    els.pageMeta.textContent = '等第一份報告出現。';
    els.docTabs.innerHTML = '';
    els.relatedLinks.innerHTML = '';
    els.viewer.textContent = '暫時冇內容。';
    return;
  }
  els.pageTitle.textContent = report.title;
  els.pageMeta.textContent = `日期：${report.date}`;
  renderTabs(report);
  renderLinks(report);
  els.viewer.textContent = '載入中...';
  try {
    await renderViewer(report);
  } catch (err) {
    els.viewer.textContent = `讀取失敗: ${err.message}`;
  }
}

function applyFilter() {
  const q = els.searchInput.value.trim().toLowerCase();
  state.filtered = !q ? state.reports : state.reports.filter((item) => item.date.toLowerCase().includes(q));
  if (!state.filtered.some((item) => item.date === state.activeDate)) {
    state.activeDate = state.filtered[0]?.date || null;
  }
  render();
}

async function init() {
  const data = await fetchJson('data/reports.json');
  state.reports = data.reports || [];
  state.filtered = [...state.reports];
  const urlDate = new URL(window.location.href).searchParams.get('date');
  state.activeDate = urlDate || state.reports[0]?.date || null;
  els.searchInput.addEventListener('input', applyFilter);
  await render();
}

init().catch((err) => {
  els.pageTitle.textContent = '初始化失敗';
  els.pageMeta.textContent = '';
  els.viewer.textContent = err.message;
});
