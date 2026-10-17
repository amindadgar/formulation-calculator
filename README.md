# Formulation Cost & Price Calculator

A small offline web app for costing cosmetic / pharmaceutical formulations:
keep a price list of raw materials, build a formulation from them, and get the
batch cost, the cost per saleable unit, and the selling price.

**Live:** https://amindadgar.github.io/formulation-calculator/

## Running it

Just open `index.html` in a browser — no server, no build step, no dependencies.

It works on a phone as well as a desktop, in English or Farsi.

New to it? Press **? How to** in the header. It walks through the whole app in
six steps, with a screenshot for each one and numbered markers on the buttons
and fields being described.

If you prefer to serve it (e.g. so several people on the same machine use the
same URL):

```bash
python3 -m http.server 8777 --directory .
```

Data is kept in the browser's `localStorage`, so it stays on the machine that
entered it. **Export** writes a JSON backup, **Import** restores one. That JSON
file is also how you move data to another computer.

## Accounts and shared data

By default the app is local-only: everything lives in this browser, and
`config.js` has an empty API URL. Point `window.FORMULATION_API` at the Railway
service and the app gains accounts and one shared company dataset.

    index.html / app.js  —  GitHub Pages   (public, no secrets)
             |  fetch + Bearer token
             v
    server/  —  Railway  ->  Postgres

**Everyone sees the same ingredients and formulations.** Each save records who
made it, and the shared row carries a version number: if a colleague saved while
you were editing, your save is refused and you are asked whether to keep theirs
or overwrite — an edit is never silently lost.

Auth is a token in `localStorage`, not a cookie, because the page and the API
are on different sites and Safari blocks third-party cookies outright. If you
ever move both behind one company domain (`app.example.com` +
`api.example.com`), ordinary cookies become possible and are the better choice.

### Who can create an account

Set on the Railway service:

| Variable | Meaning |
|---|---|
| `SIGNUP_MODE` | `invite` (default), `domain`, or `closed` |
| `INVITE_CODE` | required when mode is `invite` |
| `ALLOWED_EMAIL_DOMAIN` | required when mode is `domain`, e.g. `melika.com` |
| `ALLOWED_ORIGINS` | comma-separated list of sites allowed to call the API |

The **first account created becomes the administrator**, whatever the mode.

### Running the API locally

```bash
cd server
npm install
DATABASE_URL=postgresql://... ALLOWED_ORIGINS=http://localhost:8801 \
  INVITE_CODE=dev npm start
```

The schema is applied on boot and every statement is idempotent, so there is no
migration step to run or forget.

### Moving existing data in

Export from the local-only app, sign in, then Import. The first sign-in against
an empty database also seeds the shared dataset from whatever that browser
already had.

## Publishing it (GitHub Pages)

The repository is the website — plain files, no build step.

**One manual step is unavoidable, and it comes first.** A repository admin has
to open **Settings → Pages → Build and deployment → Source** and choose
**GitHub Actions** (not "Deploy from a branch"). That selection is what creates
the Pages site; it takes effect immediately, with no Save button. The workflow
cannot do it for you — creating a Pages site needs `administration: write`,
which the Actions `GITHUB_TOKEN` is never granted.

With that done, every push to `main` republishes through
`.github/workflows/pages.yml`. The first run after enabling Pages has to be
started by hand (Actions → *Deploy to GitHub Pages* → Run workflow), since
earlier failed runs do not retry themselves.

(The alternative, if you would rather not use a workflow: set Source to
**Deploy from a branch**, branch `main`, folder `/ (root)`, and delete the
workflow file. `.nojekyll` matters only on that route — it stops GitHub running
the files through Jekyll. On the Actions route Jekyll never runs, and
`upload-pages-artifact` excludes dotfiles from the upload anyway.)

Two things worth knowing before you share the link:

- **Nothing is uploaded.** The page has no backend and makes no network
  requests. Whatever anyone types stays in their own browser.
- **Data does not follow the URL.** `localStorage` belongs to one origin, so
  ingredients entered in a local copy (`file://…`) will not appear on the
  published site, and vice-versa. Move them with **Export** and **Import**.
  Anyone who opens the published link starts with the example data.

