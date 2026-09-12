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
  ? '' : new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(num(v));
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* Currencies we render with a local symbol instead of the ISO code, plus the
   number of decimals they are actually quoted in. IRT (Toman) is not an ISO
   code — it is offered because Iranian prices are usually quoted in Toman. */
const CURRENCIES = {
  IRR: { symbol: 'IRR', decimals: 0, label: 'Iranian Rial' },
  IRT: { symbol: 'IRT', decimals: 0, label: 'Iranian Toman' },
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
    return new Intl.NumberFormat(undefined, fmt).format(v) + ' ' + CURRENCIES[code].symbol;
  }
  try {
    return new Intl.NumberFormat(undefined,
      Object.assign({ style: 'currency', currency: code }, fmt)).format(v);
  } catch (e) {
    return new Intl.NumberFormat(undefined, fmt).format(v) + (code ? ' ' + code : '');
  }
}
/* Large figures (a Rial batch cost runs to ten digits) get a compact echo. */
function compact(v) {
  if (!Number.isFinite(v) || Math.abs(v) < 1e6) return '';
  try {
    return '\u2248 ' + new Intl.NumberFormat(undefined,
      { notation: 'compact', maximumFractionDigits: 2 }).format(v);
  } catch (e) { return ''; }
}
function trimNum(v, maxDec = 4) {
  if (!Number.isFinite(v)) return '—';
  return parseFloat(v.toFixed(maxDec)).toLocaleString(undefined, { maximumFractionDigits: maxDec });
}
/* Pretty-print a quantity held in base units (g / mL / pcs). */
function fmtQty(base, dim) {
  if (dim === 'count') return trimNum(base, 0) + ' pcs';
  const big = dim === 'mass' ? 'kg' : 'L';
  const small = dim === 'mass' ? 'g' : 'mL';
  return Math.abs(base) >= 1000
    ? trimNum(base / 1000, 4) + ' ' + big
    : trimNum(base, 4) + ' ' + small;
}
function opts(list, selected) {
  return list.map(u => `<option value="${u}"${u === selected ? ' selected' : ''}>${u}</option>`).join('');
}

