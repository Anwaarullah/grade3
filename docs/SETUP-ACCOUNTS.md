# Setting up parent accounts and cloud sync

This guide switches on **parent sign-in** so your child's stars and progress follow
them from the laptop to a phone or tablet. It takes about an hour, once. You do not
need to write any code: you will click through two websites (Supabase and, for Google
sign-in, Google Cloud), paste one file, and fill in three values in `js/config.js`
(the project address, its public key and your contact email).

Until you finish, the site keeps working exactly as before: progress is saved on each
device only.

> Website dashboards change their wording from time to time. If a button in this guide
> has a slightly different name, look for the nearest match; the steps stay the same.

**What you will need**

* Your site's exact address, for example `https://maths.example.in/`
  (or `https://example.in/maths/` if the site lives in a sub-folder). Below this is
  called **YOUR-SITE**. Always include the `https://` and the final `/`.
* An email address for the Supabase account (yours).
* A Google account (only for "Sign in with Google").
* About 10 minutes with your web host's file upload page.

---

## 1. Create the Supabase project

Supabase is the service that stores the accounts and progress. Its free plan is plenty
for a family site.

1. Go to <https://supabase.com> and choose **Start your project** / **Sign up**. Sign up
   with your own email or GitHub.
2. Create an **organisation** if asked (any name, the **Free** plan).
3. Choose **New project**:
   * **Name**: for example `grade3-maths`.
   * **Database password**: press **Generate a password** and save it in your password
     manager. The site never uses it, but you may need it for support or backups.
   * **Region**: **South Asia (Mumbai)**, shown as `ap-south-1`. This keeps the
     database (children's profiles and progress, and the parents' logins) in India, which
     suits the DPDP Act. Parents' email addresses also pass through the email-sending
     service you choose in step 5 and, for Google sign-in, through Google; the privacy page
     says so.
   * Leave other options at their defaults and press **Create new project**.
4. Wait a minute or two until the project says it is ready.

> Free projects are **paused after about a week with no use at all**. If nobody has
> opened the site for a while and sign-in stops working, log in to Supabase and press
> **Restore project**. A paid plan never pauses.

## 2. Create the tables (run `backend/schema.sql`)

1. In your project, open **SQL Editor** in the left menu, then **New query**.
2. Open the file `backend/schema.sql` from this website's folder in a plain text editor
   (Notepad, TextEdit), select everything, copy it, and paste it into the SQL Editor.
3. Press **Run**. You should see "Success. No rows returned". If Supabase warns that
   the query contains destructive operations (it removes and re-adds its own rules),
   confirm: it does not delete any data.
4. Optional check: open **Table Editor**. You should see three tables, `parents`,
   `children` and `progress`, each marked as protected by RLS (row level security).

It is safe to run the file again later. **Whenever you upload a new version of the site,
run the new `backend/schema.sql` first** (steps 1 to 3 above): newer versions of the site
may need a column or rule that the older file did not have, and saving to accounts stops
working until it is there.

## 3. Copy the project address and public key into `js/config.js`

1. In Supabase open **Project Settings** (the gear icon), then **API** (it may be called
   **Data API** or **API Keys**).
2. Copy the **Project URL**. It looks like `https://abcdefghijklm.supabase.co`.
   The part before `.supabase.co` (here `abcdefghijklm`) is your **PROJECT-REF**; you
   need it again in step 6.
3. Copy the **anon public** key, which newer dashboards call the **publishable** key
   (it starts with `eyJ...` or `sb_publishable_...`).
   **Do not** copy the `service_role` or **secret** key: that one must never go on a
   website.
4. Open `js/config.js` in a text editor and fill in the three values between the quotes:

   ```js
   supabaseUrl: 'https://abcdefghijklm.supabase.co',
   supabaseAnonKey: 'eyJhbGciOi...the whole long key...',
   /** Shown on the privacy page so families know who to contact. */
   contactEmail: 'you@example.in',
   ```

   Keep the quotes and the commas. `contactEmail` is **required** once accounts are on:
   it is shown on the privacy page so families can ask you to see or delete their data,
   withdraw consent or complain. While it is empty, the Parent corner shows a note asking
   for it.

