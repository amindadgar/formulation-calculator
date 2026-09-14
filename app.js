/* Formulation Cost & Price Calculator
   Plain JS, no dependencies, data persisted in localStorage. */

'use strict';

const STORAGE_KEY = 'formulation-costing-v2';

/* ---------------------------------------------------------------- units --
   Base units: mass -> gram, volume -> millilitre, count -> piece. */
const UNITS = {
  kg:  { dim: 'mass',   base: 1000  },
  g:   { dim: 'mass',   base: 1     },
  mg:  { dim: 'mass',   base: 0.001 },
  L:   { dim: 'volume', base: 1000  },
  mL:  { dim: 'volume', base: 1     },
  pcs: { dim: 'count',  base: 1     },
};
const PRICE_UNITS = ['kg', 'g', 'mg', 'L', 'mL', 'pcs'];
const BATCH_UNITS  = ['kg', 'g', 'L', 'mL'];
const unitsOfDim = dim => Object.keys(UNITS).filter(u => UNITS[u].dim === dim);

/* --------------------------------------------------------------- helpers */
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 10);
/* Persian (۰-۹) and Arabic-Indic (٠-٩) digits map onto ASCII by their low nibble. */
const toAscii = str => String(str).replace(/[\u0660-\u0669\u06F0-\u06F9]/g,
  d => String(d.charCodeAt(0) & 0xF));
const num = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const s = toAscii(v).replace(/\u066B/g, '.').replace(/[\s,\u066C\u060C_]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};
/* Thousands-grouped plain number, for money fields that run to nine digits. */
const grouped = v => (v === '' || v == null)
  ? '' : new Intl.NumberFormat(INPUT_LOCALE, { maximumFractionDigits: 6 }).format(num(v));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Currencies we render with a local symbol instead of the ISO code, plus the
   number of decimals they are actually quoted in. IRT (Toman) is not an ISO
   code — it is offered because Iranian prices are usually quoted in Toman. */
const CURRENCIES = {
  IRR: { key: 'currency.IRR.symbol', decimals: 0 },
  IRT: { key: 'currency.IRT.symbol', decimals: 0 },
};
const decCache = new Map();
function naturalDecimals(code) {
  if (CURRENCIES[code]) return CURRENCIES[code].decimals;
  if (decCache.has(code)) return decCache.get(code);
  let d = 2;
  try {
    d = new Intl.NumberFormat('en', { style: 'currency', currency: code })
      .resolvedOptions().maximumFractionDigits;
  } catch (e) { /* unknown code — fall back to 2 */ }
  decCache.set(code, d);
  return d;
}
function money(v) {
  if (!Number.isFinite(v)) return '—';
  const code = (state.settings.currency || '').toUpperCase();
  const base = naturalDecimals(code);
  /* show extra precision only for amounts smaller than one whole unit */
  const dec = (v !== 0 && Math.abs(v) < (base === 0 ? 1 : 0.5))
    ? (base === 0 ? 2 : 4) : base;
  const fmt = { minimumFractionDigits: dec, maximumFractionDigits: dec };

  if (CURRENCIES[code]) {
    return new Intl.NumberFormat(displayLocale(), fmt).format(v) + ' ' + t(CURRENCIES[code].key);
  }
  try {
    return new Intl.NumberFormat(displayLocale(),
      Object.assign({ style: 'currency', currency: code }, fmt)).format(v);
  } catch (e) {
    return new Intl.NumberFormat(displayLocale(), fmt).format(v) + (code ? ' ' + code : '');
  }
}
/* Large figures (a Rial batch cost runs to ten digits) get a compact echo. */
function compact(v) {
  if (!Number.isFinite(v) || Math.abs(v) < 1e6) return '';
  try {
    return '\u2248 ' + new Intl.NumberFormat(displayLocale(),
      { notation: 'compact', maximumFractionDigits: 2 }).format(v);
  } catch (e) { return ''; }
}
function trimNum(v, maxDec = 4) {
  if (!Number.isFinite(v)) return '—';
  return parseFloat(v.toFixed(maxDec)).toLocaleString(displayLocale(), { maximumFractionDigits: maxDec });
}
/* Pretty-print a quantity held in base units (g / mL / pcs). */
function unitLabel(u) { return t('units.' + u); }
function fmtQty(base, dim) {
  if (dim === 'count') return trimNum(base, 0) + ' ' + unitLabel('pcs');
  const big = dim === 'mass' ? 'kg' : 'L';
  const small = dim === 'mass' ? 'g' : 'mL';
  return Math.abs(base) >= 1000
    ? trimNum(base / 1000, 4) + ' ' + unitLabel(big)
    : trimNum(base, 4) + ' ' + unitLabel(small);
}
/* A type="number" input runs the browser's value sanitiser before this code
   ever sees it, and that sanitiser discards exactly the Persian (۰-۹) and
   Arabic-Indic digits, the Arabic decimal mark and the Arabic thousands
   separator that toAscii()/num() above exist to accept. Every numeric field is
   therefore a text field with the decimal keypad, parsed by num(). */
const NUMF = 'type="text" inputmode="decimal" data-num="1" autocomplete="off" spellcheck="false"';

function opts(list, selected) {
  return list.map(u =>
    `<option value="${u}"${u === selected ? ' selected' : ''}>${esc(unitLabel(u))}</option>`).join('');
}

/* ----------------------------------------------------------------- state */
let state = { settings: { currency: 'IRR' }, ingredients: [], formulations: [] };
let selectedId = null;
let activeTab = 'formulations';
let ingFilter = '';

const SEED_KEY = STORAGE_KEY + '-seeded';

/* Records that what is stored is the untouched demo, so signing in can replace
   it without claiming the user lost work. Any real edit clears the mark. */
function markDemoSeed()  { try { localStorage.setItem(SEED_KEY, 'demo-only'); } catch (e) {} }
function clearDemoSeed() { try { localStorage.removeItem(SEED_KEY); } catch (e) {} }

function save() {
  /* localStorage is always written: it is the offline cache as well as the
     whole story when no API is configured. */
  clearDemoSeed();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn(t('console.couldNotSave'), e); }
  if (api.enabled && api.user) schedulePush();
}

/* --------------------------------------------------------------- syncing --
   Edits fire on every keystroke, so pushes are debounced and never overlap:
   a push in flight sets pushAgain, and the next one starts when it lands. */
let pushTimer = null, pushing = false, pushAgain = false;

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 1200);
}

async function pushNow() {
  if (!api.enabled || !api.user) return;
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  syncStatus('saving');
  try {
    const res = await apiState.push(state);
    if (res.conflict) { await handleConflict(res.current); }
    else syncStatus('saved');
  } catch (e) {
    syncStatus(e.code === 'network' ? 'offline' : 'error', e);
  } finally {
    pushing = false;
    if (pushAgain) { pushAgain = false; schedulePush(); }
  }
}

