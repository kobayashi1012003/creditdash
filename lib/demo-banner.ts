/**
 * The demo banner: shown in the app to anyone without a session (owner,
 * 2 November 2026). Closing it lasts until the tab is closed, so it is back
 * on the next visit (owner, 6 November 2026); it used to stay closed for
 * good, which meant a returning visitor never saw it again.
 *
 * Whether to show it is decided by a tiny script in <head>, before the page
 * paints, which marks <html data-demo>. The banner is in the server HTML
 * and CSS shows it only under that mark, so it never pushes the page down
 * after load.
 */

/** Session storage, so a close lasts for this visit only. */
export const DEMO_BANNER_KEY = "creditdash:demo-banner";

/** The <head> script. Empty when accounts are not configured. */
export function demoBannerScript(supabaseUrl: string | undefined): string {
  if (!supabaseUrl) return "";
  let ref: string;
  try {
    ref = new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    return "";
  }
  return `try{if(!/(^|; )sb-${ref}-auth-token/.test(document.cookie)&&sessionStorage.getItem(${JSON.stringify(
    DEMO_BANNER_KEY,
  )})!=="closed")document.documentElement.dataset.demo=""}catch(e){}`;
}

/** Closes it until this tab is closed. */
export function closeDemoBanner() {
  try {
    window.sessionStorage.setItem(DEMO_BANNER_KEY, "closed");
    // The old for-good close, from before 6 November 2026.
    window.localStorage.removeItem(DEMO_BANNER_KEY);
  } catch {
    // Still hidden for this page.
  }
  delete document.documentElement.dataset.demo;
}
