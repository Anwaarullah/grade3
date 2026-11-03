/* Grade 3 Maths — site settings.
 *
 * Leave supabaseUrl empty and the site saves progress on each device only (no accounts).
 * Fill both values in to turn on parent sign-in and cloud sync. See docs/SETUP-ACCOUNTS.md.
 * The anon key is meant to be public: what each family can read is enforced by the
 * row-level security rules in backend/schema.sql, not by keeping this key secret.
 */
window.MQ = window.MQ || {};
window.MQ.config = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  /** Shown on the privacy page so families know who to contact. */
  contactEmail: '',
  siteName: 'Grade 3 Maths',
  /** Bump when the privacy notice changes; parents are asked to agree again. */
  consentVersion: '2026-11',
};