/* Someone else saved while this tab was editing. Never resolve it silently —
   one of the two edits is going to lose, so the person present decides. */
async function handleConflict(current) {
  const who = (current && (current.updated_by_name || current.updated_by_email)) || '—';
  const keepMine = confirm(
    t('sync.conflict', { name: who }) + '\n\n' +
    'OK = ' + t('sync.conflictOverwrite') + '\n' +
    'Cancel = ' + t('sync.conflictReload')
  );
  if (keepMine) {
    api.version = current ? current.version : null;   /* rebase and force ours */
    await pushNow();
  } else {
    adoptServerState(current);
    syncStatus('saved');
  }
}

function adoptServerState(payload) {
  if (!payload || !payload.data) return;
  state = normalise(payload.data);
  api.version = payload.version;
  selectedId = state.formulations.length ? state.formulations[0].id : null;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  render();
}

function syncStatus(kind, err) {
  const el = $('#who');
  if (!el || !api.user) return;
  const name = api.user.name || api.user.email;
  const suffix = kind === 'saving' ? ' · ' + t('sync.saving')
    : kind === 'offline' ? ' · ' + t('sync.offline')
    : kind === 'error' ? ' · ' + t('auth.err.generic')
    : '';
  el.textContent = t('auth.signedInAs', { name }) + suffix;
  el.classList.toggle('is-offline', kind === 'offline' || kind === 'error');
  if (err) console.warn('sync:', err.code || err.message);
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { state = normalise(JSON.parse(raw)); return true; }
  } catch (e) { console.warn(t('console.couldNotLoad'), e); }
  return false;
}
function normalise(data) {
  const s = {
    settings: { currency: (data && data.settings && data.settings.currency) || 'IRR' },
    ingredients: Array.isArray(data && data.ingredients) ? data.ingredients : [],
    formulations: Array.isArray(data && data.formulations) ? data.formulations : [],
  };
  s.ingredients = s.ingredients.map(i => ({
    id: i.id || uid(), name: i.name || '', code: i.code || '', supplier: i.supplier || '',
    price: num(i.price), unit: UNITS[i.unit] ? i.unit : 'kg',
    density: i.density === '' || i.density == null ? '' : num(i.density),
  }));
  s.formulations = s.formulations.map(f => ({
    id: f.id || uid(),
    name: f.name || t('defaults.untitledProduct'),
    code: f.code || '',
    mode: f.mode === 'absolute' ? 'absolute' : 'percent',
    batchSize: num(f.batchSize) || 100,
    batchUnit: BATCH_UNITS.includes(f.batchUnit) ? f.batchUnit : 'kg',
    overagePct: num(f.overagePct),
    fillSize: num(f.fillSize) || 50,
    fillUnit: UNITS[f.fillUnit] ? f.fillUnit : 'g',
    packagingPerUnit: num(f.packagingPerUnit),
    laborPerBatch: num(f.laborPerBatch),
    overheadPct: num(f.overheadPct),
    markupPct: num(f.markupPct),
    vatPct: num(f.vatPct),
    notes: f.notes || '',
    lines: (Array.isArray(f.lines) ? f.lines : []).map(l => ({
      ingredientId: l.ingredientId || '',
      phase: l.phase || '',
      value: num(l.value),
      unit: UNITS[l.unit] ? l.unit : 'g',
    })),
  }));
  return s;
}
const getIng = id => state.ingredients.find(i => i.id === id) || null;
const getForm = id => state.formulations.find(f => f.id === id) || null;

/* ------------------------------------------------------------ costing --- 
   Everything below is pure: given a formulation it returns the full cost
   breakdown plus any validation problems found along the way. */