/* ----------------------------------------------------------------- state */
let state = { settings: { currency: 'IRR' }, ingredients: [], formulations: [] };
let selectedId = null;
let activeTab = 'formulations';
let ingFilter = '';

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Could not save:', e); }
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) { state = normalise(JSON.parse(raw)); return true; }
  } catch (e) { console.warn('Could not load saved data:', e); }
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
    name: f.name || 'Untitled product',
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
      r.error = 'No ingredient selected';
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
        r.error = `"${ing.name || 'ingredient'}" is priced per ${ing.unit}; that cannot be converted to ${r.dim}.`;
      } else if (d <= 0) {
        r.error = `"${ing.name || 'ingredient'}" is priced per ${ing.unit} but used by ${r.dim}. Set its density.`;
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
        msgs.push({ type: 'warn', text: `"${ing.name || 'Unnamed ingredient'}" has no price — it is costed at zero.` });
      }
    }
    lines.push(r);
  });

  lines.forEach(r => { if (r.error) msgs.push({ type: 'err', text: `Line ${r.idx + 1}: ${r.error}` }); });

  /* recipe sanity checks */
  if (!f.lines.length) msgs.push({ type: 'warn', text: 'This formulation has no ingredients yet.' });
  if (f.mode === 'percent' && f.lines.length && Math.abs(pctSum - 100) > 0.005) {
    msgs.push({
      type: 'warn',
      text: `Percentages add up to ${trimNum(pctSum, 3)}% instead of 100%. `
          + `Costs are calculated on the stated percentages of a ${trimNum(num(f.batchSize))} ${f.batchUnit} batch, so the batch will be ${pctSum > 100 ? 'over' : 'under'}-filled.`,
    });
  }
  if (f.mode === 'absolute' && f.lines.length && !mixedDims && batchBase > 0
      && Math.abs(qtyInBatchDim - batchBase) / batchBase > 0.005) {
    msgs.push({
      type: 'warn',
      text: `Ingredients total ${fmtQty(qtyInBatchDim, batchU.dim)} but the batch size is `
          + `${fmtQty(batchBase, batchU.dim)}. Per-unit costs assume the stated batch size.`,
    });
  }

  /* units produced */
  const fillU = UNITS[f.fillUnit] || UNITS.g;
  let unitsPerBatch = 0;
  if (fillU.dim !== batchU.dim) {
    msgs.push({ type: 'err', text: `Fill size is in ${f.fillUnit} but the batch is measured in ${f.batchUnit}. Use matching units.` });
  } else if (num(f.fillSize) > 0) {
    unitsPerBatch = Math.floor(batchBase / (num(f.fillSize) * fillU.base));
  }
  if (unitsPerBatch < 1) {
    msgs.push({ type: 'warn', text: 'Batch yields less than one saleable unit — check batch size and fill size.' });
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
      <td><input data-field="name" value="${esc(i.name)}" placeholder="e.g. Glycerin"></td>
      <td><input data-field="code" value="${esc(i.code)}" placeholder="SKU"></td>
      <td><input data-field="supplier" value="${esc(i.supplier)}" placeholder="Supplier"></td>
      <td><input data-field="price" data-money="1" type="text" inputmode="decimal" value="${esc(grouped(i.price))}"></td>
      <td><select data-field="unit">${opts(PRICE_UNITS, i.unit)}</select></td>
      <td><input data-field="density" type="number" min="0" step="any" value="${esc(i.density)}" placeholder="—"></td>
      <td class="num" title="${used ? `Used in ${used} formulation(s)` : 'Not used yet'}">${money(perBase)} / ${baseLabel}</td>
      <td class="act"><button class="danger small" data-act="del-ing" type="button" title="Delete">✕</button></td>
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
      <button data-id="${f.id}" type="button">${esc(f.name || 'Untitled')}
        <span class="meta">${Number.isFinite(c.costPerUnit) ? money(c.costPerUnit) + ' / unit cost' : 'not costed'}</span>
      </button></li>`;
  }).join('');
}

function renderEditor() {
  const ed = $('#editor');
  const f = getForm(selectedId);
  if (!f) { ed.innerHTML = '<p class="empty">Select a formulation, or create one.</p>'; return; }

  const batchDim = UNITS[f.batchUnit].dim;
  const fillOpts = unitsOfDim(batchDim);
  if (!fillOpts.includes(f.fillUnit)) f.fillUnit = batchDim === 'mass' ? 'g' : 'mL';

  ed.innerHTML = `
    <section class="card">
      <div class="card-head">
        <h2>Product</h2>
        <div class="actions">
          <button class="ghost small" data-act="print" type="button">Print cost sheet</button>
          <button class="ghost small" data-act="dup" type="button">Duplicate</button>
          <button class="danger small" data-act="del-form" type="button">Delete</button>
        </div>
      </div>
      <div class="fields">
        <div class="field" style="grid-column:span 2">
          <label>Product name</label>
          <input data-f="name" value="${esc(f.name)}" placeholder="e.g. Hydrating Face Cream">
        </div>
        <div class="field"><label>Product code</label>
          <input data-f="code" value="${esc(f.code)}" placeholder="FC-001"></div>
        <div class="field"><label>Batch size</label>
          <div class="row">
            <input data-f="batchSize" type="number" min="0" step="any" value="${esc(f.batchSize)}">
            <select data-f="batchUnit" data-rerender="1">${opts(BATCH_UNITS, f.batchUnit)}</select>
          </div>
        </div>
        <div class="field"><label>Fill size per unit</label>
          <div class="row">
            <input data-f="fillSize" type="number" min="0" step="any" value="${esc(f.fillSize)}">
            <select data-f="fillUnit">${opts(fillOpts, f.fillUnit)}</select>
          </div>
        </div>
        <div class="field"><label>Overage / loss %</label>
          <input data-f="overagePct" type="number" min="0" step="any" value="${esc(f.overagePct)}"></div>
      </div>
    </section>

    <section class="card">
      <div class="card-head">
        <h2>Formulation</h2>
        <div class="actions no-print">
          <span class="seg">
            <button data-act="mode" data-mode="percent" class="${f.mode === 'percent' ? 'on' : ''}" type="button">% of batch</button>
            <button data-act="mode" data-mode="absolute" class="${f.mode === 'absolute' ? 'on' : ''}" type="button">Quantity per batch</button>
          </span>
          <button class="primary small" data-act="add-line" type="button">+ Ingredient</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="grid lines-table">
          <thead><tr>
            <th style="width:8%">Phase</th>
            <th style="width:34%">Ingredient</th>
            <th style="width:16%">${f.mode === 'percent' ? '% w/w' : 'Quantity'}</th>
            <th style="width:16%">Required</th>
            <th style="width:18%">Cost</th>
            <th style="width:8%"></th>
          </tr></thead>
          <tbody>${renderLines(f)}</tbody>
        </table>
      </div>
      <div style="margin-top:10px" id="sum-badge"></div>
    </section>

    <section class="card">
      <h2 style="margin-bottom:12px">Other costs &amp; pricing</h2>
      <div class="fields">
        <div class="field"><label>Packaging / unit</label>
          <input data-f="packagingPerUnit" data-money="1" type="text" inputmode="decimal" value="${esc(grouped(f.packagingPerUnit))}"></div>
        <div class="field"><label>Labour / batch</label>
          <input data-f="laborPerBatch" data-money="1" type="text" inputmode="decimal" value="${esc(grouped(f.laborPerBatch))}"></div>
        <div class="field"><label>Overhead %</label>
          <input data-f="overheadPct" type="number" min="0" step="any" value="${esc(f.overheadPct)}"></div>
        <div class="field"><label>Markup % on cost</label>
          <input data-f="markupPct" type="number" min="0" step="any" value="${esc(f.markupPct)}"></div>
        <div class="field"><label>VAT %</label>
          <input data-f="vatPct" type="number" min="0" step="any" value="${esc(f.vatPct)}"></div>
        <div class="field wide"><label>Notes</label>
          <textarea data-f="notes" rows="2" placeholder="Process notes, pH, stability…">${esc(f.notes)}</textarea></div>
      </div>
    </section>

    <section class="card" id="results"></section>`;

  renderResults();
}

function renderLines(f) {
  const options = state.ingredients
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .map(i => `<option value="${i.id}">${esc(i.name || 'Unnamed')}${i.code ? ' (' + esc(i.code) + ')' : ''}</option>`)
    .join('');

  if (!f.lines.length) {
    return `<tr><td colspan="6" class="empty small">No ingredients in this formulation yet.</td></tr>`;
  }
  return f.lines.map((l, idx) => `<tr data-idx="${idx}">
    <td><input data-lf="phase" value="${esc(l.phase)}" placeholder="A"></td>
    <td><select data-lf="ingredientId">
        <option value="">— choose —</option>${options}
      </select></td>
    <td>${f.mode === 'percent'
        ? `<input data-lf="value" type="number" min="0" step="any" value="${esc(l.value)}">`
        : `<div class="row" style="display:flex;gap:4px">
             <input data-lf="value" type="number" min="0" step="any" value="${esc(l.value)}">
             <select data-lf="unit" style="flex:0 0 70px">${opts(PRICE_UNITS, l.unit)}</select>
           </div>`}</td>
    <td class="num" data-line-qty="${idx}">—</td>
    <td class="num" data-line-cost="${idx}">—</td>
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
    if (qc) qc.innerHTML = r.error ? '<span class="line-err">—</span>' : fmtQty(r.grossBase, r.dim);
    if (cc) cc.innerHTML = r.error ? `<span class="line-err">${esc(r.error)}</span>` : money(r.cost);
  });
  const badge = $('#sum-badge');
  if (badge) {
    if (f.mode === 'percent') {
      const ok = Math.abs(c.pctSum - 100) <= 0.005;
      badge.innerHTML = `<span class="badge ${ok ? 'ok' : 'bad'}">Total ${trimNum(c.pctSum, 3)}%</span>`;
    } else {
      badge.innerHTML = `<span class="badge ${c.mixedDims ? 'bad' : 'ok'}">Total ${fmtQty(c.qtyInBatchDim, c.batchDim)}${c.mixedDims ? ' (+ other units)' : ''} of ${fmtQty(c.batchBase, c.batchDim)} batch</span>`;
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
      <td>${r.ing ? esc(r.ing.name || 'Unnamed') : '<i>missing</i>'}</td>
      <td class="num">${r.error ? '—' : fmtQty(r.grossBase, r.dim)}</td>
      <td class="num">${r.error ? '—' : money(r.cost)}</td>
      <td class="num">${r.error ? '—' : trimNum(share, 1) + '%'}</td>
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
    <div class="card-head"><h2>Cost &amp; price</h2></div>

    ${broken ? `<div class="msg err" style="margin-bottom:12px">${broken} ingredient line${broken > 1 ? 's' : ''} could not be costed — every figure below is incomplete. See the problems listed at the bottom.</div>` : ''}

    <div class="totals">
      ${tile('Batch size', fmtQty(c.batchBase, c.batchDim))}
      ${tile('Units per batch', trimNum(c.unitsPerBatch, 0))}
      ${tile('Total batch cost', money(c.totalCost), c.totalCost)}
      ${tile('Cost per unit', perUnit(c.costPerUnit), c.costPerUnit)}
      ${tile('Price ex VAT', perUnit(c.priceExVat), c.priceExVat, true)}
      ${tile('Price incl. VAT', perUnit(c.priceIncVat), c.priceIncVat, true)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px" class="split">
      <div>
        <h3 style="margin-bottom:6px">Cost build-up (per batch)</h3>
        <table class="plain">
          <tbody>
            <tr><td>Raw materials${num(f.overagePct) ? ` <span style="color:var(--muted)">(incl. ${trimNum(num(f.overagePct))}% overage)</span>` : ''}</td><td class="num">${money(c.materialCost)}</td></tr>
            <tr><td>Packaging (${trimNum(c.unitsPerBatch, 0)} × ${money(num(f.packagingPerUnit))})</td><td class="num">${money(c.packaging)}</td></tr>
            <tr><td>Labour</td><td class="num">${money(c.labor)}</td></tr>
            <tr><td>Overhead (${trimNum(num(f.overheadPct))}%)</td><td class="num">${money(c.overhead)}</td></tr>
          </tbody>
          <tfoot><tr><td>Total batch cost</td><td class="num">${money(c.totalCost)}</td></tr></tfoot>
        </table>
      </div>
      <div>
        <h3 style="margin-bottom:6px">Per unit (${trimNum(num(f.fillSize))} ${f.fillUnit})</h3>
        <table class="plain">
          <tbody>
            <tr><td>Raw materials</td><td class="num">${perUnit(c.materialPerUnit)}</td></tr>
            <tr><td>Full cost</td><td class="num">${perUnit(c.costPerUnit)}</td></tr>
            <tr><td>Markup (${trimNum(num(f.markupPct))}%)</td><td class="num">${perUnit(c.priceExVat - c.costPerUnit)}</td></tr>
            <tr><td>Selling price ex VAT</td><td class="num">${perUnit(c.priceExVat)}</td></tr>
            <tr><td>Gross margin</td><td class="num">${Number.isFinite(c.grossMargin) ? trimNum(c.grossMargin, 1) + '%' : '—'}</td></tr>
            <tr><td>VAT (${trimNum(num(f.vatPct))}%)</td><td class="num">${perUnit(c.priceIncVat - c.priceExVat)}</td></tr>
          </tbody>
          <tfoot><tr><td>Price incl. VAT</td><td class="num">${perUnit(c.priceIncVat)}</td></tr></tfoot>
        </table>
        <table class="plain" style="margin-top:10px">
          <tbody>
            <tr><td>Revenue per batch (ex VAT)</td><td class="num">${Number.isFinite(c.revenuePerBatch) ? money(c.revenuePerBatch) : '—'}</td></tr>
            <tr><td>Profit per batch</td><td class="num">${Number.isFinite(c.profitPerBatch) ? money(c.profitPerBatch) : '—'}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <h3 style="margin:18px 0 6px">Material cost breakdown</h3>
    <div class="table-wrap" style="box-shadow:none">
      <table class="plain" style="min-width:560px">
        <thead><tr><th>Phase</th><th>Ingredient</th><th class="num">Quantity</th><th class="num">Cost</th><th class="num">Share</th><th></th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6" class="empty small">Nothing to cost yet.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="3">Total raw material</td><td class="num">${money(c.materialCost)}</td><td class="num">100%</td><td></td></tr></tfoot>
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
    alert(`"${ing.name || 'This ingredient'}" is used in:\n\n` +
      used.map(f => '• ' + (f.name || 'Untitled')).join('\n') +
      `\n\nRemove it from those formulations first.`);
    return;
  }
  if (!confirm(`Delete "${ing.name || 'this ingredient'}"?`)) return;
  state.ingredients = state.ingredients.filter(i => i.id !== ing.id);
  save(); renderIngredients();
});

