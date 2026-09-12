# Formulation Cost & Price Calculator

A small offline web app for costing cosmetic / pharmaceutical formulations:
keep a price list of raw materials, build a formulation from them, and get the
batch cost, the cost per saleable unit, and the selling price.

## Running it

Just open `index.html` in a browser — no server, no build step, no dependencies.

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

## How it works

### Currency
The app works in **Iranian Rial (IRR)** by default and every figure is shown as
`1,294,533 IRR`. Rial amounts have no sub-unit, so they are displayed without
decimals and with thousands separators.

The currency box in the header accepts any ISO code and suggests the common ones;
`IRT` is offered for prices quoted in **Toman**. Changing it only changes the
label and the decimal convention — the app never converts between currencies, so
enter every price in the same unit you select.

Because Rial figures run to nine or ten digits:

- price fields show grouped digits (`28,000,000`) when you are not typing in them;
- large totals carry a compact echo underneath (`≈ 2.59B`);
- Persian (`۲۸`) and Arabic-Indic digits, and the Persian thousands separator, are
  accepted anywhere a number is entered.

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