function compute(f) {
  const batchU = UNITS[f.batchUnit];
  const batchBase = num(f.batchSize) * batchU.base;      // g or mL
  const overage = 1 + num(f.overagePct) / 100;
  const msgs = [];
  const lines = [];

  let materialCost = 0;
  let qtyInBatchDim = 0;          // summed net quantity expressed in the batch dimension
  let pctSum = 0;
  let mixedDims = false;

  f.lines.forEach((l, idx) => {
    const ing = getIng(l.ingredientId);
    const r = { idx, line: l, ing, netBase: 0, dim: batchU.dim, cost: 0, pct: 0, error: null };

    if (!ing) {
      r.error = t('validation.noIngredientSelected');
      lines.push(r);
      return;
    }

    /* net quantity required by the recipe */
    if (f.mode === 'percent') {
      r.pct = num(l.value);
      pctSum += r.pct;
      r.netBase = batchBase * r.pct / 100;
      r.dim = batchU.dim;
    } else {
      const u = UNITS[l.unit] || UNITS.g;
      r.netBase = num(l.value) * u.base;
      r.dim = u.dim;
    }
    if (r.dim === batchU.dim) qtyInBatchDim += r.netBase;
    else mixedDims = true;

    /* quantity actually purchased, including manufacturing overage */
    const grossBase = r.netBase * overage;

    /* convert into the dimension the ingredient is priced in */
    const ingU = UNITS[ing.unit];
    let qtyForPricing = grossBase;
    if (r.dim !== ingU.dim) {
      const d = num(ing.density);
      if (r.dim === 'count' || ingU.dim === 'count') {
        r.error = t('validation.cannotConvertCount', {
          name: ing.name || t('defaults.ingredient'), unit: iso(unitLabel(ing.unit)), dim: t('dim.' + r.dim) });
      } else if (d <= 0) {
        r.error = t('validation.needsDensity', {
          name: ing.name || t('defaults.ingredient'), unit: iso(unitLabel(ing.unit)), dim: t('dim.' + r.dim) });
      } else if (r.dim === 'mass') {
        qtyForPricing = grossBase / d;   // g ÷ (g/mL) = mL
      } else {
        qtyForPricing = grossBase * d;   // mL × (g/mL) = g
      }
    }

    if (!r.error) {
      r.grossBase = grossBase;
      r.unitCostBase = num(ing.price) / ingU.base;   // cost per g / mL / piece
      r.cost = qtyForPricing * r.unitCostBase;
      materialCost += r.cost;
      if (num(ing.price) <= 0) {
        msgs.push({ type: 'warn', text: t('validation.noPrice', { name: ing.name || t('defaults.unnamedIngredient') }) });
      }
    }
    lines.push(r);
  });

  lines.forEach(r => { if (r.error) msgs.push({ type: 'err',
    text: t('validation.linePrefix', { n: iso(trimNum(r.idx + 1, 0)), message: r.error }) }); });

  /* recipe sanity checks */
  if (!f.lines.length) msgs.push({ type: 'warn', text: t('validation.noLines') });
  if (f.mode === 'percent' && f.lines.length && Math.abs(pctSum - 100) > 0.005) {
    msgs.push({
      type: 'warn',
      text: t(pctSum > 100 ? 'validation.percentSumOverfilled' : 'validation.percentSumUnderfilled', {
        sum: iso(trimNum(pctSum, 3)),
        batch: iso(trimNum(num(f.batchSize)) + ' ' + unitLabel(f.batchUnit)),
      }),
    });
  }
  if (f.mode === 'absolute' && f.lines.length && !mixedDims && batchBase > 0
      && Math.abs(qtyInBatchDim - batchBase) / batchBase > 0.005) {
    msgs.push({
      type: 'warn',
      text: t('validation.quantityMismatch', {
        total: iso(fmtQty(qtyInBatchDim, batchU.dim)),
        batch: iso(fmtQty(batchBase, batchU.dim)),
      }),
    });
  }

  /* units produced */
  const fillU = UNITS[f.fillUnit] || UNITS.g;
  let unitsPerBatch = 0;
  if (fillU.dim !== batchU.dim) {
    msgs.push({ type: 'err', text: t('validation.fillUnitMismatch', {
      fillUnit: iso(unitLabel(f.fillUnit)), batchUnit: iso(unitLabel(f.batchUnit)) }) });
  } else if (num(f.fillSize) > 0) {
    unitsPerBatch = Math.floor(batchBase / (num(f.fillSize) * fillU.base));
  }
  if (unitsPerBatch < 1) {
    msgs.push({ type: 'warn', text: t('validation.tooFewUnits') });
  }

  /* money */
  const packaging = num(f.packagingPerUnit) * unitsPerBatch;
  const labor = num(f.laborPerBatch);
  const direct = materialCost + packaging + labor;
  const overhead = direct * num(f.overheadPct) / 100;
  const totalCost = direct + overhead;

  const divisor = unitsPerBatch > 0 ? unitsPerBatch : NaN;
  const costPerUnit = totalCost / divisor;
  const materialPerUnit = materialCost / divisor;
  const priceExVat = costPerUnit * (1 + num(f.markupPct) / 100);
  const priceIncVat = priceExVat * (1 + num(f.vatPct) / 100);
  const grossMargin = priceExVat > 0 ? (priceExVat - costPerUnit) / priceExVat * 100 : NaN;
  const profitPerBatch = (priceExVat - costPerUnit) * unitsPerBatch;

  return {
    lines, msgs, batchBase, batchDim: batchU.dim, pctSum, qtyInBatchDim, mixedDims,
    materialCost, packaging, labor, overhead, totalCost, unitsPerBatch,
    costPerUnit, materialPerUnit, priceExVat, priceIncVat, grossMargin, profitPerBatch,
    revenuePerBatch: priceExVat * unitsPerBatch,
  };
}

/* ================================================================ RENDER */

