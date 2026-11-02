/**
 * The demo banner: shown in the app to anyone without a session, until
 * they close it (owner, 2 November 2026).
 *
 * Whether to show it is decided by a tiny script in <head>, before the page
 * paints, which marks <html data-demo>. The banner is in the server HTML
 * and CSS shows it only under that mark, so it never pushes the page down
 * after load.
 */

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
  return `try{if(!/(^|; )sb-${ref}-auth-token/.test(document.cookie)&&localStorage.getItem(${JSON.stringify(
    DEMO_BANNER_KEY,
  )})!=="closed")document.documentElement.dataset.demo=""}catch(e){}`;
}

/** Closes it for good in this browser. */
export function closeDemoBanner() {
  try {
    window.localStorage.setItem(DEMO_BANNER_KEY, "closed");
  } catch {
    // Still hidden for this page.
  }
  delete document.documentElement.dataset.demo;
}