/* ---- formulation list ---- */
$('#btn-add-form').addEventListener('click', () => {
  const f = normalise({ formulations: [{ name: 'New product', markupPct: 60, overheadPct: 10, lines: [] }] }).formulations[0];
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
    f[key] = (t.type === 'number' || t.dataset.money) ? num(t.value) : t.value;
    save();
    if (key === 'name') { renderFormList(); return renderResults(); }
    return renderResults();
  }
  if (t.dataset.lf) {
    const tr = t.closest('tr[data-idx]'); if (!tr) return;
    const l = f.lines[+tr.dataset.idx]; if (!l) return;
    const key = t.dataset.lf;
    l[key] = (t.type === 'number' || t.dataset.money) ? num(t.value) : t.value;
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
    copy.name = f.name + ' (copy)';
    state.formulations.push(copy);
    selectedId = copy.id;
    save(); render();
  }
  else if (act === 'del-form') {
    if (!confirm(`Delete "${f.name || 'this formulation'}"?`)) return;
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
        throw new Error('Unrecognised file');
      }
      if (!confirm('Replace all current data with the contents of this file?')) return;
      state = normalise(data);
      selectedId = state.formulations.length ? state.formulations[0].id : null;
      save(); render();
    } catch (err) {
      alert('Could not import that file: ' + err.message);
    }
  };
  fr.readAsText(file);
  e.target.value = '';
});
$('#btn-demo').addEventListener('click', () => {
  if (state.ingredients.length || state.formulations.length) {
    if (!confirm('Replace all current data with the demo data set?')) return;
  }
  state = normalise(demoData());
  selectedId = state.formulations[0].id;
  save(); render();
});

