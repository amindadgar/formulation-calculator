/* Where the shared API lives.
 *
 * Leave it empty to run the app exactly as before: everything stays in this
 * browser, no accounts, works offline and from file://.
 * Set it to the Railway service URL to turn on accounts and shared company data.
 *
 * This is not a secret — it is a public URL, and the API decides what each
 * signed-in account may read or write.
 */
window.FORMULATION_API = 'https://api-production-85cf.up.railway.app';
