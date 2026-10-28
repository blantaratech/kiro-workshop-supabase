# Kiro workshop: student learning path

Start with **Kiro 101**, then continue to **Kiro 102**. Both lessons use the same Supabase workshop app.

| Lesson | What you will do | Open the guide |
| --- | --- | --- |
| **[Kiro 101](kiro-101/README.md)** | Install the tools, create your Supabase project and run the app | [Browser guide](kiro-101/STUDENT_SETUP_GUIDE.html) · [Markdown guide](kiro-101/STUDENT_SETUP_GUIDE.md) |
| **[Kiro 102](kiro-102/README.md)** | Plan a small feature with specs and connect Jebat MCP | [Browser guide](kiro-102/STUDENT_GUIDE.html) · [Markdown guide](kiro-102/STUDENT_GUIDE.md) |

On GitHub, use the Markdown guides. After cloning or downloading, open the HTML guides in your browser for the contents menu, copy buttons and printing.

## Find your materials

```text
kiro-workshop-supabase/
├── README.md          Start here: choose your lesson
├── kiro-101/          Setup guide and app design reference
├── kiro-102/          Specs + Jebat guide, examples, configs and worksheet
├── frontend/         Shared React app
├── supabase/         Database setup SQL
├── tests/            Checks for your app changes
└── scripts/          App browser-test helper
```

Open the **repository root** in Kiro: the folder containing `package.json`, `frontend` and `supabase`. Run npm commands from that folder, even while reading a guide inside a lesson folder.

Each student uses their own Supabase project. Keep your connection values in `frontend/.env.local`, following Kiro 101. Use only a publishable or legacy anon key in the frontend.

## Already set up?

From the repository root, start the app:

```powershell
npm.cmd run dev
```

On macOS/Linux, use `npm run dev`. If this is your first time, follow Kiro 101 before running this command.