function render() {
  $('#currency').value = state.settings.currency;
  $$('#tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === activeTab));
  $('#view-ingredients').hidden = activeTab !== 'ingredients';
  $('#view-formulations').hidden = activeTab !== 'formulations';
  if (activeTab === 'ingredients') renderIngredients();
  else { renderFormList(); renderEditor(); }
}

/* ---------------------------------------------------------- ingredients */
function renderIngredients() {
  const q = ingFilter.trim().toLowerCase();
  const rows = state.ingredients.filter(i => !q ||
    (i.name + ' ' + i.code + ' ' + i.supplier).toLowerCase().includes(q));

  $('#ing-empty').hidden = state.ingredients.length > 0;
  $('#ing-body').innerHTML = rows.map(i => {
    const perBase = num(i.price) / UNITS[i.unit].base;
    const baseLabel = UNITS[i.unit].dim === 'mass' ? 'g' : UNITS[i.unit].dim === 'volume' ? 'mL' : 'pcs';
    const used = state.formulations.filter(f => f.lines.some(l => l.ingredientId === i.id)).length;
    return `<tr data-id="${i.id}">
      <td data-label="${esc(t('ing.col.name'))}" data-span="full"><input data-field="name" dir="auto" value="${esc(i.name)}" placeholder="${esc(t('ingredients.placeholder.name'))}"></td>
      <td data-label="${esc(t('ing.col.code'))}"><input data-field="code" dir="auto" value="${esc(i.code)}" placeholder="${esc(t('ingredients.placeholder.code'))}"></td>
      <td data-label="${esc(t('ing.col.supplier'))}"><input data-field="supplier" dir="auto" value="${esc(i.supplier)}" placeholder="${esc(t('ingredients.placeholder.supplier'))}"></td>
      <td data-label="${esc(t('ing.col.price'))}"><input data-field="price" data-money="1" type="text" inputmode="decimal" value="${esc(grouped(i.price))}"></td>
      <td data-label="${esc(t('ing.col.per'))}"><select data-field="unit">${opts(PRICE_UNITS, i.unit)}</select></td>
      <td data-label="${esc(t('ing.col.density'))}"><input data-field="density" ${NUMF} value="${esc(i.density)}" placeholder="${esc(t('ingredients.placeholder.density'))}"></td>
      <td class="num" data-label="${esc(t('ing.col.unitcost'))}" title="${esc(used ? t('ingredients.usedIn', { n: used }) : t('ingredients.notUsed'))}">${iso(t('ingredients.unitCostCell', { money: money(perBase), baseUnit: unitLabel(baseLabel) }))}</td>
      <td class="act"><button class="danger small" data-act="del-ing" type="button" title="${esc(t('common.deleteTitle'))}">✕</button></td>
    </tr>`;
  }).join('');
}

/* ---------------------------------------------------------- formulations */
function renderFormList() {
  const list = $('#form-list');
  $('#form-empty').hidden = state.formulations.length > 0;
  list.innerHTML = state.formulations.map(f => {
    const c = compute(f);
    return `<li class="${f.id === selectedId ? 'active' : ''}">
      <button data-id="${f.id}" type="button">${esc(f.name || t('defaults.untitled'))}
        <span class="meta">${Number.isFinite(c.costPerUnit)
          ? iso(t('formList.unitCostSuffix', { money: money(c.costPerUnit) }))
          : esc(t('formList.notCosted'))}</span>
      </button></li>`;
  }).join('');
}

function renderEditor() {
  const ed = $('#editor');
  const f = getForm(selectedId);
  if (!f) { ed.innerHTML = `<p class="empty">${esc(t('editor.emptyState'))}</p>`; return; }

  const batchDim = UNITS[f.batchUnit].dim;
  const fillOpts = unitsOfDim(batchDim);
  if (!fillOpts.includes(f.fillUnit)) f.fillUnit = batchDim === 'mass' ? 'g' : 'mL';

  ed.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>${esc(t('editor.heading.product'))}</h2>
        <div class="actions">
          <button class="ghost small" data-act="print" type="button">${esc(t('editor.action.print'))}</button>
          <button class="ghost small" data-act="dup" type="button">${esc(t('editor.action.duplicate'))}</button>
          <button class="danger small" data-act="del-form" type="button">${esc(t('editor.action.delete'))}</button>
        </div>
      </div>
      <div class="fields">
        <div class="field span2">
          <label>${esc(t('editor.field.productName'))}</label>
          <input data-f="name" dir="auto" value="${esc(f.name)}" placeholder="${esc(t('editor.placeholder.productName'))}">
        </div>
        <div class="field"><label>${esc(t('editor.field.productCode'))}</label>
          <input data-f="code" dir="auto" value="${esc(f.code)}" placeholder="${esc(t('editor.placeholder.productCode'))}"></div>
        <div class="field"><label>${esc(t('editor.field.batchSize'))}</label>
          <div class="row">
            <input data-f="batchSize" ${NUMF} value="${esc(f.batchSize)}">
            <select data-f="batchUnit" data-rerender="1">${opts(BATCH_UNITS, f.batchUnit)}</select>
          </div>
        </div>
        <div class="field"><label>${esc(t('editor.field.fillSize'))}</label>
          <div class="row">
            <input data-f="fillSize" ${NUMF} value="${esc(f.fillSize)}">
            <select data-f="fillUnit">${opts(fillOpts, f.fillUnit)}</select>
          </div>
        </div>
        <div class="field"><label>${esc(t('editor.field.overagePct'))}</label>
          <input data-f="overagePct" ${NUMF} value="${esc(f.overagePct)}"></div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>${esc(t('editor.heading.formulation'))}</h2>
        <div class="actions no-print">
          <span class="seg">
            <button data-act="mode" data-mode="percent" class="${f.mode === 'percent' ? 'on' : ''}" type="button">${esc(t('editor.mode.percent'))}</button>
            <button data-act="mode" data-mode="absolute" class="${f.mode === 'absolute' ? 'on' : ''}" type="button">${esc(t('editor.mode.absolute'))}</button>
          </span>
          <button class="primary small" data-act="add-line" type="button">${esc(t('editor.action.addLine'))}</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="grid lines-table">
          <thead><tr>
            <th style="width:8%">${esc(t('lines.th.phase'))}</th>
            <th style="width:34%">${esc(t('lines.th.ingredient'))}</th>
            <th style="width:16%">${esc(f.mode === 'percent' ? t('lines.th.percentWw') : t('lines.th.quantity'))}</th>
            <th style="width:16%">${esc(t('lines.th.required'))}</th>
            <th style="width:18%">${esc(t('lines.th.cost'))}</th>
            <th style="width:8%"></th>
          </tr></thead>
          <tbody>${renderLines(f)}</tbody>
        </table>
      </div>
      <div style="margin-top:10px" id="sum-badge"></div>
    </section>

    <section class="card">
      <h2 style="margin-bottom:12px">${esc(t('editor.heading.otherCosts'))}</h2>
      <div class="fields">
        <div class="field"><label>${esc(t('editor.field.packagingPerUnit'))}</label>
          <input data-f="packagingPerUnit" data-money="1" type="text" inputmode="decimal" value="${esc(grouped(f.packagingPerUnit))}"></div>
        <div class="field"><label>${esc(t('editor.field.labourPerBatch'))}</label>
          <input data-f="laborPerBatch" data-money="1" type="text" inputmode="decimal" value="${esc(grouped(f.laborPerBatch))}"></div>
        <div class="field"><label>${esc(t('editor.field.overheadPct'))}</label>
          <input data-f="overheadPct" ${NUMF} value="${esc(f.overheadPct)}"></div>
        <div class="field"><label>${esc(t('editor.field.markupPct'))}</label>
          <input data-f="markupPct" ${NUMF} value="${esc(f.markupPct)}"></div>
        <div class="field"><label>${esc(t('editor.field.vatPct'))}</label>
          <input data-f="vatPct" ${NUMF} value="${esc(f.vatPct)}"></div>
        <div class="field wide"><label>${esc(t('editor.field.notes'))}</label>
          <textarea data-f="notes" dir="auto" rows="2" placeholder="${esc(t('editor.placeholder.notes'))}">${esc(f.notes)}</textarea></div>
      </div>
    </section>

    <section class="card" id="results"></section>`;

  renderResults();
}

function renderLines(f) {
  const options = state.ingredients
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map(i => `<option value="${i.id}">${esc(i.name || t('defaults.unnamed'))}${i.code ? ' (' + esc(i.code) + ')' : ''}</option>`)
    .join('');

  if (!f.lines.length) {
    return `<tr><td colspan="6" class="empty small empty-cell">${esc(t('lines.empty'))}</td></tr>`;
  }
  return f.lines.map((l, idx) => `<tr data-idx="${idx}">
    <td data-label="${esc(t('lines.th.phase'))}"><input data-lf="phase" dir="auto" value="${esc(l.phase)}" placeholder="${esc(t('lines.placeholder.phase'))}"></td>
    <td data-label="${esc(t('lines.th.ingredient'))}" data-span="full"><select data-lf="ingredientId" dir="auto">
        <option value="">${esc(t('lines.chooseOption'))}</option>${options}
      </select></td>
    <td data-label="${esc(f.mode === 'percent' ? t('lines.th.percentWw') : t('lines.th.quantity'))}">${f.mode === 'percent'
        ? `<input data-lf="value" ${NUMF} value="${esc(l.value)}">`
        : `<div class="lf-row">
             <input data-lf="value" ${NUMF} value="${esc(l.value)}">
             <select data-lf="unit" class="lf-unit">${opts(PRICE_UNITS, l.unit)}</select>
           </div>`}</td>
    <td class="num" data-label="${esc(t('lines.th.required'))}" data-line-qty="${idx}">${esc(t('common.emptyValue'))}</td>
    <td class="num" data-label="${esc(t('lines.th.cost'))}" data-line-cost="${idx}">${esc(t('common.emptyValue'))}</td>
    <td class="act"><button class="danger small" data-act="del-line" type="button">✕</button></td>
  </tr>`).join('');
}

function renderResults() {
  const f = getForm(selectedId);
  if (!f) return;
  const c = compute(f);

  /* live cells inside the formulation table */
  c.lines.forEach(r => {
    const qc = $(`[data-line-qty="${r.idx}"]`);
    const cc = $(`[data-line-cost="${r.idx}"]`);
    if (qc) qc.innerHTML = r.error ? `<span class="line-err">${esc(t('common.emptyValue'))}</span>` : iso(fmtQty(r.grossBase, r.dim));
    if (cc) cc.innerHTML = r.error ? `<span class="line-err">${esc(r.error)}</span>` : iso(money(r.cost));
  });
  const badge = $('#sum-badge');
  if (badge) {
    if (f.mode === 'percent') {
      const ok = Math.abs(c.pctSum - 100) <= 0.005;
      badge.innerHTML = `<span class="badge ${ok ? 'ok' : 'bad'}">${esc(t('badge.totalPercent', { sum: trimNum(c.pctSum, 3) }))}</span>`;
    } else {
      badge.innerHTML = `<span class="badge ${c.mixedDims ? 'bad' : 'ok'}">${esc(t('badge.totalQuantity', {
        sum: fmtQty(c.qtyInBatchDim, c.batchDim),
        extra: c.mixedDims ? t('badge.mixedUnitsSuffix') : '',
        batch: fmtQty(c.batchBase, c.batchDim) }))}</span>`;
    }
  }

  /* keep the ingredient selects in sync (values are set after innerHTML) */
  $$('#editor tbody tr[data-idx]').forEach(tr => {
    const l = f.lines[+tr.dataset.idx];
    const s = tr.querySelector('[data-lf="ingredientId"]');
    if (s && l) s.value = l.ingredientId || '';
  });

  const rows = c.lines.map(r => {
    const share = c.materialCost > 0 ? r.cost / c.materialCost * 100 : 0;
    return `<tr>
      <td>${esc(r.line.phase || '')}</td>
      <td>${r.ing ? esc(r.ing.name || t('defaults.unnamed')) : `<i>${esc(t('results.missingIngredient'))}</i>`}</td>
      <td class="num">${r.error ? esc(t('common.emptyValue')) : iso(fmtQty(r.grossBase, r.dim))}</td>
      <td class="num">${r.error ? esc(t('common.emptyValue')) : iso(money(r.cost))}</td>
      <td class="num">${r.error ? esc(t('common.emptyValue')) : iso(trimNum(share, 1) + '%')}</td>
      <td style="width:22%"><div class="bar" style="width:${Math.max(0, Math.min(100, share))}%"></div></td>
    </tr>`;
  }).join('');

  const perUnit = v => Number.isFinite(v) ? money(v) : '—';
  const tile = (k, v, raw, hi) => {
    const c2 = raw == null ? '' : compact(raw);
    return `<div class="tot${hi ? ' hi' : ''}"><div class="k">${k}</div><div class="v">${v}</div>`
         + (c2 ? `<div class="c">${c2}</div>` : '') + `</div>`;
  };

  const broken = c.lines.filter(r => r.error).length;

  $('#results').innerHTML = `
    <div class="card-head"><h2>${esc(t('results.heading'))}</h2></div>

    ${broken ? `<div class="msg err" style="margin-bottom:12px">${esc(t('results.brokenLines', { n: broken, s: broken > 1 ? 's' : '' }))}</div>` : ''}

    <div class="totals">
      ${tile(t('results.tile.batchSize'), iso(fmtQty(c.batchBase, c.batchDim)))}
      ${tile(t('results.tile.unitsPerBatch'), iso(trimNum(c.unitsPerBatch, 0)))}
      ${tile(t('results.tile.totalBatchCost'), iso(money(c.totalCost)), c.totalCost)}
      ${tile(t('results.tile.costPerUnit'), iso(perUnit(c.costPerUnit)), c.costPerUnit)}
      ${tile(t('results.tile.priceExVat'), iso(perUnit(c.priceExVat)), c.priceExVat, true)}
      ${tile(t('results.tile.priceIncVat'), iso(perUnit(c.priceIncVat)), c.priceIncVat, true)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px" class="split">
      <div>
        <h3 style="margin-bottom:6px">${esc(t('results.buildUpHeading'))}</h3>
        <table class="plain">
          <tbody>
            <tr><td>${esc(t('results.row.rawMaterials'))}${num(f.overagePct) ? ` <span style="color:var(--muted)">${esc(t('results.row.overageNote', { pct: trimNum(num(f.overagePct)) }))}</span>` : ''}</td><td class="num">${iso(money(c.materialCost))}</td></tr>
            <tr><td>${esc(t('results.row.packaging', { units: trimNum(c.unitsPerBatch, 0), price: money(num(f.packagingPerUnit)) }))}</td><td class="num">${iso(money(c.packaging))}</td></tr>
            <tr><td>${esc(t('results.row.labour'))}</td><td class="num">${iso(money(c.labor))}</td></tr>
            <tr><td>${esc(t('results.row.overhead', { pct: trimNum(num(f.overheadPct)) }))}</td><td class="num">${iso(money(c.overhead))}</td></tr>
          </tbody>
          <tfoot><tr><td>${esc(t('results.row.totalBatchCost'))}</td><td class="num">${iso(money(c.totalCost))}</td></tr></tfoot>
        </table>
      </div>
      <div>
        <h3 style="margin-bottom:6px">${esc(t('results.perUnitHeading', { size: trimNum(num(f.fillSize)), unit: unitLabel(f.fillUnit) }))}</h3>
        <table class="plain">
          <tbody>
            <tr><td>${esc(t('results.row.rawMaterials'))}</td><td class="num">${iso(perUnit(c.materialPerUnit))}</td></tr>
            <tr><td>${esc(t('results.row.fullCost'))}</td><td class="num">${iso(perUnit(c.costPerUnit))}</td></tr>
            <tr><td>${esc(t('results.row.markup', { pct: trimNum(num(f.markupPct)) }))}</td><td class="num">${iso(perUnit(c.priceExVat - c.costPerUnit))}</td></tr>
            <tr><td>${esc(t('results.row.sellingPriceExVat'))}</td><td class="num">${iso(perUnit(c.priceExVat))}</td></tr>
            <tr><td>${esc(t('results.row.grossMargin'))}</td><td class="num">${Number.isFinite(c.grossMargin) ? iso(trimNum(c.grossMargin, 1) + '%') : esc(t('common.emptyValue'))}</td></tr>
            <tr><td>${esc(t('results.row.vat', { pct: trimNum(num(f.vatPct)) }))}</td><td class="num">${iso(perUnit(c.priceIncVat - c.priceExVat))}</td></tr>
          </tbody>
          <tfoot><tr><td>${esc(t('results.row.priceIncVat'))}</td><td class="num">${iso(perUnit(c.priceIncVat))}</td></tr></tfoot>
        </table>
        <table class="plain" style="margin-top:10px">
          <tbody>
            <tr><td>${esc(t('results.row.revenuePerBatch'))}</td><td class="num">${Number.isFinite(c.revenuePerBatch) ? iso(money(c.revenuePerBatch)) : esc(t('common.emptyValue'))}</td></tr>
            <tr><td>${esc(t('results.row.profitPerBatch'))}</td><td class="num">${Number.isFinite(c.profitPerBatch) ? iso(money(c.profitPerBatch)) : esc(t('common.emptyValue'))}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <h3 style="margin:18px 0 6px">${esc(t('results.breakdownHeading'))}</h3>
    <div class="table-wrap breakdown-wrap">
      <table class="plain breakdown">
        <thead><tr><th>${esc(t('results.breakdown.th.phase'))}</th><th>${esc(t('results.breakdown.th.ingredient'))}</th><th class="num">${esc(t('results.breakdown.th.quantity'))}</th><th class="num">${esc(t('results.breakdown.th.cost'))}</th><th class="num">${esc(t('results.breakdown.th.share'))}</th><th></th></tr></thead>
        <tbody>${rows || `<tr><td colspan="6" class="empty small">${esc(t('results.breakdown.empty'))}</td></tr>`}</tbody>
        <tfoot><tr><td colspan="3">${esc(t('results.breakdown.totalRawMaterial'))}</td><td class="num">${iso(money(c.materialCost))}</td><td class="num">${iso(trimNum(100, 0) + '%')}</td><td></td></tr></tfoot>
      </table>
    </div>

    ${c.msgs.length ? `<div class="msgs">${c.msgs.map(m =>
        `<div class="msg ${m.type === 'err' ? 'err' : 'warn'}">${esc(m.text)}</div>`).join('')}</div>` : ''}
  `;
}

/* ================================================================ EVENTS */

$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab');
  if (!b) return;
  activeTab = b.dataset.tab;
  try { history.replaceState(null, '', '#' + activeTab); } catch (err) { /* file:// */ }
  render();
});
function tabFromHash() {
  const h = (location.hash || '').replace('#', '');
  if (h === 'ingredients' || h === 'formulations') activeTab = h;
}
window.addEventListener('hashchange', () => { tabFromHash(); render(); });

$('#currency').addEventListener('input', e => {
  state.settings.currency = e.target.value.toUpperCase();
  save();
  if (activeTab === 'ingredients') renderIngredients(); else { renderFormList(); renderResults(); }
});

/* ---- ingredients ---- */
$('#btn-add-ing').addEventListener('click', () => {
  state.ingredients.push({ id: uid(), name: '', code: '', supplier: '', price: 0, unit: 'kg', density: '' });
  ingFilter = ''; $('#ing-search').value = '';
  save(); renderIngredients();
  const last = $('#ing-body tr:last-child input');
  if (last) last.focus();
});
$('#ing-search').addEventListener('input', e => { ingFilter = e.target.value; renderIngredients(); });

$('#ing-body').addEventListener('input', e => {
  const tr = e.target.closest('tr'); if (!tr) return;
  const ing = getIng(tr.dataset.id); if (!ing) return;
  const field = e.target.dataset.field; if (!field) return;
  if (field === 'price') ing.price = num(e.target.value);
  else if (field === 'density') ing.density = e.target.value === '' ? '' : num(e.target.value);
  else ing[field] = e.target.value;
  save();
  /* refresh the derived unit-cost cell only, so typing is not interrupted */
  const cell = tr.querySelector('td.num');
  if (cell) {
    const u = UNITS[ing.unit];
    cell.textContent = `${money(num(ing.price) / u.base)} / ${u.dim === 'mass' ? 'g' : u.dim === 'volume' ? 'mL' : 'pcs'}`;
  }
});
$('#ing-body').addEventListener('click', e => {
  if (!e.target.closest('[data-act="del-ing"]')) return;
  const tr = e.target.closest('tr');
  const ing = getIng(tr.dataset.id); if (!ing) return;
  const used = state.formulations.filter(f => f.lines.some(l => l.ingredientId === ing.id));
  if (used.length) {
    alert(t('dialog.ingredientInUse', {
      name: ing.name || t('defaults.thisIngredientCap'),
      list: used.map(f => t('dialog.bulletPrefix') + (f.name || t('defaults.untitled'))).join('\n'),
    }));
    return;
  }
  if (!confirm(t('dialog.confirmDeleteIngredient', { name: ing.name || t('defaults.thisIngredient') }))) return;
  state.ingredients = state.ingredients.filter(i => i.id !== ing.id);
  save(); renderIngredients();
});

/* ---- formulation list ---- */
$('#btn-add-form').addEventListener('click', () => {
  const f = normalise({ formulations: [{ name: t('defaults.newProduct'), markupPct: 60, overheadPct: 10, lines: [] }] }).formulations[0];
  state.formulations.push(f);
  selectedId = f.id;
  save(); render();
});
$('#form-list').addEventListener('click', e => {
  const b = e.target.closest('button[data-id]'); if (!b) return;
  selectedId = b.dataset.id;
  renderFormList(); renderEditor();
});

/* ---- editor ---- */
$('#editor').addEventListener('input', e => {
  const f = getForm(selectedId); if (!f) return;
  const t = e.target;

  if (t.dataset.f) {
    const key = t.dataset.f;
    f[key] = (t.dataset.num || t.dataset.money) ? num(t.value) : t.value;
    save();
    if (key === 'name') { renderFormList(); return renderResults(); }
    return renderResults();
  }
  if (t.dataset.lf) {
    const tr = t.closest('tr[data-idx]'); if (!tr) return;
    const l = f.lines[+tr.dataset.idx]; if (!l) return;
    const key = t.dataset.lf;
    l[key] = (t.dataset.num || t.dataset.money) ? num(t.value) : t.value;
    save(); renderFormList(); renderResults();
  }
});
$('#editor').addEventListener('change', e => {
  const t = e.target;
  if (t.tagName === 'SELECT' && t.dataset.rerender) { renderEditor(); renderFormList(); }
});
$('#editor').addEventListener('click', e => {
  const f = getForm(selectedId); if (!f) return;
  const btn = e.target.closest('button[data-act]'); if (!btn) return;
  const act = btn.dataset.act;

  if (act === 'add-line') {
    f.lines.push({ ingredientId: '', phase: '', value: 0, unit: f.mode === 'percent' ? 'g' : (UNITS[f.batchUnit].dim === 'mass' ? 'g' : 'mL') });
    save(); renderEditor();
    const last = $('#editor tbody tr:last-child select[data-lf="ingredientId"]');
    if (last) last.focus();
  }
  else if (act === 'del-line') {
    const tr = btn.closest('tr[data-idx]');
    f.lines.splice(+tr.dataset.idx, 1);
    save(); renderEditor(); renderFormList();
  }
  else if (act === 'mode') {
    if (f.mode === btn.dataset.mode) return;
    convertMode(f, btn.dataset.mode);
    save(); renderEditor(); renderFormList();
  }
  else if (act === 'dup') {
    const copy = JSON.parse(JSON.stringify(f));
    copy.id = uid();
    copy.name = f.name + t('defaults.copySuffix');
    state.formulations.push(copy);
    selectedId = copy.id;
    save(); render();
  }
  else if (act === 'del-form') {
    if (!confirm(t('dialog.confirmDeleteFormulation', { name: f.name || t('defaults.thisFormulation') }))) return;
    state.formulations = state.formulations.filter(x => x.id !== f.id);
    selectedId = state.formulations.length ? state.formulations[0].id : null;
    save(); render();
  }
  else if (act === 'print') {
    window.print();
  }
});

/* Switching between % and absolute keeps the recipe equivalent. */
function convertMode(f, mode) {
  const batchU = UNITS[f.batchUnit];
  const batchBase = num(f.batchSize) * batchU.base;
  const target = batchU.dim === 'mass' ? 'g' : 'mL';

  if (mode === 'absolute') {
    f.lines.forEach(l => {
      l.unit = target;
      l.value = parseFloat((batchBase * num(l.value) / 100).toFixed(6));
    });
  } else {
    f.lines.forEach(l => {
      const u = UNITS[l.unit] || UNITS.g;
      const base = num(l.value) * u.base;
      /* only same-dimension lines can be expressed as % of the batch */
      l.value = (u.dim === batchU.dim && batchBase > 0)
        ? parseFloat((base / batchBase * 100).toFixed(6)) : 0;
    });
  }
  f.mode = mode;
}

/* ---- language ---- */
function syncLangButtons() {
  $$('#lang-seg button').forEach(b =>
    b.classList.toggle('on', b.dataset.lang === getLang()));
}
$('#lang-seg').addEventListener('click', e => {
  const b = e.target.closest('button[data-lang]');
  if (!b || b.dataset.lang === getLang()) return;
  /* setLang swaps <html lang/dir> and the static chrome; render() redraws
     everything this file owns, which is where the formatted numbers live. */
  setLang(b.dataset.lang, () => { syncLangButtons(); render(); });
});

/* ---- how-to dialog ---- */
const howto = $('#howto');
$('#btn-howto').addEventListener('click', () => {
  if (typeof howto.showModal === 'function') howto.showModal();
  else howto.setAttribute('open', '');          /* very old browsers */
});
howto.addEventListener('click', e => {
  /* a click on the dialog element itself is a click on the backdrop */
  if (e.target === howto || e.target.closest('[data-close]')) howto.close();
});

/* The how-to screenshots are crops of the 1180px desktop page. On a narrow
   screen they are illegible when squeezed to fit, so each figure keeps a
   readable width and scrolls sideways inside a wrapper built here. */
document.querySelectorAll('#howto .shot').forEach(fig => {
  const box = document.createElement('div');
  box.className = 'shot-scroll';
  box.tabIndex = 0;                       /* a scroll region must be keyboard reachable */
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Screenshot, scrolls sideways');
  fig.parentNode.insertBefore(box, fig);
  box.appendChild(fig);
});

/* Money fields show grouped digits when idle and a plain number while editing. */
document.addEventListener('focusin', e => {
  const t = e.target;
  if (t.dataset && t.dataset.money) { const v = num(t.value); t.value = v ? String(v) : ''; }
});
document.addEventListener('focusout', e => {
  const t = e.target;
  if (t.dataset && t.dataset.money) { t.value = num(t.value) ? grouped(t.value) : ''; }
});

/* ---- import / export / demo ---- */
$('#btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `formulations-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('#btn-import').addEventListener('click', () => $('#file-import').click());
$('#file-import').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const data = JSON.parse(fr.result);
      if (!data || (!Array.isArray(data.ingredients) && !Array.isArray(data.formulations))) {
        throw new Error(t('error.unrecognisedFile'));
      }
      if (!confirm(t('dialog.confirmImport'))) return;
      state = normalise(data);
      selectedId = state.formulations.length ? state.formulations[0].id : null;
      save(); render();
    } catch (err) {
      alert(t('dialog.importError', { message: err.message }));
    }
  };
  fr.readAsText(file);
  e.target.value = '';
});
$('#btn-demo').addEventListener('click', () => {
  if (state.ingredients.length || state.formulations.length) {
    if (!confirm(t('dialog.confirmDemo'))) return;
  }
  state = normalise(demoData());
  selectedId = state.formulations[0].id;
  save(); markDemoSeed(); render();
});