**Why it is safe to publish this key.** Anyone can read `js/config.js`, so anyone can
see the anon key; that is how Supabase is designed. The key only lets a browser talk to
your project. What each person can actually read or change is decided by the row level
security rules in `backend/schema.sql`: a visitor who is not signed in can see nothing,
and a signed-in parent can see and change only their own family's profiles and
progress. The secret `service_role` key bypasses those rules, which is why it must stay
private.

## 4. Tell Supabase your site's address

Sign-in emails and Google sign-in send the parent back to your site. Supabase only
sends people to addresses you have allowed.

1. Open **Authentication**, then **URL Configuration**.
2. **Site URL**: YOUR-SITE, for example `https://maths.example.in/`.
3. **Redirect URLs**: press **Add URL** and add:
   * `https://maths.example.in/**` (your address followed by `**`, which allows any
     page of the site, including `index.html`). For a sub-folder:
     `https://example.in/maths/**`.
   * If people also reach the site without or with `www.`, add that address too, e.g.
     `https://www.maths.example.in/**`.
4. Save.

After signing in, the parent lands back on YOUR-SITE followed by `#parent` (the Parent
corner), for example `https://maths.example.in/#parent`. The `**` rule above covers this.

## 5. Email link sign-in

Parents can sign in by typing their email and pressing the link they receive. No
password is needed.

1. Open **Authentication**, then **Sign In / Providers** (older dashboards: **Providers**).
2. Make sure **Email** is enabled. Leave **Confirm email** on. Passwords are not used by
   this site, so the other email settings can stay at their defaults.
