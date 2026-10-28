# Kiro 101: set up your workshop app

You will run a small social-posting app on your laptop and connect it to your own free Supabase cloud project. When you finish, you should be able to create an app account, log in, write a post and see it again after refreshing the browser.

Allow **45–60 minutes for a first setup**, depending on downloads and account creation. This is a planning estimate. Keep this guide open while you work.

## Start here: get the project from GitHub

Use the **[kiro-workshop-supabase repository](https://github.com/blantaratech/kiro-workshop-supabase)** for this workshop. Step 3 shows you how to clone it to your laptop.

The frontend runs locally on your laptop. **Supabase is the backend**: it provides login, the database and access rules. You will configure it through the Supabase dashboard.

## What runs where?

```text
YOUR LAPTOP                         YOUR SUPABASE CLOUD PROJECT
Kiro + Node.js + the web app  ────►  Login service + database + access rules
```

| Word | Meaning in this workshop |
| --- | --- |
| Frontend | The app screens you open in your browser |
| Backend | The cloud services that handle login and save data |
| Node.js | Software that runs the app's local development tools |
| npm | The tool installed with Node.js that downloads the app's required packages |
| Git | The tool used to clone the project from GitHub to your laptop |
| Terminal | A command box where you enter the commands in this guide |
| Supabase project | Your own cloud database and login service |
| SQL | Instructions that create the database tables and access rules |
| Publishable key | A browser-safe project key; database rules still control data access |

Each student uses a **separate Supabase project**. You will initially see your own project's posts, not your classmates' posts.

## Before you begin

Have these ready:

- A Windows, macOS or Linux laptop with internet access and permission to install software.
- A modern browser, such as Chrome, Edge or Firefox.
- An account for signing in to Kiro and an account for the Supabase dashboard.
- Access to the [workshop repository on GitHub](https://github.com/blantaratech/kiro-workshop-supabase).

The steps below install Kiro, Node.js and Git, then set up your Supabase project in the browser.

### Keep the three sign-ins clear

| Sign-in | What it is for |
| --- | --- |
| Kiro account | Using the AI coding editor |
| Supabase dashboard account | Creating and managing your cloud project |
| Workshop app account | Logging into the Micro Blogging app you will run locally |

They are separate accounts. Use a new password for the workshop app, rather than reusing your university password.

## Step 1 — Install Kiro IDE

1. Open [kiro.dev/downloads](https://kiro.dev/downloads/).
2. Download **Kiro IDE** for your operating system and run the installer.
3. Open Kiro and follow its sign-in prompts.
4. Finish the sign-in in your browser, then return to Kiro.
5. Importing settings from another editor is optional. You can skip it.

**Check:** Kiro opens and you can reach its welcome screen. If you already installed it, continue.

## Step 2 — Install Node.js 24 and Git

1. Open the [official Node.js download page](https://nodejs.org/en/download).
2. Install **Node.js 24.x**, including npm. If the page offers a different major version, select version 24 from the version choices or [version 24 archive](https://nodejs.org/en/download/archive/v24).
3. Open the [official Git installation page](https://git-scm.com/install/), choose your operating system and follow its installation instructions. On Windows, keep Git available from the command line when the installer offers that choice.
4. Close and reopen Kiro after installation so its terminal can find Node.js and Git.
5. In Kiro, select **Terminal → New Terminal**.

On **Windows PowerShell**, enter these commands one at a time:

```powershell
node --version
npm.cmd --version
git --version
```

On **macOS or Linux**:

```bash
node --version
npm --version
git --version
```

**Check:** Node prints a version beginning with `v24.`, npm prints a version number, and Git prints `git version ...`. The kit was checked locally using Node.js 24.19.0 and npm 11.17.0. You do not need those exact patch versions, but use major version 24 for this workshop.

If a command is not recognised, see troubleshooting before continuing. On Windows, use `npm.cmd` throughout this guide to avoid PowerShell script-policy issues.

## Step 3 — Clone the project from GitHub

Cloning creates a local copy of the project files. In Kiro's terminal, go to a personal folder where you keep projects, then enter these commands one at a time.

Windows PowerShell:

```powershell
mkdir KiroWorkshop
cd KiroWorkshop
git clone https://github.com/blantaratech/kiro-workshop-supabase.git
cd kiro-workshop-supabase
```

macOS/Linux:

```bash
mkdir -p KiroWorkshop
cd KiroWorkshop
git clone https://github.com/blantaratech/kiro-workshop-supabase.git
cd kiro-workshop-supabase
```

If `KiroWorkshop` already exists, skip its creation and use `cd KiroWorkshop` from its parent folder. Wait for cloning to finish before entering the last command. If you already cloned this repository, use that folder and continue to Step 4.

Your cloned project should contain:

```text
kiro-workshop-supabase/
├── package.json
├── package-lock.json
├── README.md
├── STUDENT_SETUP_GUIDE.html
├── frontend/
│   ├── .env.example
│   └── src/
└── supabase/
    └── schema.sql
```

Other folders, such as `tests/`, are included too. They do not need to be opened for setup.

**Check:** Cloning finishes without a fatal error, and the `kiro-workshop-supabase` folder contains `package.json`, `frontend` and `supabase`. You will configure your own Supabase connection in Step 9.

## Step 4 — Open the correct folder in Kiro

1. In Kiro, choose **File → Open Folder**.
2. Select **`kiro-workshop-supabase`**: the folder containing the top-level `package.json` shown above.
3. Open **Terminal → New Terminal**.
4. Check where the terminal is:

Windows PowerShell:

```powershell
Get-Location
Get-ChildItem
```

macOS/Linux:

```bash
pwd
ls
```

**Check:** The listing includes `frontend`, `supabase`, `package.json` and `package-lock.json`. If you see only the files inside `frontend`, move up one folder with `cd ..` and check again.

The commands below start from this **project root folder** unless stated otherwise.

## Step 5 — Create your own free Supabase project

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) in your browser and sign in or create an account.
2. Create or select an organization on the **Free** plan.
3. Choose **New project**.
4. Name it something recognisable, such as `kiro-101-yourname`.
5. Create a database password and keep it somewhere safe. You will **not** paste this password into the frontend.
6. Choose the region specified by your facilitator, or the nearest available region.
7. Check that you are creating a Free-plan project, then create it.
8. Wait for the dashboard to show that the project is available.

**Check:** Your project has its own dashboard, including SQL Editor and Authentication.

If you have reached the free-project limit, ask the facilitator for help. Do not delete an existing project that you still need.

## Step 6 — Create the workshop database

Run the database setup **before creating your workshop app account**.

1. In Kiro, open `supabase/schema.sql`.
2. Select and copy the **whole file**. On Windows/Linux use Ctrl+A then Ctrl+C; on macOS use Cmd+A then Cmd+C.
3. In your Supabase project, open **SQL Editor**.
4. Create a new query, paste the complete file and select **Run**.
5. Wait for completion. You should see a success result with no SQL error. The exact dashboard wording may vary.
6. Open **Table Editor** and check for four tables: `profiles`, `posts`, `likes`, and `follows`. Empty tables are normal.

The file also creates access rules and helper functions. **Keep Row Level Security enabled.** These rules let signed-in app users read the feed while restricting whose records they can change.

**Check:** All four tables exist and the SQL completed successfully. You can rerun the same file if needed; it preserves existing workshop data.

If you disabled the Supabase Data API when creating the project, enable it for the `public` schema using the project's Data API settings. The app uses that API. [Supabase quickstart reference](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

## Step 7 — Choose the workshop email setting

For this **disposable learning project**, the simplest route is to turn off email confirmation before the first app signup. This avoids waiting for confirmation messages during class.

1. Open **Authentication** in your Supabase project.
2. Find the **Email** provider settings. Depending on the dashboard version, they may appear under **Sign In / Providers** or **Providers**.
3. Keep email/password sign-in enabled and allow new signups for the exercise.
4. Turn **Confirm email** off and save the change.

**What this means:** A person can create an app account without proving they own the entered email address. Use this choice only for the disposable workshop project. Keep Row Level Security on.

**Check:** Confirm email is off before you create the app account in Step 12. The app still requires a password of at least eight characters. If your project uses stronger password rules, follow them.

### If your facilitator asks you to keep confirmation on

The kit supports this too. After signup, it will tell you to confirm your email and then log in. Use a real email address you control. Supabase's built-in email service has recipient restrictions and a small sending allowance, so repeated resends are not a reliable classroom workaround. Ask the facilitator to confirm the email setup if no message arrives. [Email service reference](https://supabase.com/docs/guides/auth/auth-smtp)

## Step 8 — Set the local app address

1. Open **Authentication → URL Configuration** in your Supabase project.
2. Set **Site URL** to:

```text
http://localhost:5173
```

3. Add these local addresses to the allowed **Redirect URLs**:

```text
http://localhost:5173
http://127.0.0.1:5173
```

4. Save the settings.

Both addresses refer to your own laptop. This setting matters when the app uses an email-confirmation redirect. [Redirect URL reference](https://supabase.com/docs/guides/auth/redirect-urls)

**Check:** The local address uses port `5173`, matching the kit's start command.

## Step 9 — Add your Supabase connection values

1. In your Supabase project, open **Connect** and find the frontend/client connection details. The same values are also available in the project's API settings.
2. Copy your **Project URL** and **Publishable key**. A new publishable key starts with `sb_publishable_`. Older projects may show a browser-safe legacy `anon` key instead; the kit accepts that too.
3. In Kiro, check whether `frontend/.env.local` already exists. If you have already configured it, open it and review its values instead of overwriting it.
4. On a fresh clone, copy the template using the terminal:

Windows PowerShell:

```powershell
Copy-Item .\frontend\.env.example .\frontend\.env.local
```

macOS/Linux:

```bash
cp frontend/.env.example frontend/.env.local
```

5. Open `frontend/.env.local` in Kiro and replace both example values:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

6. Keep the names to the left of `=` unchanged. Paste your own values to the right. Replace the placeholders completely; do not paste angle brackets or explanatory text.
7. Save the file. Its name must be **`.env.local`**, not `.env.local.txt`.

**Check:** Your file is inside `frontend/`, the URL starts with `https://`, and both example values have been replaced. Use the base Project URL, without adding `/rest/v1` or `/auth/v1`.

**Use only the publishable or legacy anon key here.** A database password, `sb_secret_` key or `service_role` key does not belong in a browser app. The kit checks for common mistakes, but you should still choose the right key. [API key reference](https://supabase.com/docs/guides/api/api-keys)

## Step 10 — Install the app's packages

In Kiro's terminal, make sure you are still in the **project root**, not `frontend/`. Then run:

Windows PowerShell:

```powershell
npm.cmd ci
```

macOS/Linux:

```bash
npm ci
```

This downloads the versions recorded in `package-lock.json`. Wait until the command finishes and the terminal prompt returns. Do not close the terminal during installation.

**Check:** The command finishes without `npm error`. A different package count is not by itself a problem. If installation fails, keep the error message and use the troubleshooting table.

## Step 11 — Start the frontend and check the connection

From the same project-root terminal:

Windows PowerShell:

```powershell
npm.cmd run dev
```

macOS/Linux:

```bash
npm run dev
```

1. Leave this terminal running.
2. Open the local address printed in the terminal, normally **[http://127.0.0.1:5173](http://127.0.0.1:5173)**. You can also use **[http://localhost:5173](http://localhost:5173)**.
3. You should reach the Micro Blogging login page.
4. Find **Check connection** at the bottom and click it.

**Check:** The message says **“Connected — workshop database is ready.”** This checks the cloud connection and the installed kit version. It does not yet prove that signup and posting work; do those next.

If the screen instead says **Connect your Supabase project**, return to Step 9. After any `.env.local` change, stop the app with Ctrl+C and run the start command again. [Vite environment-file reference](https://vite.dev/guide/env-and-mode)

## Step 12 — Create your workshop app account

1. On the local app's login page, click **Register**.
2. Fill in the fields:

| Field | What to enter |
| --- | --- |
| Username | 3–24 lowercase letters, numbers or underscores; for example, `student_01` |
| Email | An email address for this test account; use one you control if confirmation is enabled |
| Display Name | The name to show on your posts, up to 64 characters |
| Password | A new workshop password with at least eight characters; follow any stronger rules set for your project |
| Confirm Password | The same password again |

3. Click **Register** once and wait.
4. If you turned off confirmation before signup, you should enter the feed automatically.
5. If confirmation is on, follow the displayed instruction, confirm your email and then use **Login**.

**Check:** You can see the feed, the New Post link and your display name. An empty feed is expected in a new project.

On the **Login** page, use your **email and app password**. The username is your profile handle; it is not the login field in this Supabase edition.

## Step 13 — Write a post and check that it was saved

1. Click **New Post** in the app menu.
2. Type a short message, such as `Hello from my Kiro workshop`.
3. Click **Post**.
4. Check that the message appears in the feed.
5. Refresh the browser. Check that the message is still there.
6. Click its Like button once. Check that its count updates and another click is prevented.
7. Click **Profile**. Choose **Edit Profile**, change your display name or short bio, then save.
8. Click **Logout**, then log in again using your email and app password.

**Check:** Your post survives a refresh and logout/login. A successful screen load alone is not the finish line.

The starter allows posts up to 280 characters. A Cancel button on New Post and real commenting are deliberately left for the workshop exercises. A zero comment count does not mean a commenting feature is already implemented.

## Step 14 — Optional: check a second user

To try following another user, both accounts must belong to the **same Supabase project**. Your classmates' separate projects do not share a feed.

1. Keep the app open in your normal browser window as account A.
2. Open the same local URL in a private/incognito window and register a second test account with a different username and email.
3. Create a short post as account B.
4. Refresh account A's feed. Click account B's display name to open their profile.
5. Click **Follow**, then **Unfollow**, and observe the count change.
6. Close the private window when you finish.

**Check:** Each account has its own identity, while both can see posts in that one project's feed. Browser privacy settings and the email setting still apply to the second account.

## Step 15 — Open your first Kiro chat

With the project open in Kiro, start a chat and enter:

```text
Explain this project in simple English. Describe what the frontend does,
how it connects to Supabase, and where the main pages are.
Do not change any files yet.
```

Read the answer and compare it with the files. Ask follow-up questions if a term is unclear. The facilitator will guide you through steering, a small Vibe change, and a reviewed specification later.

**Check:** You can explain where the app runs and where its data is saved.

## Stop today and restart next time

### To stop

1. Save your files in Kiro.
2. Click the terminal running the app and press **Ctrl+C**. This also works in the macOS terminal.
3. Close the browser tab when you finish. Log out first if you share the laptop.

Stopping the frontend does not delete your cloud project or its posts.

### To return later

1. Open the same `kiro-workshop-supabase` folder in Kiro.
2. Open a terminal at the project root.
3. Run `npm.cmd run dev` on Windows, or `npm run dev` on macOS/Linux.
4. Open the local URL and log in if asked.

You normally do not need to rerun SQL or install packages every time. If Supabase paused your Free project after inactivity, resume it in the dashboard and check the connection again. Check current plan details on [Supabase pricing](https://supabase.com/pricing).

After the course, follow your facilitator's instructions about keeping or removing your disposable cloud project. Deleting a project also deletes its workshop data.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| `git` is not recognised or the command is not found | Complete the Git installation in Step 2, then close and reopen Kiro and its terminal. |
| `git clone` reports “Repository not found” or asks for access | Check the exact repository URL in Step 3. Ask the facilitator to confirm your access if needed. Do not use another student's credentials. |
| `git clone` says the destination folder already exists | If it contains this project, open it and continue to Step 4. Otherwise choose another parent folder; keep any existing work. |
| `node` is not recognised | Finish the Node.js 24 installation, then close and reopen Kiro and its terminal. |
| PowerShell says `npm.ps1` cannot be loaded | Use the guide's `npm.cmd` command. You do not need to change the computer's execution policy. |
| `EBADENGINE` or an unsupported Node version | Run `node --version`. Install Node.js 24.x and reopen Kiro. |
| `ENOENT`, missing `package.json` or no lockfile | Your terminal is probably in the wrong folder. Repeat Step 4 and locate the project root. |
| `npm ci` says the lockfile and package file do not match | Keep the error and ask the facilitator to check the files. If advised, clone the repository into a separate folder, preserving your existing work and `.env.local`. Do not delete the supplied lockfile as your first fix. |
| Package download fails, times out or has a certificate error | Check internet access and the university network's proxy requirements with the facilitator. Do not disable certificate checking. |
| Port 5173 is already in use | Find the earlier terminal running your workshop app and stop it with Ctrl+C. Then start again. Ask for help if the port belongs to something else; do not stop all Node processes. |
| Browser cannot open the local app | Check that `npm run dev` is still running. Use the exact URL from that terminal. |
| “Connect your Supabase project” appears | Check both values in `frontend/.env.local`, remove the example text and restart the frontend. |
| The key is rejected as secret | Copy the publishable key or legacy anon key. A database password, `sb_secret_` key or `service_role` key is the wrong value. |
| A connection check reports a missing function/schema | Run all of `supabase/schema.sql` in the same project whose URL you copied. Do not use a different project's key. |
| “Failed to fetch”, project unreachable or connection timeout | Check the Project URL, key, network access and whether the Supabase project is running. Keep the base URL free of extra API paths. |
| Changes to `.env.local` have no effect | Stop with Ctrl+C, save the file, then start again. Check it is not named `.env.local.txt`. |
| Register does not accept a username | Use 3–24 lowercase letters, digits or underscores. The username must be unique in this project. |
| “Database error saving new user” | Check that the full SQL ran before signup and that the username is valid and unused. Ask the facilitator to inspect the project error if it persists. |
| “Email not confirmed”, no confirmation mail or email rate limit | Recheck Step 7. Do not repeatedly resend. An account created before changing the setting may need email confirmation or facilitator help. |
| Login fails | Use the app account's email, not its username or your Supabase dashboard password. Check the confirmation setting and password. |
| A profile is missing | The app account may have been created before SQL setup. Ask the facilitator to repair it or help create a fresh test account after setup; do not delete the tables. |
| Permission denied, RLS or missing-table errors | Check that the whole supplied SQL completed in the correct project. Keep RLS on and show the exact error to the facilitator. |
| A classmate's post is missing | Separate Supabase projects have separate data. For the two-user exercise, create both app accounts in your own project. |

### What to share when asking for help

Share the step number, the exact error, your operating system, and the output of `node --version` and `npm.cmd --version` (Windows) or `npm --version` (macOS/Linux). A screenshot of the error can help. Hide passwords, secret keys and sign-in codes.

## Ready-for-workshop checklist

- [ ] Git is available, I cloned the GitHub repository and opened its root folder.
- [ ] Kiro is signed in and Node.js 24 and npm are available.
- [ ] I created my own Free Supabase project.
- [ ] The complete SQL ran and all four tables exist.
- [ ] I chose the workshop email-confirmation setting before app signup.
- [ ] My own Project URL and publishable key are saved in `frontend/.env.local`.
- [ ] Package installation completed and the local app starts.
- [ ] Check connection reports that the database is ready.
- [ ] I can register/login, create a post and see it after a refresh.
- [ ] I know how to stop and restart the frontend.

## Official help

- [Kiro installation and sign-in](https://kiro.dev/docs/getting-started/installation/)
- [Git installation](https://git-scm.com/install/)
- [Cloning a GitHub repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)
- [Supabase with React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Supabase password login and email confirmation](https://supabase.com/docs/guides/auth/passwords)
- [Supabase public and secret API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase email service](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase Free-plan limits](https://supabase.com/pricing)

Dashboard labels and plan allowances can change. The Supabase setup references were checked on 26 October 2026; the Git installation and cloning references were checked on 29 October 2026. The supplied browser tests simulate Supabase responses; the local database tests check SQL access rules. Your own cloud project's live signup and posting are verified by the manual checks above.
