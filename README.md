# PONCE-OS

Marco Ponce's portfolio — built as an operating system, not a webpage.

Visitors boot into a workstation: a kernel boot sequence, a particle constellation,
a live "coding since age 10" uptime counter, and a terminal that actually works.

**Live:** https://poncema4.vercel.app

## The terminal is real

Type `help` in the terminal on the site. Highlights:

| Command | What it does |
|---|---|
| `neofetch` | System card with ASCII Tux |
| `nmap marco` | Skill set, presented as an open-port scan |
| `sudo hire-marco` | Recruitment protocol |
| `resume` | Downloads the actual resume PDF |
| `history` | Career timeline |
| `stack` | Languages and tools |
| `lang es` / `lang en` | Bilingual mode |
| `ping keel` | Say hello to the first mate |
| `reboot` | Replay the boot sequence |

There is also a hidden admin mode (`su`), a Konami code, and a few other things
left for visitors to find.

## Stack

- Vite + React 18 + TypeScript
- Hand-rolled canvas particle physics (no animation libraries)
- WebAudio-synthesized keystroke sounds (no audio files)
- Tailwind (base styles) + component-scoped CSS
- Deployed on Vercel — every push to `main` auto-deploys

## Structure

```
src/
  main.tsx                entry
  App.tsx                 router (/, /cyber, 404)
  pages/                  Index (mounts PonceOS), Cyber (the news page), NotFound
  components/PonceOS.tsx  the entire experience: data, terminal, sections, styles
public/
  Marco_Ponce_Resume.pdf  served by the `resume` command
```

The whole site is intentionally one self-contained component. Previous designs
live in git history (tag `stable-before-experiments` and earlier commits) rather
than as dead code in the tree.

## Cyber Brief (`/cyber`)

A news page for cybersecurity and AI (breaches, threats, new models, trends), newest first, 20 per
page, at most 100 pages, searchable, with a page-number box in the pager.

```
Vercel edge function                       Browser
api/cyber-brief.ts (live feeds)   ->   src/pages/Cyber.tsx
                                        list, search, pager
```

- **Sources** are a fixed allowlist in `api/_lib/brief.ts`. One feed being down never breaks the
  page. Anthropic publishes no feed, so that one is a community-generated mirror and is labelled as such.
- **No scheduled jobs.** The page is built from live feeds on each request and cached at Vercel's
  edge for 10 minutes. Nothing in this repo commits or runs on a timer. An optional archive can be
  plugged in by setting `NEWS_ARCHIVE_URL` to a hosted `news.json`; `scripts/news-archive.ts` builds
  one by hand: `npx tsx scripts/news-archive.ts /tmp/news.json`.
- **Badges**: NEW MODEL (a lab announces a model), ALERT (actively exploited / breach), NEW (since your
  last visit, kept in this browser only). No visitor data is sent anywhere.
- Only titles, short excerpts and links are kept; every story links to the original.

## Development

```bash
npm install
cp .env.example .env.local   # one optional variable (admin mode)
npm run dev                  # http://localhost:5173
npm run build                # production build
```

## License

Design and content (c) Marco Ponce. Template bones from the Vite/React ecosystem (MIT).