3. Optional: under **Authentication → Emails** (or **Email Templates**) you can change the
   emails' wording, for example to mention "Grade 3 Maths". Change both the **Confirm
   signup** template (a parent's very first sign-in gets this one) and the **Magic Link**
   template (every later sign-in).

**Important: sending emails to other families.** Supabase's built-in email sender is
for testing only. It sends just a few emails per hour and may only deliver to email
addresses that belong to your Supabase team. That is fine while you test with your own
address. Before you share the site with other families:

1. Create an account with an email-sending service, for example Brevo, Resend, Zoho
   ZeptoMail or Amazon SES, and verify your domain with it (they guide you through adding
   a few DNS records at your domain registrar).
2. In Supabase open **Authentication → Emails → SMTP Settings** (or **Project Settings →
   Authentication → SMTP**), switch on **custom SMTP**, and paste in the host, port, user
   name and password the service gives you. Use a sender like `no-reply@example.in`.
3. Under **Authentication → Rate Limits** you can raise the emails-per-hour limit once
   custom SMTP is on.
4. Email services keep a log of the emails they sent (the recipient's address and the
   time), often for 30 days or more. In the service's settings, shorten that log period
   if it lets you, and note how long it is: the privacy page mentions these logs (see
   step 9).

Tell families: **open the sign-in link on the same device and browser where they asked
for it.** (For security the link only works where it was requested. To sign in on the
phone, request the link on the phone.)

## 6. Google sign-in

This lets a parent press **Sign in with Google**. You do this part in Google Cloud.

**6a. In Google Cloud**

1. Go to <https://console.cloud.google.com> and sign in with a Google account you will
   keep (ideally one for the site, not a child's).
2. Create a project: the project picker at the top, **New project**, name it for example
   `Grade 3 Maths`, **Create**, then make sure it is selected.
3. Set up the consent screen: in the menu find **APIs & Services → OAuth consent screen**
   (newer consoles call it **Google Auth Platform**; press **Get started** if shown).
   * **App name**: `Grade 3 Maths` (or your site's name).
   * **User support email** and **Developer contact email**: your email.
   * **Audience / User type**: **External**.
   * Under **Branding** (or the same page), add your home page (YOUR-SITE), your privacy
     page (YOUR-SITE followed by `#privacy`, if your site shows it there) and under
     **Authorised domains** add **both** your domain, e.g. `example.in`, **and**
     `PROJECT-REF.supabase.co` (your PROJECT-REF from step 3). Google needs the second one
     because the sign-in returns through Supabase's address.
   * Note: Google's account chooser will say "to continue to PROJECT-REF.supabase.co"
     rather than your site's name. That is normal. Showing your own domain there needs a
     Supabase custom domain, which is a paid add-on.
   * Scopes: you do not need to add any. The basic ones (email, profile, openid) are
     enough.
   * Under **Audience** (or **Publishing status**), press **Publish app** so that it is
     **In production**. While it says "Testing", only test users you list can sign in.
     Google may mention verification; for these basic scopes it is usually not needed
     unless you upload a logo.
4. Create the client: **APIs & Services → Credentials → Create credentials → OAuth client
   ID** (or **Google Auth Platform → Clients → Create client**).
   * **Application type**: **Web application**. Name: `Supabase`.
   * **Authorised JavaScript origins**: your site's origin without a path, e.g.
     `https://maths.example.in`.
   * **Authorised redirect URIs**: `https://PROJECT-REF.supabase.co/auth/v1/callback`
     (use your PROJECT-REF from step 3). Supabase also shows this exact address on its
     Google provider page as the **Callback URL**: copy it from there to be sure.
   * Press **Create**. Copy the **Client ID** and the **Client secret**.

**6b. In Supabase**

1. Open **Authentication → Sign In / Providers → Google** and switch it on.
2. Paste the **Client ID** and **Client secret**. Save.

The Google client secret goes only into Supabase, never into `js/config.js`.

## 7. Upload the site

Upload the site's files to your web host as you did before (see `README.md`), keeping
the folder structure. Upload **only** these:

```
index.html
css/
js/        (including your edited js/config.js and the js/vendor/ folder)
assets/
```

Do **not** upload anything else: `TODO.md` (it has notes about your family and your
decisions), `backend/`, `docs/`, `tools/`, `ACTIVITY_API.md` and `README.md` are for you
only, and anything uploaded can be read by anyone.
If your host or browser caches old files, refresh the page with Ctrl+Shift+R (or
Cmd+Shift+R on a Mac).

Your web host keeps access logs (each visitor's IP address, browser and the pages asked
for). If its control panel lets you, keep them short (for example 7 to 30 days).

## 8. Test it

Use your own email for the first test (it works even before custom SMTP is set up).

- [ ] On the **laptop**, open YOUR-SITE, go to the Parent corner and sign in (Google, or
      the email link opened on the laptop).
- [ ] You come back to the Parent corner signed in. Agree to the privacy notice.
- [ ] Add a child profile (a nickname and an avatar) and play one activity until you get
      stars.
- [ ] The sync status says saved. Optional: in Supabase **Table Editor** you can see one
      row in `children` and some rows in `progress`.
- [ ] On a **phone or tablet**, open YOUR-SITE and sign in with the same Google account
      or email (request the email link on the phone).
- [ ] The same child appears, with the same stars.
- [ ] Play on the phone, then reload the laptop page: the new stars appear there too.
- [ ] Turn the phone's Wi-Fi off, play, turn it back on: the progress catches up.
- [ ] Sign out on one device and check that the site still works without an account.

## 9. Before you share the site with other families

- [ ] Custom SMTP is set up (step 5), so sign-in emails reach every family.
- [ ] `contactEmail` is filled in in `js/config.js` (step 3.4).
- [ ] The privacy page (YOUR-SITE followed by `#privacy`) has been read and checked by a
      qualified person (for example a lawyer who knows the DPDP Act), and its details are
      right for you: who runs the site, the contact email, the 30-day reply time for
      complaints, the 30-day backup period (see **Backups** below), and the technical
      logs (Supabase's request logs, kept about 1 day on the Free plan, 7 on Pro and 28 on
      Team; your email service's log from step 5; your web host's access logs from step
      7). If you want the page to give exact periods for these, ask for them to be added.
- [ ] Ask the same person whether the tick box ("I am the parent or legal guardian…") is
      enough for **verifiable parental consent** under section 9(1) of the DPDP Act and
      Rule 10 of the DPDP Rules 2025 (expected in force from about May 2027), or whether
      an extra check of the parent is needed. Today the site only asks the parent to
      confirm it; it does not check it.
- [ ] The regular clean-up (see **Looking after families' data → Regular clean-up**) is
      scheduled, or in your diary.
- [ ] Then remove the yellow "Draft — to be checked by a qualified person" note: open
      `js/app.js` in a text editor, search for `privacy-draft`, and delete that whole line
      (it starts with `el('p', { class: 'privacy-draft'`). Upload `js/app.js` again.
- [ ] **Every time the privacy text changes later**, also change `consentVersion` in
      `js/config.js` (for example from `'2026-11'` to `'2027-02'`). Every parent is then
      asked to agree again on their next visit; until they do, their progress is not
      synced.

**The claude.ai preview cannot test this.** The preview blocks connections to outside
services, so sign-in and sync only work on your real site (YOUR-SITE). In the preview
the site behaves as if accounts were switched off.

If something fails, see **Troubleshooting** at the end.

## Turning accounts off again

Open `js/config.js`, empty the two values (`supabaseUrl: ''` and `supabaseAnonKey: ''`)
and upload the file again. The site goes back to saving progress on each device only.
Progress already on a device stays there.

The families' data in Supabase does **not** go away by itself, and once accounts are off
parents can no longer use **Delete my account** or see their account email in **Download
my data**. (The privacy page then tells them to contact you instead.) Their browsers also
keep their sign-in (and Supabase keeps the matching device rows) until it is deleted.
Before or right after switching accounts off, choose one:

1. **Delete the families' data.** Either delete the whole project (**Project Settings →
   General → Delete project**), or delete every user in **Authentication → Users** and
   then run the **Regular clean-up** below once. Deleting the users also ends the
   sign-ins kept in families' browsers (they no longer work).
2. **Or keep it, and keep looking after it:** answer deletion and access requests by
   email (see **Deleting a family on request** and **Seeing a family's data on
   request**), and keep the **Regular clean-up** running.

## Looking after families' data

**What is stored.** For each parent: their email (in Supabase's sign-in system), the
privacy notice version they agreed to and when (the time comes from the database). If
they use **Continue with Google**, Google also shares their name, a link to their Google
profile picture and their Google account id, which Supabase keeps with the login (the
site does not use them). Asking for an email sign-in link already creates the login,
even if the link is never opened (for example a mistyped address that belongs to someone
else); the **Regular clean-up** below removes those. For each signed-in device, Supabase
keeps its IP address and browser until the parent signs out there while online, or
deletes the account. A device that was signed out without a connection, or whose browser
data was cleared, stays listed (with a sign-in that still works) until the account is
deleted or the clean-up removes it. For each child: a nickname, an emoji avatar, and how
many times and when progress was last reset, and per activity the stars, plays,
questions answered, right-first-time count, mistake counts, the time it was last played
and which reset it was built after. Every row also has the time it was created and last
changed. Nothing else: no child email, birthday, photo, location, ads or tracking.

**Technical logs.** Outside the tables, Supabase writes request logs for every sync
request and sign-in (time, IP address, browser, the address asked for and, for sign-in
requests, the email address or the parent's user id; the sign-in service's own log lines
include the email address, also for a link asked for with a mistyped address). They are kept for your plan's log period (about 1 day on
Free, 7 days on Pro, 28 on Team) and then deleted; **Delete my account** does not remove
them. Your email service (step 5) and web host (step 7) keep their own logs. The privacy
page tells families about these logs in general terms.

Supabase's sign-in system also keeps a log of sign-ins (time, IP address, the parent's
email and what happened, for example "login" or "user_recovery_requested") in
`auth.audit_log_entries`. Nothing removes it by itself. **Delete my account** in the
Parent corner deletes the parent's entries. If Supabase ever stops allowing that, the
account is still deleted, a warning `delete_my_account: sign-in log not removed` appears
in **Logs → Postgres**, and the **Regular clean-up** removes the entries left behind
(the privacy page says "at the latest by the next monthly clean-up"). When you delete a
user yourself, delete their entries by hand too (see below); the clean-up also catches
any you forget.

**Regular clean-up.** Do this about once a month (or schedule it, below). Open **SQL
Editor**, paste this, and press **Run**:

```sql
-- Sign-in links asked for more than 7 days ago and never used: their sign-in log
-- entries first, then the logins themselves (they have no children or progress).
delete from auth.audit_log_entries a
  using auth.users u
  where u.email_confirmed_at is null and u.last_sign_in_at is null
    and u.created_at < now() - interval '7 days'
    and (a.payload->>'actor_id' = u.id::text or a.payload->'traits'->>'user_id' = u.id::text);
delete from auth.users
  where email_confirmed_at is null and last_sign_in_at is null
    and created_at < now() - interval '7 days';
-- Sign-in log entries about users that no longer exist (deleted accounts whose entries
-- were left behind). Entries written by the system itself (the all-zero id) stay.
delete from auth.audit_log_entries a
  where (a.payload->>'actor_id' ~ '^[0-9a-f-]{36}$'
         and a.payload->>'actor_id' <> '00000000-0000-0000-0000-000000000000'
         and not exists (select 1 from auth.users u where u.id::text = a.payload->>'actor_id'))
     or (a.payload->'traits'->>'user_id' ~ '^[0-9a-f-]{36}$'
         and not exists (select 1 from auth.users u where u.id::text = a.payload->'traits'->>'user_id'));
-- Devices not used for 90 days (signed out without a connection, or browser data cleared).
-- A device that is still used renews its sign-in every hour or so and is not affected; an
-- idle one is signed out and simply asks the parent to sign in again.
delete from auth.sessions
  where coalesce(refreshed_at::timestamptz, updated_at, created_at) < now() - interval '90 days';
```

To have Supabase do it every night instead: open **Database → Extensions**, switch on
`pg_cron`, then run the same four statements wrapped like this (once):
`select cron.schedule('grade3-cleanup', '17 3 * * *', $$ ...the four statements... $$);`
(If you set this up with an earlier version of this guide, which had three statements,
run `select cron.unschedule('grade3-cleanup');` and then schedule it again with four.)
(To stop it: `select cron.unschedule('grade3-cleanup');`.)

**Other services the site talks to.** The typeface comes from Google Fonts (every
visitor's browser asks Google for it). Your sign-in emails go through the email service
you chose in step 5. The sign-in code library is served from your own site
(`js/vendor/`), not from an outside script host. The privacy page lists these.

**Deleting a family on request.** Parents can delete everything themselves in the Parent
corner (**Delete account**). If a parent emails you instead:

1. In Supabase open **Authentication → Users**.
2. Search for their email and copy the user's id (**USER-ID** below). Then open the row's
   menu and choose **Delete user**.
3. That removes the parent, all their child profiles, all their progress and their
   signed-in devices (the tables are linked so the deletion cascades).
4. **After** deleting the user (deleting writes one more log entry about it), remove the
   sign-in log entries: open **SQL Editor**, paste this with USER-ID replaced, and press
   **Run**:
   `delete from auth.audit_log_entries where payload->>'actor_id' = 'USER-ID' or payload->'traits'->>'user_id' = 'USER-ID';`
   (If you forget, the **Regular clean-up** removes them: their user no longer exists.)
5. If you keep CSV exports (see **Backups**), delete that family's rows from them, or
   delete the files.
6. Reply to confirm it is done. Do this within 30 days: the privacy page promises it.

Ask the request to come from the same email address as the account, so you know it is
really the parent.

**Seeing a family's data on request.** Parents can press **Download my data** in the
Parent corner, but that file holds only the copy on that device and the account email.
The privacy page promises everything else on request (login details, devices, the
sign-in log, consent), so when a parent asks:

1. In **Authentication → Users**, search for their email and copy the user's id
   (**USER-ID** below).
2. Open **SQL Editor**, paste this with USER-ID replaced (every place it appears) and press
   **Run**. It gives one result with everything, without passwords or secret tokens.
   (Run it as one statement: when several are run together the SQL Editor only shows the
   last result.)

   ```sql
   select jsonb_build_object(
     'login', (select to_jsonb(u) - 'encrypted_password' - 'confirmation_token' - 'recovery_token'
                 - 'email_change_token_new' - 'email_change_token_current' - 'reauthentication_token'
                 - 'phone_change_token'
               from auth.users u where u.id = 'USER-ID'),
     'identities', (select jsonb_agg(jsonb_build_object('provider', provider, 'identity_data', identity_data, 'created_at', created_at))
                    from auth.identities where user_id = 'USER-ID'),
     'devices', (select jsonb_agg(jsonb_build_object('created_at', created_at, 'refreshed_at', refreshed_at, 'ip', ip, 'user_agent', user_agent))
                 from auth.sessions where user_id = 'USER-ID'),
     'sign_in_log', (select jsonb_agg(jsonb_build_object('created_at', created_at, 'ip_address', ip_address, 'payload', payload))
                     from auth.audit_log_entries
                     where payload->>'actor_id' = 'USER-ID' or payload->'traits'->>'user_id' = 'USER-ID'),
     'consent', (select to_jsonb(p) from public.parents p where p.id = 'USER-ID'),
     'children', (select jsonb_agg(to_jsonb(c) - 'recent_reset_ids') from public.children c where c.parent_id = 'USER-ID'),
     'progress', (select jsonb_agg(to_jsonb(g)) from public.progress g
                  join public.children c on c.id = g.child_id where c.parent_id = 'USER-ID')
   ) as everything;
   ```

3. Copy the result (or use **Export** / **Download**) into a file, and send it **only to
   the account's own email address** (ask the request to come from it). Then delete your
   own copy of the file.


**Backups.** The privacy page tells families that safety copies are kept for at most
30 days, so a deleted family is gone from them within 30 days. Keep to that:

* Supabase's own backups (daily on paid plans, kept 7 days; **Database → Backups**) fit.
  If you turn on a longer backup option (for example point-in-time recovery for longer
  than 30 days), change the privacy page first.
* If you also export the tables yourself (**Table Editor**, each of `parents`, `children`
  and `progress`, **Export → CSV**), keep only the latest set, delete any files older than
  30 days, and keep them somewhere private: they are families' data. When you handle a
  deletion request, delete that family's rows from any file you still keep.

Each device also keeps its own copy of progress, so a cloud problem never wipes a
child's stars on the device they play on.

**Keep these private:** your Supabase password and database password, the
`service_role` / secret key, and the Google client secret. Only the Project URL and the
anon/publishable key go on the website.

## Troubleshooting

* **"Redirect URL not allowed", or sign-in returns to the wrong page.** Check step 4:
  the Site URL and the `**` Redirect URL must match the address in the browser exactly,
  including `https://`, `www.` and any sub-folder.
* **Google says "redirect_uri_mismatch".** The Authorised redirect URI in Google Cloud
  must be exactly `https://PROJECT-REF.supabase.co/auth/v1/callback`.
* **Google says the app is in testing / access blocked.** Publish the app (step 6a.3).
* **The sign-in email never arrives.** Look in spam. With the built-in sender only your
  own team's addresses get emails and only a few per hour: set up custom SMTP (step 5).
* **The email link opens but the parent is not signed in.** It was opened on a different
  device or browser from the one that asked for it, it was more than an hour old, or it
  had been used already (some email services "pre-open" links to scan them). The Parent
  corner then says "Sign-in did not finish…". Request a new link on the device you want
  to use.
* **Signing out on one device.** Sign out only signs out that device; the family's other
  devices stay signed in. If some progress could not be saved yet (for example the
  device is offline), the Parent corner says so and offers "Sign out anyway". A child
  removed on that device that had not reached the account yet is deleted from the account
  the next time the parent signs in on that device (the Parent corner says so); a "Reset
  progress" that had not reached it is not, and has to be done again.
* **"Could not reach the sign-in service".** Check the two values in `js/config.js`
  (no spaces, the whole key, quotes kept), that the project is not paused, and that you
  are not in the claude.ai preview.
* **The Parent corner says "Your account could not be updated" or "Something went
  wrong".** "Your account could not be updated" usually means the database rules are
  missing or out of date: run `backend/schema.sql` again in the SQL Editor (step 2). The
  exact message from Supabase is in the browser's console (press F12, then **Console**,
  and look for "Account service:"). If it mentions "row-level security", "permission
  denied", a missing table or a missing column, run `backend/schema.sql` again.
* **"A family can have at most 10 child profiles."** The database allows up to 10
  children per parent. Remove a profile you no longer use.
* **Saving stopped right after you uploaded a new version of the site** (for example an
  error about a `reset_gen` or `reset_at` column). Run the new `backend/schema.sql` in the
  SQL Editor (step 2). (The version that added `reset_gen` counts "Reset progress" in the
  database instead of using the devices' clocks; when you first run it, it also removes
  records from before earlier resets, which the old version left hidden in the table.)
