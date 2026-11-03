# Setting up parent accounts and cloud sync

This guide switches on **parent sign-in** so your child's stars and progress follow
them from the laptop to a phone or tablet. It takes about an hour, once. You do not
need to write any code: you will click through two websites (Supabase and, for Google
sign-in, Google Cloud), paste one file, and copy two values into `js/config.js`.

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
   * **Region**: **South Asia (Mumbai)**, shown as `ap-south-1`. This keeps families'
     data in India, which suits the DPDP Act.
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

It is safe to run the file again later, for example after an update to the site.

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

   Keep the quotes and the commas. `contactEmail` is shown on the privacy page so
   families can ask you to see or delete their data.

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
   **Magic Link** email's wording, for example to mention "Grade 3 Maths".

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
     **Authorised domains** your domain, e.g. `example.in`.
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
the folder structure:

```
index.html
css/
js/        (including your edited js/config.js)
assets/
```

`backend/`, `docs/`, `tools/`, `ACTIVITY_API.md` and `README.md` do not need uploading.
If your host or browser caches old files, refresh the page with Ctrl+Shift+R (or
Cmd+Shift+R on a Mac).

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

**The claude.ai preview cannot test this.** The preview blocks connections to outside
services, so sign-in and sync only work on your real site (YOUR-SITE). In the preview
the site behaves as if accounts were switched off.

If something fails, see **Troubleshooting** at the end.

## Turning accounts off again

Open `js/config.js`, empty the two values (`supabaseUrl: ''` and `supabaseAnonKey: ''`)
and upload the file again. The site goes back to saving progress on each device only.
Progress already on a device stays there. The data in Supabase stays there until you
delete it (or delete the whole project under **Project Settings → General → Delete
project**).

## Looking after families' data

**What is stored.** For each parent: their email (in Supabase's sign-in system), the
privacy policy version they agreed to and when. For each child: a nickname, an emoji
avatar, and stars, plays, answers and mistake counts per activity. Nothing else: no
child email, birthday, photo, location, ads or tracking.

**Deleting a family on request.** Parents can delete everything themselves in the Parent
corner (**Delete account**). If a parent emails you instead:

1. In Supabase open **Authentication → Users**.
2. Search for their email, open the row's menu and choose **Delete user**.
3. That removes the parent, all their child profiles and all their progress (the tables
   are linked so the deletion cascades). Reply to confirm it is done.

Ask the request to come from the same email address as the account, so you know it is
really the parent.

**Seeing a family's data on request.** Parents can press **Download my data** in the
Parent corner. You can also find their rows in **Table Editor** (`children` filtered by
`parent_id`, which is the user id shown in **Authentication → Users**).

**Backups.** Supabase's free plan keeps its own short-term safety backups but does not
let you download them. Two simple options:

* Every month or so, open **Table Editor**, choose each of `parents`, `children` and
  `progress`, and use **Export → CSV**. Keep the files somewhere private: they are
  families' data.
* Or move to a paid plan, which keeps daily backups you can restore from **Database →
  Backups**.

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
  device or browser from the one that asked for it. Request a new link on the device you
  want to use.
* **"Could not reach the sign-in service".** Check the two values in `js/config.js`
  (no spaces, the whole key, quotes kept), that the project is not paused, and that you
  are not in the claude.ai preview.
* **Sync status shows an error mentioning "row-level security" or a missing table.** Run
  `backend/schema.sql` again in the SQL Editor (step 2).
* **"A family can have at most 10 child profiles."** The database allows up to 10
  children per parent. Remove a profile you no longer use.
