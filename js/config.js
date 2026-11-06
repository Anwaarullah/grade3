/* Interactive Maths — site settings.
 *
 * With supabaseUrl empty the site saves progress on each device only (no accounts).
 * Fill in both values to turn on parent sign-in and cloud sync. See docs/SETUP-ACCOUNTS.md.
 * If the website moves to another address, add it to SITE_HOSTS below.
 * The anon key is meant to be public: what each family can read is enforced by the
 * row-level security rules in backend/schema.sql, not by keeping this key secret.
 */
window.MQ = window.MQ || {};
(function () {
  // Accounts are only switched on at the real website address. Opened from disk, from a test
  // server or inside a preview, the site keeps progress on the device only, as before.
  var SITE_HOSTS = ['syedanwaarullah.com', 'www.syedanwaarullah.com'];
  var host = '';
  try {
    host = window.location.hostname;
  } catch (e) {}
  var live = SITE_HOSTS.indexOf(host) !== -1;
  window.MQ.config = {
    /** The project address only, like https://abcd.supabase.co (no /rest/v1 on the end). */
    supabaseUrl: live ? 'https://ptueqhoduaiprzzhglgh.supabase.co' : '',
    /** The publishable (anon) key. It is meant to be public. */
    supabaseAnonKey: live ? 'sb_publishable_lNjxcZMDh02q0TilzyosbQ_ocjlWF_b' : '',
    /** Shown on the privacy page so families know who to contact. */
    contactEmail: 'hi@syedanwaarullah.com',
    siteName: 'Interactive Maths',
    /** Bump when the privacy notice changes; parents are asked to agree again. */
    consentVersion: '2026-11',
  };
})();
