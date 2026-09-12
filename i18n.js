/* Formulation Costing — interface strings.
 *
 * Loaded as a classic script before app.js so the app still runs from file://
 * (ES modules and fetch() both fail on the file: protocol).
 *
 * Farsi terminology follows Iranian formulation and cost-accounting practice:
 * INCI raw-material names stay in Latin script, as they appear on supplier
 * invoices, COAs and IFDA dossiers. Units (kg, g, L, mL) also stay Latin.
 * Placeholders are written {likeThis} and filled by t(key, vars).
 */
'use strict';

const LANGS = {
  en: { name: 'English',  native: 'English', dir: 'ltr', locale: 'en-US' },
  fa: { name: 'Farsi',    native: '\u0641\u0627\u0631\u0633\u06CC',  dir: 'rtl', locale: 'fa-IR' },
};

const STRINGS = {
  en: {
    /* --- badge --- */
    "badge.mixedUnitsSuffix": " (+ other units)",
    "badge.totalPercent": "Total {sum}%",
    "badge.totalQuantity": "Total {sum}{extra} of {batch} batch",
    /* --- common --- */
    "common.approxPrefix": "≈ ",
    "common.deleteTitle": "Delete",
    "common.emptyValue": "—",
    /* --- console --- */
    "console.couldNotLoad": "Could not load saved data:",
    "console.couldNotSave": "Could not save:",
    /* --- currency --- */
    "currency.IRR.label": "Iranian Rial",
    "currency.IRR.symbol": "IRR",
    "currency.IRT.label": "Iranian Toman",
    "currency.IRT.symbol": "IRT",
    /* --- defaults --- */
    "defaults.copySuffix": " (copy)",
    "defaults.ingredient": "ingredient",
    "defaults.newProduct": "New product",
    "defaults.thisFormulation": "this formulation",
    "defaults.thisIngredient": "this ingredient",
    "defaults.thisIngredientCap": "This ingredient",
    "defaults.unnamed": "Unnamed",
    "defaults.unnamedIngredient": "Unnamed ingredient",
    "defaults.untitled": "Untitled",
    "defaults.untitledProduct": "Untitled product",
    /* --- demo --- */
    "demo.ingredient.aqua": "Aqua (purified water)",
    "demo.ingredient.caprylicCapric": "Caprylic/capric triglyceride",
    "demo.ingredient.cetearylAlcohol": "Cetearyl alcohol",
    "demo.ingredient.fragranceNeroli": "Fragrance, neroli",
    "demo.ingredient.glycerin": "Glycerin 99.5%",
    "demo.ingredient.glycerylStearate": "Glyceryl stearate SE",
    "demo.ingredient.niacinamide": "Niacinamide USP",
    "demo.ingredient.phenoxyethanol": "Phenoxyethanol + EHG",
    "demo.ingredient.sheaButter": "Shea butter, refined",
    "demo.ingredient.tocopherylAcetate": "Tocopheryl acetate",
    "demo.ingredient.xanthanGum": "Xanthan gum",
    "demo.notes.faceCream": "Phase A heated to 75 °C, phase B added under homogenisation, cool to 40 °C before phase C.",
    "demo.notes.faceLotion": "",
    "demo.product.faceCream": "Hydrating Face Cream",
    "demo.product.faceLotion": "Lightweight Face Lotion",
    "demo.productCodes": "FC-001 / FL-002 / RM-001…RM-011",
    "demo.supplier.inHouse": "In-house",
    "demo.supplier.names": "Oleo Chem / Lipid Co / Emul Ltd / Vita Fine / Preserv AG / Hydro Gums / Aroma House",
    /* --- dialog --- */
    "dialog.bulletPrefix": "• ",
    "dialog.confirmDeleteFormulation": "Delete \"{name}\"?",
    "dialog.confirmDeleteIngredient": "Delete \"{name}\"?",
    "dialog.confirmDemo": "Replace all current data with the demo data set?",
    "dialog.confirmImport": "Replace all current data with the contents of this file?",
    "dialog.importError": "Could not import that file: {message}",
    "dialog.ingredientInUse": "\"{name}\" is used in:\\n\\n{list}\\n\\nRemove it from those formulations first.",
    /* --- dim --- */
    "dim.count": "count",
    "dim.mass": "mass",
    "dim.volume": "volume",
    /* --- editor --- */
    "editor.action.addLine": "+ Ingredient",
    "editor.action.delete": "Delete",
    "editor.action.duplicate": "Duplicate",
    "editor.action.print": "Print cost sheet",
    "editor.emptyState": "Select a formulation, or create one.",
    "editor.field.batchSize": "Batch size",
    "editor.field.fillSize": "Fill size per unit",
    "editor.field.labourPerBatch": "Labour / batch",
    "editor.field.markupPct": "Markup % on cost",
    "editor.field.notes": "Notes",
    "editor.field.overagePct": "Overage / loss %",
    "editor.field.overheadPct": "Overhead %",
    "editor.field.packagingPerUnit": "Packaging / unit",
    "editor.field.productCode": "Product code",
    "editor.field.productName": "Product name",
    "editor.field.vatPct": "VAT %",
    "editor.heading.formulation": "Formulation",
    "editor.heading.otherCosts": "Other costs & pricing",
    "editor.heading.product": "Product",
    "editor.mode.absolute": "Quantity per batch",
    "editor.mode.percent": "% of batch",
    "editor.placeholder.notes": "Process notes, pH, stability…",
    "editor.placeholder.productCode": "FC-001",
    "editor.placeholder.productName": "e.g. Hydrating Face Cream",
    /* --- error --- */
    "error.unrecognisedFile": "Unrecognised file",
    /* --- export --- */
    "export.filename": "formulations-{YYYY-MM-DD}.json",
    /* --- footer --- */
    "footer.backup": "Data is stored locally in this browser. Use <b>Export</b> to back it up.",
    /* --- form --- */
    "form.add": "+ New",
    "form.editor.empty": "Select a formulation, or create one.",
    "form.empty": "No formulations yet.",
    "form.products.heading": "Products",
    /* --- formList --- */
    "formList.notCosted": "not costed",
    "formList.unitCostSuffix": "{money} / unit cost",
    /* --- head --- */
    "head.description": "Cost cosmetic and pharmaceutical formulations: keep raw material prices, build a recipe, and get the batch cost, cost per unit and selling price.",
    "head.og.description": "Raw material prices in, batch cost and selling price out. Runs entirely in your browser.",
    "head.og.title": "Formulation Cost & Price Calculator",
    "head.title": "Formulation Cost & Price Calculator",
    /* --- header --- */
    "header.tagline": "Ingredients → formulation → batch cost → selling price",
    "header.title": "Formulation Costing",
    /* --- howto --- */
    "howto.close": "Close",
    "howto.gotit": "Got it",
    "howto.step1.alt": "The ingredients table, with the price, unit and density columns marked",
    "howto.step1.body": "Open the <b>Ingredients</b> tab. Every material you buy goes in here once.",
    "howto.step1.heading": "Put your raw materials in the price list",
    "howto.step1.legend1": "The name you know the material by.",
    "howto.step1.legend2": "The price you pay your supplier.",
    "howto.step1.legend3": "What that price buys — per <b>kg</b>, <b>L</b>, <b>pcs</b> and so on. Enter the price exactly as it is quoted; the app works out the rest.",
    "howto.step1.legend4": "Density, only if you buy a material by litre but use it by weight (or the other way round). Leave it empty otherwise.",
    "howto.step1.legend5": "Adds an empty row. Everything saves as you type.",
    "howto.step2.alt": "The product card, with batch size, fill size and overage marked",
    "howto.step2.body": "Go to <b>Formulations</b> and press <b>+ New</b>, then describe the batch you make.",
    "howto.step2.heading": "Create the product",
    "howto.step2.legend1": "The product name, as you want it on the cost sheet.",
    "howto.step2.legend2": "How much you make in one batch — for example 100 kg.",
    "howto.step2.legend3": "How much goes in one jar or bottle. 100 kg ÷ 50 g = 2,000 units.",
    "howto.step2.legend4": "How much material is lost in the vessel and the filling line. 2 % means you buy 2 % more than the recipe says.",
    "howto.step3.alt": "The formulation table, with the percentage column and running total marked",
    "howto.step3.body": "Add one row per ingredient. Costs appear while you type.",
    "howto.step3.heading": "Write the recipe",
    "howto.step3.legend1": "An optional phase label (A, B, C…) — it only groups the cost sheet.",
    "howto.step3.legend2": "Pick the material from your price list.",
    "howto.step3.legend3": "How much of it: a percentage of the batch, or a real quantity if you switch the toggle above.",
    "howto.step3.legend4": "What that comes to in kilos and in money, for this batch.",
    "howto.step3.legend5": "The running total. It must reach <b>100 %</b> — the badge turns amber until it does.",
    "howto.step4.alt": "The other costs and pricing card",
    "howto.step4.heading": "Add the other costs and your profit",
    "howto.step4.legend1": "The jar, cap, carton and label for one unit.",
    "howto.step4.legend2": "What making one batch costs you in wages.",
    "howto.step4.legend3": "Rent, electricity, QC — as a percentage of everything above.",
    "howto.step4.legend4": "How much you add on top of cost. 120 % means you sell for 2.2 × what it cost you.",
    "howto.step4.legend5": "VAT, added at the very end.",
    "howto.step5.alt": "The cost and price panel with the headline figures",
    "howto.step5.heading": "Read your price",
    "howto.step5.legend1": "What one batch costs you in total.",
    "howto.step5.legend2": "What one jar costs you.",
    "howto.step5.legend3": "What you sell it for, before and after VAT.",
    "howto.step5.legend4": "The same figures written out, so you can see where the money goes.",
    "howto.step5.tip": "If anything is wrong — percentages that do not reach 100 %, a material with no price — a coloured note appears at the bottom of this panel and tells you what to fix.",
    "howto.step6.alt": "The toolbar buttons in the header",
    "howto.step6.body": "Your data lives in this browser only. It is not sent anywhere.",
    "howto.step6.heading": "Keep a backup",
    "howto.step6.legendLang": "Switches the interface between English and Farsi. Your data is untouched.",
    "howto.step6.legendLang": "زبان برنامه را بین انگلیسی و فارسی عوض می‌کند. داده‌های شما دست‌نخورده می‌ماند.",
    "howto.step6.legend1": "The currency everything is shown in. Prices are never converted — type them all in the same currency.",
    "howto.step6.legend2": "Saves everything to one file. Do this regularly.",
    "howto.step6.legend3": "Loads a file you saved before, replacing what is here.",
    "howto.step6.legend4": "Brings back the example products, if you want something to look at.",
    "howto.step6.tip": "To print or save a cost sheet as PDF, open a product and press <b>Print cost sheet</b>.",
    "howto.subtitle": "Six steps, from a supplier price list to a selling price.",
    "howto.screenshotsNote": "",
    "howto.title": "How to use this app",
    /* --- ing --- */
    "ing.add": "+ Add ingredient",
    "ing.col.actions": "Actions",
    "ing.col.code": "Code",
    "ing.col.density": "Density",
    "ing.col.density.sub": "g/mL",
    "ing.col.name": "Name (INCI / trade)",
    "ing.col.per": "Per",
    "ing.col.price": "Price",
    "ing.col.supplier": "Supplier",
    "ing.col.unitcost": "Unit cost",
    "ing.empty": "No ingredients yet. Add one, or load the demo data set.",
    "ing.heading": "Ingredients",
    "ing.hint": "Enter the purchase price per unit exactly as your supplier quotes it (e.g. 4,200,000 Rial per kg). Density is only needed when an ingredient is bought by volume but used by weight (or vice-versa).",
    "ing.search.placeholder": "Search ingredients…",
    /* --- ingredients --- */
    "ingredients.notUsed": "Not used yet",
    "ingredients.placeholder.code": "SKU",
    "ingredients.placeholder.density": "—",
    "ingredients.placeholder.name": "e.g. Glycerin",
    "ingredients.placeholder.supplier": "Supplier",
    "ingredients.unitCostCell": "{money} / {baseUnit}",
    "ingredients.usedIn": "Used in {n} formulation(s)",
    /* --- lines --- */
    "lines.chooseOption": "— choose —",
    "lines.empty": "No ingredients in this formulation yet.",
    "lines.placeholder.phase": "A",
    "lines.th.cost": "Cost",
    "lines.th.ingredient": "Ingredient",
    "lines.th.percentWw": "% w/w",
    "lines.th.phase": "Phase",
    "lines.th.quantity": "Quantity",
    "lines.th.required": "Required",
    /* --- results --- */
    "results.breakdown.empty": "Nothing to cost yet.",
    "results.breakdown.th.cost": "Cost",
    "results.breakdown.th.ingredient": "Ingredient",
    "results.breakdown.th.phase": "Phase",
    "results.breakdown.th.quantity": "Quantity",
    "results.breakdown.th.share": "Share",
    "results.breakdown.totalRawMaterial": "Total raw material",
    "results.breakdownHeading": "Material cost breakdown",
    "results.brokenLines": "{n} ingredient line{s} could not be costed — every figure below is incomplete. See the problems listed at the bottom.",
    "results.buildUpHeading": "Cost build-up (per batch)",
    "results.heading": "Cost & price",
    "results.missingIngredient": "missing",
    "results.perUnitHeading": "Per unit ({size} {unit})",
    "results.row.fullCost": "Full cost",
    "results.row.grossMargin": "Gross margin",
    "results.row.labour": "Labour",
    "results.row.markup": "Markup ({pct}%)",
    "results.row.overageNote": "(incl. {pct}% overage)",
    "results.row.overhead": "Overhead ({pct}%)",
    "results.row.packaging": "Packaging ({units} × {price})",
    "results.row.priceIncVat": "Price incl. VAT",
    "results.row.profitPerBatch": "Profit per batch",
    "results.row.rawMaterials": "Raw materials",
    "results.row.revenuePerBatch": "Revenue per batch (ex VAT)",
    "results.row.sellingPriceExVat": "Selling price ex VAT",
    "results.row.totalBatchCost": "Total batch cost",
    "results.row.vat": "VAT ({pct}%)",
    "results.tile.batchSize": "Batch size",
    "results.tile.costPerUnit": "Cost per unit",
    "results.tile.priceExVat": "Price ex VAT",
    "results.tile.priceIncVat": "Price incl. VAT",
    "results.tile.totalBatchCost": "Total batch cost",
    "results.tile.unitsPerBatch": "Units per batch",
    /* --- tabs --- */
    "tabs.formulations": "Formulations",
    "tabs.ingredients": "Ingredients",
    /* --- toolbar --- */
    "toolbar.currency.label": "Currency",
    "toolbar.currency.opt.aed": "UAE Dirham",
    "toolbar.currency.opt.eur": "Euro",
    "toolbar.currency.opt.irr": "Iranian Rial",
    "toolbar.currency.opt.irt": "Iranian Toman",
    "toolbar.currency.opt.try": "Turkish Lira",
    "toolbar.currency.opt.usd": "US Dollar",
    "toolbar.currency.title": "ISO code, e.g. IRR (Rial) or IRT (Toman)",
    "toolbar.demo": "Load demo",
    "toolbar.export": "Export",
    "toolbar.howto": "How to",
    "toolbar.import": "Import",
    "toolbar.language.en": "English",
    "toolbar.language.fa": "فارسی",
    "toolbar.language.label": "Language",
    /* --- units --- */
    "units.L": "L",
    "units.g": "g",
    "units.kg": "kg",
    "units.mL": "mL",
    "units.mg": "mg",
    "units.pcs": "pcs",
    /* --- validation --- */
    "validation.cannotConvertCount": "\"{name}\" is priced per {unit}; that cannot be converted to {dim}.",
    "validation.fillUnitMismatch": "Fill size is in {fillUnit} but the batch is measured in {batchUnit}. Use matching units.",
    "validation.linePrefix": "Line {n}: {message}",
    "validation.needsDensity": "\"{name}\" is priced per {unit} but used by {dim}. Set its density.",
    "validation.noIngredientSelected": "No ingredient selected",
    "validation.noLines": "This formulation has no ingredients yet.",
    "validation.noPrice": "\"{name}\" has no price — it is costed at zero.",
    "validation.percentSumOverfilled": "Percentages add up to {sum}% instead of 100%. Costs are calculated on the stated percentages of a {size} {unit} batch, so the batch will be over-filled.",
    "validation.percentSumUnderfilled": "Percentages add up to {sum}% instead of 100%. Costs are calculated on the stated percentages of a {size} {unit} batch, so the batch will be under-filled.",
    "validation.quantityMismatch": "Ingredients total {total} but the batch size is {batch}. Per-unit costs assume the stated batch size.",
    "validation.tooFewUnits": "Batch yields less than one saleable unit — check batch size and fill size.",
  },
  fa: {
    /* --- badge --- */
    "badge.mixedUnitsSuffix": " (+ واحدهای دیگر)",
    "badge.totalPercent": "مجموع {sum}٪",
    "badge.totalQuantity": "مجموع {sum}{extra} از بچ {batch}",
    /* --- common --- */
    "common.approxPrefix": "≈ ",
    "common.deleteTitle": "حذف",
    "common.emptyValue": "—",
    /* --- console --- */
    "console.couldNotLoad": "(not user-facing — leave English)",
    "console.couldNotSave": "(not user-facing — leave English)",
    /* --- currency --- */
    "currency.IRR.label": "ریال ایران",
    "currency.IRR.symbol": "ریال",
    "currency.IRT.label": "تومان ایران",
    "currency.IRT.symbol": "تومان",
    /* --- defaults --- */
    "defaults.copySuffix": " (کپی)",
    "defaults.ingredient": "ماده اولیه",
    "defaults.newProduct": "محصول جدید",
    "defaults.thisFormulation": "این فرمولاسیون",
    "defaults.thisIngredient": "این ماده اولیه",
    "defaults.thisIngredientCap": "این ماده اولیه",
    "defaults.unnamed": "بدون نام",
    "defaults.unnamedIngredient": "ماده اولیه بدون نام",
    "defaults.untitled": "بی‌نام",
    "defaults.untitledProduct": "محصول بی‌نام",
    /* --- demo --- */
    "demo.ingredient.aqua": "Aqua (آب خالص‌شده)",
    "demo.ingredient.caprylicCapric": "Caprylic/capric triglyceride",
    "demo.ingredient.cetearylAlcohol": "Cetearyl alcohol",
    "demo.ingredient.fragranceNeroli": "Fragrance (اسانس نرولی)",
    "demo.ingredient.glycerin": "Glycerin 99.5%",
    "demo.ingredient.glycerylStearate": "Glyceryl stearate SE",
    "demo.ingredient.niacinamide": "Niacinamide USP",
    "demo.ingredient.phenoxyethanol": "Phenoxyethanol + EHG",
    "demo.ingredient.sheaButter": "Shea butter (تصفیه‌شده)",
    "demo.ingredient.tocopherylAcetate": "Tocopheryl acetate",
    "demo.ingredient.xanthanGum": "Xanthan gum",
    "demo.notes.faceCream": "فاز A تا ۷۵ درجه سانتی‌گراد حرارت داده شود، فاز B تحت هموژنایز به آن افزوده شود و پیش از افزودن فاز C تا ۴۰ درجه سانتی‌گراد خنک شود.",
    "demo.notes.faceLotion": "",
    "demo.product.faceCream": "کرم آبرسان صورت",
    "demo.product.faceLotion": "لوسیون سبک صورت",
    "demo.productCodes": "FC-001 / FL-002 / RM-001…RM-011",
    "demo.supplier.inHouse": "تولید داخلی",
    "demo.supplier.names": "Oleo Chem / Lipid Co / Emul Ltd / Vita Fine / Preserv AG / Hydro Gums / Aroma House",
    /* --- dialog --- */
    "dialog.bulletPrefix": "• ",
    "dialog.confirmDeleteFormulation": "«{name}» حذف شود؟",
    "dialog.confirmDeleteIngredient": "«{name}» حذف شود؟",
    "dialog.confirmDemo": "همه داده‌های فعلی با داده‌های نمونه جایگزین شود؟",
    "dialog.confirmImport": "همه داده‌های فعلی با محتوای این فایل جایگزین شود؟",
    "dialog.importError": "وارد کردن این فایل ممکن نبود: {message}",
    "dialog.ingredientInUse": "«{name}» در فرمولاسیون‌های زیر استفاده شده است:\\n\\n{list}\\n\\nابتدا آن را از این فرمولاسیون‌ها حذف کنید.",
    /* --- dim --- */
    "dim.count": "تعداد",
    "dim.mass": "وزن",
    "dim.volume": "حجم",
    /* --- editor --- */
    "editor.action.addLine": "+ ماده اولیه",
    "editor.action.delete": "حذف",
    "editor.action.duplicate": "تکثیر",
    "editor.action.print": "چاپ برگه بهای تمام‌شده",
    "editor.emptyState": "یک فرمولاسیون انتخاب کنید یا فرمولاسیون جدیدی بسازید.",
    "editor.field.batchSize": "اندازه بچ",
    "editor.field.fillSize": "مقدار پرکنی هر واحد",
    "editor.field.labourPerBatch": "دستمزد هر بچ",
    "editor.field.markupPct": "درصد سود بر بهای تمام‌شده",
    "editor.field.notes": "توضیحات",
    "editor.field.overagePct": "درصد اضافه‌ریزی / افت",
    "editor.field.overheadPct": "درصد سربار",
    "editor.field.packagingPerUnit": "بسته‌بندی هر واحد",
    "editor.field.productCode": "کد محصول",
    "editor.field.productName": "نام محصول",
    "editor.field.vatPct": "درصد مالیات بر ارزش افزوده",
    "editor.heading.formulation": "فرمولاسیون",
    "editor.heading.otherCosts": "سایر هزینه‌ها و قیمت‌گذاری",
    "editor.heading.product": "محصول",
    "editor.mode.absolute": "مقدار در هر بچ",
    "editor.mode.percent": "درصدی از بچ",
    "editor.placeholder.notes": "یادداشت فرایند، pH، پایداری…",
    "editor.placeholder.productCode": "FC-001",
    "editor.placeholder.productName": "مثلاً کرم آبرسان صورت",
    /* --- error --- */
    "error.unrecognisedFile": "فایل ناشناخته",
    /* --- export --- */
    "export.filename": "formulations-{YYYY-MM-DD}.json",
    /* --- footer --- */
    "footer.backup": "داده‌ها فقط در همین مرورگر ذخیره می‌شوند. برای تهیه نسخه پشتیبان از دکمه <b>خروجی</b> استفاده کنید.",
    /* --- form --- */
    "form.add": "+ جدید",
    "form.editor.empty": "یک فرمولاسیون را انتخاب کنید یا فرمولاسیون جدیدی بسازید.",
    "form.empty": "هنوز فرمولاسیونی ثبت نشده است.",
    "form.products.heading": "محصولات",
    /* --- formList --- */
    "formList.notCosted": "محاسبه نشده",
    "formList.unitCostSuffix": "{money} بهای هر واحد",
    /* --- head --- */
    "head.description": "قیمت‌گذاری فرمولاسیون‌های آرایشی و بهداشتی و دارویی: قیمت مواد اولیه را ثبت کنید، فرمول را بسازید و بهای تمام‌شده بچ، بهای هر واحد و قیمت فروش را به‌دست آورید.",
    "head.og.description": "قیمت مواد اولیه را وارد کنید، بهای تمام‌شده بچ و قیمت فروش را بگیرید. همه‌چیز داخل مرورگر شما اجرا می‌شود.",
    "head.og.title": "محاسبه‌گر بهای تمام‌شده و قیمت فرمولاسیون",
    "head.title": "محاسبه‌گر بهای تمام‌شده و قیمت فرمولاسیون",
    /* --- header --- */
    "header.tagline": "مواد اولیه ← فرمولاسیون ← بهای تمام‌شده بچ ← قیمت فروش",
    "header.title": "بهای تمام‌شده فرمولاسیون",
    /* --- howto --- */
    "howto.close": "بستن",
    "howto.gotit": "متوجه شدم",
    "howto.step1.alt": "جدول مواد اولیه، با مشخص‌شدن ستون‌های قیمت، واحد و دانسیته",
    "howto.step1.body": "سربرگ <b>مواد اولیه</b> را باز کنید. هر ماده‌ای که می‌خرید یک‌بار اینجا ثبت می‌شود.",
    "howto.step1.heading": "مواد اولیه را در لیست قیمت وارد کنید",
    "howto.step1.legend1": "نامی که ماده را با آن می‌شناسید.",
    "howto.step1.legend2": "قیمتی که به تأمین‌کننده می‌پردازید.",
    "howto.step1.legend3": "این قیمت به ازای چه مقدار است — هر <b>kg</b>، <b>L</b>، <b>عدد</b> و مانند آن. قیمت را دقیقاً همان‌طور که اعلام شده وارد کنید؛ بقیه محاسبات با برنامه است.",
    "howto.step1.legend4": "دانسیته، فقط اگر ماده‌ای را لیتری می‌خرید ولی وزنی مصرف می‌کنید (یا برعکس). در غیر این صورت خالی بگذارید.",
    "howto.step1.legend5": "یک ردیف خالی اضافه می‌کند. همه‌چیز هم‌زمان با تایپ ذخیره می‌شود.",
    "howto.step2.alt": "کارت محصول، با مشخص‌شدن اندازه بچ، حجم پرشدن هر واحد و درصد افت",
    "howto.step2.body": "به بخش <b>فرمولاسیون‌ها</b> بروید و <b>+ جدید</b> را بزنید، سپس مشخصات بچی را که تولید می‌کنید وارد کنید.",
    "howto.step2.heading": "محصول را تعریف کنید",
    "howto.step2.legend1": "نام محصول، همان‌طور که می‌خواهید در برگه بهای تمام‌شده دیده شود.",
    "howto.step2.legend2": "در هر بچ چه مقدار تولید می‌کنید — برای مثال <bdi>۱۰۰ کیلوگرم</bdi>.",
    "howto.step2.legend3": "در هر قوطی یا بطری چه مقدار پر می‌شود. <bdi>۱۰۰ kg ÷ ۵۰ g = ۲٬۰۰۰</bdi> واحد.",
    "howto.step2.legend4": "چه مقدار ماده در مخزن و خط پرکنی از دست می‌رود. ۲٪ یعنی ۲٪ بیشتر از مقداری که در فرمول آمده است برمی‌دارید.",
    "howto.step3.alt": "جدول فرمولاسیون، با مشخص‌شدن ستون درصد و جمع جاری",
    "howto.step3.body": "برای هر ماده اولیه یک ردیف اضافه کنید. هزینه‌ها هم‌زمان با تایپ نمایش داده می‌شود.",
    "howto.step3.heading": "فرمول را بنویسید",
    "howto.step3.legend1": "برچسب اختیاری فاز (<bdi>A، B، C…</bdi>) — فقط برای گروه‌بندی در برگه بهای تمام‌شده است.",
    "howto.step3.legend2": "ماده را از لیست قیمت خود انتخاب کنید.",
    "howto.step3.legend3": "چه مقدار از آن: درصدی از بچ (درصد وزنی/وزنی)، یا مقدار واقعی، اگر کلید بالا را تغییر دهید.",
    "howto.step3.legend4": "معادل آن برحسب کیلوگرم و مبلغ، برای همین بچ.",
    "howto.step3.legend5": "جمع جاری. باید به <b>۱۰۰٪</b> برسد — تا آن زمان نشان به رنگ نارنجی می‌ماند.",
    "howto.step4.alt": "کارت سایر هزینه‌ها و قیمت‌گذاری",
    "howto.step4.heading": "سایر هزینه‌ها و سود خود را اضافه کنید",
    "howto.step4.legend1": "قوطی، درب، جعبه و برچسب برای یک واحد.",
    "howto.step4.legend2": "دستمزد تولید یک بچ.",
    "howto.step4.legend3": "اجاره، برق، کنترل کیفیت — به‌صورت درصدی از مجموع موارد بالا.",
    "howto.step4.legend4": "چه مقدار روی بهای تمام‌شده اضافه می‌کنید. ۱۲۰٪ یعنی محصول را <bdi>۲٫۲ ×</bdi> بهای تمام‌شده می‌فروشید.",
    "howto.step4.legend5": "مالیات بر ارزش افزوده، که در انتها اضافه می‌شود.",
    "howto.step5.alt": "پنل بهای تمام‌شده و قیمت، همراه با ارقام اصلی",
    "howto.step5.heading": "قیمت را بخوانید",
    "howto.step5.legend1": "بهای تمام‌شده کل یک بچ.",
    "howto.step5.legend2": "بهای تمام‌شده هر قوطی.",
    "howto.step5.legend3": "قیمت فروش، پیش و پس از مالیات بر ارزش افزوده.",
    "howto.step5.legend4": "همان ارقام به‌صورت تفکیک‌شده، تا ببینید هزینه‌ها کجا صرف می‌شود.",
    "howto.step5.tip": "اگر ایرادی وجود داشته باشد — درصدهایی که به ۱۰۰٪ نمی‌رسند، ماده‌ای بدون قیمت — یادداشتی رنگی در پایین همین پنل ظاهر می‌شود و می‌گوید چه چیزی را باید اصلاح کنید.",
    "howto.step6.alt": "دکمه‌های نوار ابزار در سربرگ بالای صفحه",
    "howto.step6.body": "داده‌های شما فقط در همین مرورگر ذخیره می‌شود و به هیچ‌جا ارسال نمی‌شود.",
    "howto.step6.heading": "نسخه پشتیبان بگیرید",
    "howto.step6.legend1": "واحد پولی که همه مبالغ با آن نمایش داده می‌شود. هیچ تبدیل ارزی انجام نمی‌شود — همه قیمت‌ها را با یک واحد پول وارد کنید.",
    "howto.step6.legend2": "همه‌چیز را در یک فایل ذخیره می‌کند. این کار را مرتب انجام دهید.",
    "howto.step6.legend3": "فایلی را که قبلاً ذخیره کرده‌اید بارگذاری می‌کند و جایگزین اطلاعات فعلی می‌شود.",
    "howto.step6.legend4": "محصولات نمونه را بازمی‌گرداند، اگر می‌خواهید نمونه‌ای برای مشاهده داشته باشید.",
    "howto.step6.tip": "برای چاپ برگه بهای تمام‌شده یا ذخیره آن به‌صورت <bdi>PDF</bdi>، یک محصول را باز کنید و <b>چاپ برگه بهای تمام‌شده</b> را بزنید.",
    "howto.subtitle": "شش گام، از لیست قیمت تأمین‌کننده تا قیمت فروش.",
    "howto.screenshotsNote": "تصویرهای این راهنما از نسخهٔ انگلیسی برنامه گرفته شده‌اند؛ چیدمان فارسی راست‌چین است، اما جای دکمه‌ها همان است.",
    "howto.title": "راهنمای استفاده از برنامه",
    /* --- ing --- */
    "ing.add": "+ افزودن ماده اولیه",
    "ing.col.actions": "عملیات",
    "ing.col.code": "کد",
    "ing.col.density": "دانسیته",
    "ing.col.density.sub": "g/mL",
    "ing.col.name": "نام (INCI / تجاری)",
    "ing.col.per": "واحد خرید",
    "ing.col.price": "قیمت",
    "ing.col.supplier": "تأمین‌کننده",
    "ing.col.unitcost": "بهای واحد",
    "ing.empty": "هنوز ماده اولیه‌ای ثبت نشده است. یکی اضافه کنید یا داده‌های نمونه را بارگذاری کنید.",
    "ing.heading": "مواد اولیه",
    "ing.hint": "قیمت خرید هر واحد را دقیقاً همان‌طور که تأمین‌کننده اعلام می‌کند وارد کنید (مثلاً ۴٬۲۰۰٬۰۰۰ ریال به ازای هر کیلوگرم). دانسیته فقط زمانی لازم است که ماده‌ای را حجمی می‌خرید ولی وزنی مصرف می‌کنید (یا برعکس).",
    "ing.search.placeholder": "جست‌وجوی مواد اولیه…",
    /* --- ingredients --- */
    "ingredients.notUsed": "هنوز استفاده نشده است",
    "ingredients.placeholder.code": "کد کالا",
    "ingredients.placeholder.density": "—",
    "ingredients.placeholder.name": "مثلاً Glycerin",
    "ingredients.placeholder.supplier": "تأمین‌کننده",
    "ingredients.unitCostCell": "{money} / {baseUnit}",
    "ingredients.usedIn": "در {n} فرمولاسیون استفاده شده است",
    /* --- lines --- */
    "lines.chooseOption": "— انتخاب کنید —",
    "lines.empty": "هنوز ماده اولیه‌ای به این فرمولاسیون اضافه نشده است.",
    "lines.placeholder.phase": "A",
    "lines.th.cost": "هزینه",
    "lines.th.ingredient": "ماده اولیه",
    "lines.th.percentWw": "٪ وزنی/وزنی",
    "lines.th.phase": "فاز",
    "lines.th.quantity": "مقدار",
    "lines.th.required": "موردنیاز",
    /* --- results --- */
    "results.breakdown.empty": "هنوز چیزی برای محاسبه وجود ندارد.",
    "results.breakdown.th.cost": "هزینه",
    "results.breakdown.th.ingredient": "ماده اولیه",
    "results.breakdown.th.phase": "فاز",
    "results.breakdown.th.quantity": "مقدار",
    "results.breakdown.th.share": "سهم",
    "results.breakdown.totalRawMaterial": "جمع مواد اولیه",
    "results.breakdownHeading": "تفکیک هزینه مواد اولیه",
    "results.brokenLines": "هزینه {n} ردیف از مواد اولیه محاسبه نشد؛ همه ارقام زیر ناقص هستند. فهرست مشکلات را در انتهای صفحه ببینید.",
    "results.buildUpHeading": "ساختار بهای تمام‌شده (هر بچ)",
    "results.heading": "بهای تمام‌شده و قیمت",
    "results.missingIngredient": "یافت نشد",
    "results.perUnitHeading": "به ازای هر واحد ({size} {unit})",
    "results.row.fullCost": "بهای تمام‌شده کامل",
    "results.row.grossMargin": "حاشیه سود ناخالص",
    "results.row.labour": "دستمزد",
    "results.row.markup": "سود ({pct}٪)",
    "results.row.overageNote": "(شامل {pct}٪ اضافه‌ریزی)",
    "results.row.overhead": "سربار ({pct}٪)",
    "results.row.packaging": "بسته‌بندی ({units} × {price})",
    "results.row.priceIncVat": "قیمت با احتساب ارزش افزوده",
    "results.row.profitPerBatch": "سود هر بچ",
    "results.row.rawMaterials": "مواد اولیه",
    "results.row.revenuePerBatch": "فروش هر بچ (بدون ارزش افزوده)",
    "results.row.sellingPriceExVat": "قیمت فروش بدون ارزش افزوده",
    "results.row.totalBatchCost": "بهای تمام‌شده بچ",
    "results.row.vat": "مالیات بر ارزش افزوده ({pct}٪)",
    "results.tile.batchSize": "اندازه بچ",
    "results.tile.costPerUnit": "بهای تمام‌شده هر واحد",
    "results.tile.priceExVat": "قیمت بدون ارزش افزوده",
    "results.tile.priceIncVat": "قیمت با ارزش افزوده",
    "results.tile.totalBatchCost": "بهای تمام‌شده بچ",
    "results.tile.unitsPerBatch": "تعداد واحد در هر بچ",
    /* --- tabs --- */
    "tabs.formulations": "فرمولاسیون‌ها",
    "tabs.ingredients": "مواد اولیه",
    /* --- toolbar --- */
    "toolbar.currency.label": "واحد پول",
    "toolbar.currency.opt.aed": "درهم امارات",
    "toolbar.currency.opt.eur": "یورو",
    "toolbar.currency.opt.irr": "ریال ایران",
    "toolbar.currency.opt.irt": "تومان ایران",
    "toolbar.currency.opt.try": "لیر ترکیه",
    "toolbar.currency.opt.usd": "دلار آمریکا",
    "toolbar.currency.title": "کد ایزوی ارز، مثلاً IRR (ریال) یا IRT (تومان)",
    "toolbar.demo": "بارگذاری نمونه",
    "toolbar.export": "خروجی",
    "toolbar.howto": "راهنما",
    "toolbar.import": "ورودی",
    "toolbar.language.en": "English",
    "toolbar.language.fa": "فارسی",
    "toolbar.language.label": "زبان",
    /* --- units --- */
    "units.L": "L",
    "units.g": "g",
    "units.kg": "kg",
    "units.mL": "mL",
    "units.mg": "mg",
    "units.pcs": "عدد",
    /* --- validation --- */
    "validation.cannotConvertCount": "«{name}» بر حسب {unit} قیمت‌گذاری شده است؛ تبدیل آن به {dim} ممکن نیست.",
    "validation.fillUnitMismatch": "مقدار پرکنی بر حسب {fillUnit} است اما اندازه بچ بر حسب {batchUnit} اندازه‌گیری می‌شود. از واحدهای سازگار استفاده کنید.",
    "validation.linePrefix": "ردیف {n}: {message}",
    "validation.needsDensity": "«{name}» بر حسب {unit} قیمت‌گذاری شده اما بر حسب {dim} مصرف می‌شود. چگالی آن را وارد کنید.",
    "validation.noIngredientSelected": "ماده اولیه‌ای انتخاب نشده است",
    "validation.noLines": "هنوز ماده اولیه‌ای به این فرمولاسیون اضافه نشده است.",
    "validation.noPrice": "برای «{name}» قیمتی ثبت نشده است؛ هزینه آن صفر در نظر گرفته می‌شود.",
    "validation.percentSumOverfilled": "مجموع درصدها به‌جای ۱۰۰٪ برابر {sum}٪ است. هزینه‌ها بر مبنای همین درصدها برای بچ {size} {unit} محاسبه می‌شود، بنابراین بچ بیش از اندازه پر می‌شود.",
    "validation.percentSumUnderfilled": "مجموع درصدها به‌جای ۱۰۰٪ برابر {sum}٪ است. هزینه‌ها بر مبنای همین درصدها برای بچ {size} {unit} محاسبه می‌شود، بنابراین بچ کمتر از اندازه پر می‌شود.",
    "validation.quantityMismatch": "مجموع مواد اولیه {total} است، در حالی که اندازه بچ {batch} است. هزینه هر واحد بر مبنای اندازه بچ اعلام‌شده محاسبه می‌شود.",
    "validation.tooFewUnits": "بازده این بچ کمتر از یک واحد قابل فروش است؛ اندازه بچ و مقدار پرکنی را بررسی کنید.",
  },
};