## Languages

The interface is available in **English** and **Farsi (فارسی)**. Use the toggle
at the left of the header; the choice is remembered per browser. On a first
visit the app follows the browser's own language preference, in priority order,
and falls back to English.

Farsi switches the layout to right-to-left. A few deliberate decisions:

- **Digits.** Computed figures are shown in Persian digits (`۱٬۲۹۴٬۵۳۳ ریال`),
  but **editable fields always use Latin digits** in both languages. This is not
  an oversight: it is what Iranian accounting software does, phone keypads and
  the ISIRI-9147 layout emit Latin digits, and a value typed back has to
  round-trip. You can still *type* Persian or Arabic-Indic digits anywhere — the
  parser normalises them.
- **INCI names stay in Latin script** (Glycerin, Cetearyl alcohol), as they
  appear on supplier invoices, COAs and IFDA dossiers. Units (kg, g, L, mL) stay
  Latin too. Only `pcs` becomes a word.
- **Numbers are bidi-isolated.** A run like `2,000 × 850,000 IRR` inside a
  Persian sentence would otherwise be reordered by the Unicode bidi algorithm —
  parentheses flip and the currency jumps to the wrong end. Each run is wrapped
  in isolate characters so it reads correctly.
- **The How-to screenshots are of the English layout.** Regenerating a mirrored
  Farsi set needs the capture tool to measure pin positions from the DOM rather
  than from fixed coordinates, so for now the Farsi dialog carries a one-line
  note saying so.

Your data is never translated or converted — product names, suppliers and
prices are stored exactly as you typed them, and switching language leaves them
alone. Only the sample data is seeded in the current language.

## On a phone

The layout is responsive down to 320px. The two editable tables stop being
tables below 600px and become one card per row, so no horizontal panning is
needed to enter a price. Fields are 16px (below that, iOS Safari zooms on focus
and never zooms back) and touch targets are at least 44px. The product list
becomes a horizontal chip strip so a long catalogue does not push the editor off
the screen.

## How it works

### Currency
The app works in **Iranian Toman (IRT)** by default and every figure is shown as
`129,453 IRT`. Toman amounts have no sub-unit, so they are displayed without
decimals and with thousands separators. `IRR` is also available for prices
quoted in Rials.

**Switching between `IRR` and `IRT` converts every amount** — ingredient prices,
packaging, labour, and the cost and price figures in Production & sales — at the
fixed 10 Rial = 1 Toman, after asking for confirmation. Percentages, quantities
and densities are untouched. Relabelling without converting would make every
figure ten times wrong, so the app never does that for this pair.

The currency box accepts any ISO code and suggests the common ones. For any
other change (say `IRT` to `USD`) there is no fixed rate, so only the label and
the decimal convention change — enter every price in the currency you select.

Because these figures run to many digits:

- price fields show grouped digits (`28,000,000`) when you are not typing in them;
- large totals carry a compact echo underneath (`≈ 2.59B`);
- Persian (`۲۸`) and Arabic-Indic digits, and the Persian thousands separator, are
  accepted in every numeric field. (Earlier versions used `<input type="number">`
  for percentages and batch sizes, where the browser's own value sanitiser
  silently discarded those digits before the app ever saw them; every numeric
  field is now a text field with a decimal keypad.)

### Ingredients
Each ingredient stores the price exactly as the supplier quotes it — a price and
a unit (`kg`, `g`, `mg`, `L`, `mL` or `pcs`). The app derives the cost per gram /
millilitre / piece from that.

`Density (g/mL)` is optional and only needed when an ingredient is **bought by
volume but used by weight**, or vice-versa (e.g. fragrance priced per litre and
dosed at 0.2 % w/w). Without it, such a line is flagged as an error rather than
silently mis-costed.

An ingredient that is used by any formulation cannot be deleted; the app tells
you where it is used.

### Formulations
A formulation is a list of lines, entered either as:

- **% of batch** — the normal `% w/w` recipe. The badge under the table shows the
  running total and turns amber if it is not 100 %.