/* ------------------------------------------------------------------ demo */
function demoData() {
  /* INCI names stay in Latin script in both languages: that is how they appear
     on Iranian supplier invoices, COAs and IFDA dossiers, and transliterating
     them would break matching against a supplier catalogue. */
  const ing = (key, code, supplier, price, unit, density) =>
    ({ id: uid(), key, name: t('demo.ingredient.' + key), code, supplier,
       price, unit, density: density == null ? '' : density });

  /* Illustrative Rial prices only — replace them with your own supplier quotes. */
  const list = [
    ing('aqua', 'RM-001', t('demo.supplier.inHouse'), 600000, 'kg'),
    ing('glycerin', 'RM-002', 'Oleo Chem', 2800000, 'kg'),
    ing('cetearylAlcohol', 'RM-003', 'Oleo Chem', 4200000, 'kg'),
    ing('caprylicCapric', 'RM-004', 'Lipid Co', 6500000, 'kg'),
    ing('sheaButter', 'RM-005', 'Lipid Co', 9000000, 'kg'),
    ing('glycerylStearate', 'RM-006', 'Emul Ltd', 7400000, 'kg'),
    ing('niacinamide', 'RM-007', 'Vita Fine', 28000000, 'kg'),
    ing('tocopherylAcetate', 'RM-008', 'Vita Fine', 65000000, 'kg'),
    ing('phenoxyethanol', 'RM-009', 'Preserv AG', 12000000, 'kg'),
    ing('xanthanGum', 'RM-010', 'Hydro Gums', 22000000, 'kg'),
    ing('fragranceNeroli', 'RM-011', 'Aroma House', 120000000, 'L', 0.92),
  ];
  const by = key => {
    const hit = list.find(i => i.key === key);
    if (!hit) throw new Error('demo data: unknown ingredient key ' + key);
    return hit.id;
  };
  const L = (key, phase, value) => ({ ingredientId: by(key), phase, value, unit: 'g' });

  return {
    settings: { currency: 'IRR' },
    ingredients: list,
    formulations: [
      {
        id: uid(), name: t('demo.product.faceCream'), code: 'FC-001', mode: 'percent',
        batchSize: 100, batchUnit: 'kg', overagePct: 2,
        fillSize: 50, fillUnit: 'g', packagingPerUnit: 850000, laborPerBatch: 220000000,
        overheadPct: 12, markupPct: 120, vatPct: 10,
        notes: t('demo.notes.faceCream'),
        lines: [
          L('aqua', 'A', 68.5), L('glycerin', 'A', 5), L('xanthanGum', 'A', 0.3),
          L('cetearylAlcohol', 'B', 4), L('caprylicCapric', 'B', 8), L('sheaButter', 'B', 5), L('glycerylStearate', 'B', 3.5),
          L('niacinamide', 'C', 4), L('tocopherylAcetate', 'C', 0.5), L('phenoxyethanol', 'C', 1), L('fragranceNeroli', 'C', 0.2),
        ],
      },
      {
        id: uid(), name: t('demo.product.faceLotion'), code: 'FL-002', mode: 'percent',
        batchSize: 250, batchUnit: 'kg', overagePct: 2,
        fillSize: 100, fillUnit: 'g', packagingPerUnit: 650000, laborPerBatch: 300000000,
        overheadPct: 12, markupPct: 110, vatPct: 10, notes: '',
        lines: [
          L('aqua', 'A', 78.2), L('glycerin', 'A', 4), L('xanthanGum', 'A', 0.5),
          L('cetearylAlcohol', 'B', 2), L('caprylicCapric', 'B', 6), L('sheaButter', 'B', 1.3), L('glycerylStearate', 'B', 2.5),
          L('niacinamide', 'C', 4), L('tocopherylAcetate', 'C', 0.3), L('phenoxyethanol', 'C', 1), L('fragranceNeroli', 'C', 0.2),
        ],
      },
    ],
  };
}