/* ------------------------------------------------------------------ runtime */

/* Language lives under its own key, never inside the saved state: normalise()
   rebuilds settings as {currency} only, and Import / Load demo both replace
   state wholesale — so a colleague's exported file would otherwise silently
   flip the reader's interface language. */
const LANG_KEY = 'formulation-lang';

let lang = 'en';

function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANGS[saved]) return saved;
  } catch (e) { /* private mode */ }
  /* Walk the preference list in order and take the first language we support:
     a browser set to ['en-US','fa-IR'] wants English, not Farsi. */
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language || 'en'];
  for (const tag of list) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (base === 'fa' || base === 'per') return 'fa';
    if (LANGS[base]) return base;
  }
  return 'en';
}

function getLang() { return lang; }
function isRTL()   { return LANGS[lang].dir === 'rtl'; }

/* The locale used for DISPLAY of computed figures. Farsi gets Persian digits
   (U+06F0-06F9) with the Persian thousands separator, as Iranian accounting
   software does. */
function displayLocale() { return LANGS[lang].locale; }

/* The locale used INSIDE editable fields. Always Latin digits, in both
   languages: a value typed back through num() must round-trip, phone and
   ISIRI-9147 keyboards emit ASCII, and mixing scripts across adjacent fields
   reads worse than either choice on its own. */