- **Quantity per batch** — absolute amounts, each with its own unit.

Switching between the two modes converts the existing lines, so nothing is lost.

`Phase` is a free-text label (A / B / C …) used only for grouping the cost sheet.

### The calculation

```
line quantity   = batch size × line %          (or the absolute quantity)
purchased qty   = line quantity × (1 + overage %)
line cost       = purchased qty × ingredient unit cost   (density-converted if needed)

raw materials   = Σ line cost
units per batch = floor(batch size ÷ fill size)
packaging       = packaging per unit × units per batch
direct cost     = raw materials + packaging + labour
overhead        = direct cost × overhead %
TOTAL BATCH COST= direct cost + overhead

cost per unit   = total batch cost ÷ units per batch
price (ex VAT)  = cost per unit × (1 + markup %)
gross margin    = (price − cost) ÷ price
price (inc VAT) = price ex VAT × (1 + VAT %)
```

Notes on the model:

- **Overage / loss %** is applied to raw materials only — it represents material
  lost in the vessel, lines and filler, so you buy more than the recipe states.
- **Overhead %** is applied to materials + packaging + labour.
- **Markup %** is on cost. The resulting gross margin is shown next to it, since
  the two are easy to confuse (120 % markup = 54.5 % gross margin).
- **VAT** defaults to 10 % in the sample data, the current Iranian rate; it is a
  per-formulation field, so change it wherever it differs.
- Units per batch is floored — a partial jar is not saleable, and its share of
  the material cost stays in the batch cost.

### Production & sales
The **Production & sales** tab records what was actually made and sold:

- A **production run** is a date plus the products made that day and how many
  units of each. Choosing a product fills in its current cost and sale price per
  unit (ex VAT) from the formulation; both are editable and are **stored with
  the run**, so changing a recipe later does not rewrite what an old batch cost.
- Each **sale** is recorded against a run: date, product, units and the price
  actually charged per unit.
- For each run the app shows units made / sold / left, production cost, income
  received, income if everything sells, and profit so far. Selling more than was
  made is flagged.
- The top of the tab totals every run and lists each product's remaining stock,
  so you can see at a glance what is sold out and what is still on the shelf.

Dates are **Shamsi (Solar Hijri)** in both languages: type them as
`1405/07/25` (Persian digits, `-` or `.` separators and `05/7/25` also work),
and they are shown as `25 Mehr 1405` / `۲۵ مهر ۱۴۰۵`. An impossible date — such
as Esfand 30 in a common year — is outlined in red and not saved. Underneath,
dates are stored as Gregorian ISO strings (`2026-10-17`) so they sort correctly
and stay unambiguous in exported files.

Production data is part of the same dataset as everything else, so it is
shared when signed in and included in **Export** / **Import**.

### Validation
The results panel lists every problem it finds: percentages that do not total
100 %, absolute quantities that do not match the batch size, ingredients with no
price, unit dimensions that cannot be converted, and batches that yield less than
one unit. If any line cannot be costed, a banner marks the totals as incomplete
rather than quietly under-reporting them.

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup, layout and the How-to dialog |
| `styles.css` | Styling (light and dark) |
| `app.js` | State, costing engine (`compute()`), rendering |
| `i18n.js` | English and Farsi strings, `t()`, language switching |
| `config.js` | Where the shared API lives (empty = local-only) |
| `api.js` | Talks to the API: sign in, pull and push the shared data |
| `server/` | The API: accounts, sessions and the shared dataset |
| `img/` | The screenshots used by the How-to dialog |
| `tools/build-shots.py` | Regenerates those screenshots |

### Keeping the How-to in step with the app

The How-to screenshots are photographs of the real app, and the numbered markers
are positioned from measured coordinates. After a visual change, run:

```bash
python3 tools/build-shots.py
```

It serves the app, photographs it with headless Chrome, re-crops the six images
into `img/`, and rewrites the marker positions in `index.html`. If you move
things around on screen, update the coordinates at the top of that script.

The costing engine is the pure function `compute(formulation)` in `app.js` — it
takes a formulation and returns every figure shown on screen, so it can be tested
or reused on its own.