/* ------------------------------------------------------- sign in / sign out */

let authMode = 'signin';               /* or 'register' */

function showSignIn() {
  const d = $('#signin');
  if (!d) return;
  setAuthMode('signin');
  if (typeof d.showModal === 'function' && !d.open) d.showModal();
  else d.setAttribute('open', '');
}

/* What the server requires; asked once, lazily, the first time someone opens
   the registration form. */
let signupModeCache = null;

async function refreshInviteField() {
  const field = $('#invite-field');
  if (!field) return;
  if (signupModeCache === null) signupModeCache = await apiAuth.signupMode();
  /* Only the invite mode needs a code. Asking for one in open or domain mode
     would be an unanswerable question. */
  field.hidden = signupModeCache !== 'invite';
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  $('#register-only').hidden = !registering;
  if (registering) refreshInviteField();
  $('#signin-heading').textContent = t(registering ? 'auth.register' : 'auth.heading');
  $('#signin-submit').textContent  = t(registering ? 'auth.register' : 'auth.signIn');
  $('#signin-toggle').textContent  = t(registering ? 'auth.toSignIn' : 'auth.toRegister');
  $('#signin-password').setAttribute('autocomplete', registering ? 'new-password' : 'current-password');
  authError('');
}

function authError(codeOrText) {
  const el = $('#signin-error');
  if (!codeOrText) { el.hidden = true; el.textContent = ''; return; }
  const key = 'auth.err.' + codeOrText;
  const msg = t(key);
  el.textContent = msg === key ? t('auth.err.generic') : msg;
  el.hidden = false;
}