const INPUT_LOCALE = 'en-US';

/* t('some.key') -> string, with {placeholder} interpolation.
   An unknown key returns the key itself, which shows up loudly in the UI
   rather than silently rendering an empty label. */
function t(key, vars) {
  const table = STRINGS[lang] || STRINGS.en;
  let s = table[key];
  if (s == null) s = (STRINGS.en[key] != null ? STRINGS.en[key] : key);
  if (vars) {
    s = s.replace(/\{(\w+)\}/g, (m, name) =>
      (vars[name] == null ? m : String(vars[name])));
  }
  return s;
}

/* Bidi isolation. A Latin-script run such as "1,294,533 IRR", "69.87 kg" or
   "2,000 × 850,000 IRR" sitting inside a Persian sentence gets reordered by
   the Unicode bidi algorithm — parentheses flip and the unit can jump to the
   wrong end of the number. U+2068 FIRST STRONG ISOLATE ... U+2069 POP
   DIRECTIONAL ISOLATE pins each run. These are characters, not markup, so they
   survive esc() untouched and need no change to the message contract.
   In English they are a no-op, so English output stays byte-identical. */
function iso(s) {
  if (s == null) return '';
  return isRTL() ? '⁨' + s + '⁩' : String(s);
}

/* Apply the dictionary to the static markup in index.html.
     data-i18n="key"            -> textContent
     data-i18n-attr="attr:key"  -> attribute (comma-separated for several)
     data-i18n-html="key"       -> innerHTML, for strings containing <b> etc. */
function applyStatic(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  scope.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(x => x.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

/* Switch language: sets <html lang/dir>, retranslates the static chrome and
   lets the app re-render everything it owns. */
function setLang(next, onChange) {
  if (!LANGS[next]) return;
  lang = next;
  try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* private mode */ }
  const html = document.documentElement;
  html.lang = next;
  html.dir = LANGS[next].dir;
  document.title = t('head.title');
  applyStatic();
  if (typeof onChange === 'function') onChange();
}

/* First paint: pick the language, set <html lang/dir> and translate the static
   chrome. Kept separate from setLang() because at boot there is no app state
   to re-render yet. */
function initLang() {
  lang = detectLang();
  const html = document.documentElement;
  html.lang = lang;
  html.dir = LANGS[lang].dir;
  document.title = t('head.title');
  applyStatic();
  return lang;
}
