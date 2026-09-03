# Stitch design source

UI screens for Kya-Pehnu, designed in **Google Stitch** (stitch.withgoogle.com) and
pulled into the repo through Stitch's remote **MCP** endpoint. This folder is the
design source of truth that the React Native screens in `customer-app/` are built to
match.

## Contents

- **`fetch_screens.py`** — reusable fetcher. Connects to Stitch over MCP
  (JSON-RPC over HTTP, stdlib only), lists projects, and downloads each screen's
  exported HTML + PNG screenshot plus the design system.
- **`premium-light-app/`** — the fetched project **"Premium Light App Design"**
  (project `15360757500694020784`, design system *Ivory Studio Luxury*):
  - `SCREENS.md` — index of all 23 screens, mapped to the RN source they drive.
  - `design-system.md` — the project's DESIGN.md (color tokens, fonts, tone).
  - `design-theme.json` — structured theme tokens.
  - `screens.json` — full manifest (screen ids, dimensions, RN targets).
  - `screens/*.html`, `screens/*.png` — per-screen exports (see egress note below).

## How to (re)fetch

The Stitch server is added to Claude Code as an MCP server:

```bash
claude mcp add --transport http stitch https://stitch.googleapis.com/mcp \
    --header "X-Goog-Api-Key: <YOUR_KEY>"
```

To pull screens with the script (no MCP client needed):

```bash
export STITCH_API_KEY="<YOUR_KEY>"          # create the key in the Stitch web app
python3 design/stitch/fetch_screens.py --list                # list your projects
python3 design/stitch/fetch_screens.py --project 15360757500694020784
```

**Never commit the API key.** It is read from `STITCH_API_KEY` at runtime and lives
only in local MCP config, not in this repo.

## Network egress note

`list_projects` / `list_screens` return metadata and the full design system inline
from `stitch.googleapis.com` (allowed). The **HTML and PNG bytes**, however, are served
from `contribution.usercontent.google.com` and `lh3.googleusercontent.com` via signed
download URLs. Those two hosts must be reachable to populate `screens/`. Under a
restrictive network policy (e.g. some Claude Code on the web environments) they are
blocked with a `403` on CONNECT — in that case run `fetch_screens.py` from a machine or
policy where those hosts are allowed, or add them to the egress allowlist.