function reflectSignedIn() {
  const on = !!(api.enabled && api.user);
  $('#who').hidden = !on;
  $('#btn-signout').hidden = !on;
  if (on) syncStatus('saved');
}

/* Signed in: the shared dataset replaces whatever this browser had cached.
   If the server cannot be reached we keep the local copy and say so. */
async function pullSharedState() {
  try {
    const payload = await apiState.pull();
    const hasData = payload && payload.data && (
      (payload.data.ingredients || []).length || (payload.data.formulations || []).length);
    if (hasData) {
      /* The shared dataset is the source of truth, but this browser may hold
         work done offline. Never discard it silently — keep a copy aside and
         say so, so nothing is lost by signing in. */
      const localHadData = state.ingredients.length || state.formulations.length;
      if (localHadData) {
        try {
          const mine = localStorage.getItem(STORAGE_KEY);
          const seeded = localStorage.getItem(SEED_KEY);
          if (mine && seeded !== 'demo-only') {
            localStorage.setItem('formulation-costing-local-backup', mine);
            setTimeout(() => alert(t('sync.localStashed')), 50);
          }
        } catch (e) { /* private mode */ }
      }
      adoptServerState(payload);
    } else {
      /* First ever sign-in: seed the shared dataset from what is on screen. */
      api.version = payload ? payload.version : 0;
      await pushNow();
      render();
    }
  } catch (e) {
    console.warn('pull failed:', e.code || e.message);
    alert(t('sync.pullFailed'));
    render();
  }
}