/* ------------------------------------------------------------------ demo */
function demoData() {
  const ing = (name, code, supplier, price, unit, density) =>
    ({ id: uid(), name, code, supplier, price, unit, density: density == null ? '' : density });

  /* Illustrative Rial prices only — replace them with your own supplier quotes. */
  const list = [
    ing('Aqua (purified water)', 'RM-001', 'In-house', 600000, 'kg'),
    ing('Glycerin 99.5%', 'RM-002', 'Oleo Chem', 2800000, 'kg'),
    ing('Cetearyl alcohol', 'RM-003', 'Oleo Chem', 4200000, 'kg'),
    ing('Caprylic/capric triglyceride', 'RM-004', 'Lipid Co', 6500000, 'kg'),
    ing('Shea butter, refined', 'RM-005', 'Lipid Co', 9000000, 'kg'),
    ing('Glyceryl stearate SE', 'RM-006', 'Emul Ltd', 7400000, 'kg'),
    ing('Niacinamide USP', 'RM-007', 'Vita Fine', 28000000, 'kg'),
    ing('Tocopheryl acetate', 'RM-008', 'Vita Fine', 65000000, 'kg'),
    ing('Phenoxyethanol + EHG', 'RM-009', 'Preserv AG', 12000000, 'kg'),
    ing('Xanthan gum', 'RM-010', 'Hydro Gums', 22000000, 'kg'),
    ing('Fragrance, neroli', 'RM-011', 'Aroma House', 120000000, 'L', 0.92),
  ];
  const by = n => list.find(i => i.name.startsWith(n)).id;
  const L = (name, phase, value) => ({ ingredientId: by(name), phase, value, unit: 'g' });

  return {
    settings: { currency: 'IRR' },
    ingredients: list,
    formulations: [
      {
        id: uid(), name: 'Hydrating Face Cream', code: 'FC-001', mode: 'percent',
        batchSize: 100, batchUnit: 'kg', overagePct: 2,
        fillSize: 50, fillUnit: 'g', packagingPerUnit: 850000, laborPerBatch: 220000000,
        overheadPct: 12, markupPct: 120, vatPct: 10,
        notes: 'Phase A heated to 75 °C, phase B added under homogenisation, cool to 40 °C before phase C.',
        lines: [
          L('Aqua', 'A', 68.5), L('Glycerin', 'A', 5), L('Xanthan', 'A', 0.3),
          L('Cetearyl', 'B', 4), L('Caprylic', 'B', 8), L('Shea', 'B', 5), L('Glyceryl', 'B', 3.5),
          L('Niacinamide', 'C', 4), L('Tocopheryl', 'C', 0.5), L('Phenoxyethanol', 'C', 1), L('Fragrance', 'C', 0.2),
        ],
      },
      {
        id: uid(), name: 'Lightweight Face Lotion', code: 'FL-002', mode: 'percent',
        batchSize: 250, batchUnit: 'kg', overagePct: 2,
        fillSize: 100, fillUnit: 'g', packagingPerUnit: 650000, laborPerBatch: 300000000,
        overheadPct: 12, markupPct: 110, vatPct: 10, notes: '',
        lines: [
          L('Aqua', 'A', 78.2), L('Glycerin', 'A', 4), L('Xanthan', 'A', 0.5),
          L('Cetearyl', 'B', 2), L('Caprylic', 'B', 6), L('Shea', 'B', 1.3), L('Glyceryl', 'B', 2.5),
          L('Niacinamide', 'C', 4), L('Tocopheryl', 'C', 0.3), L('Phenoxyethanol', 'C', 1), L('Fragrance', 'C', 0.2),
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ boot */
if (!load()) {
  state = normalise(demoData());
  save();
}
selectedId = state.formulations.length ? state.formulations[0].id : null;
tabFromHash();
render();