if ($('#signin')) {
  $('#signin-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#signin-email').value.trim();
    const password = $('#signin-password').value;
    const btn = $('#signin-submit');
    btn.disabled = true; authError('');
    const previous = btn.textContent;
    btn.textContent = t('auth.working');
    try {
      if (authMode === 'register') {
        await apiAuth.register(email, password, $('#signin-name').value.trim(), $('#signin-invite').value.trim());
      } else {
        await apiAuth.login(email, password);
      }
      $('#signin').close();
      reflectSignedIn();
      await pullSharedState();
    } catch (err) {
      authError(err.code || 'generic');
    } finally {
      btn.disabled = false; btn.textContent = previous;
    }
  });

  $('#signin-toggle').addEventListener('click', () =>
    setAuthMode(authMode === 'signin' ? 'register' : 'signin'));

  /* Deliberate escape hatch: the app still works entirely offline, and the
     data simply stays in this browser. */
  $('#signin-offline').addEventListener('click', () => { $('#signin').close(); render(); });

  $('#btn-signout').addEventListener('click', async () => {
    await apiAuth.logout();
    reflectSignedIn();
    showSignIn();
  });
}

/* ------------------------------------------------------------------ boot */
/* Language is settled before anything else: demoData() seeds localised product
   names, and the static chrome is translated before first paint. */
initLang();
syncLangButtons();

if (!load()) {
  state = normalise(demoData());
  save();
  markDemoSeed();
}
selectedId = state.formulations.length ? state.formulations[0].id : null;
tabFromHash();
render();

/* With no API configured this is the whole story — the app stays local-only,
   exactly as it was, and works from file://. */
if (api.enabled) {
  apiAuth.resume().then(user => {
    if (user) { reflectSignedIn(); return pullSharedState(); }
    showSignIn();
  });
}
