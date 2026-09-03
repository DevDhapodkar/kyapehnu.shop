#!/usr/bin/env python3
"""
Connect to Google Stitch (stitch.withgoogle.com) over its remote MCP endpoint and
fetch project screens — the HTML export, the PNG screenshot, and the design system.

Stdlib only. Speaks MCP (JSON-RPC 2.0 over Streamable HTTP) directly, so it needs no
npm/MCP client install. The same endpoint the Claude Code CLI uses:

    claude mcp add --transport http stitch https://stitch.googleapis.com/mcp \
        --header "X-Goog-Api-Key: <YOUR_KEY>"

Auth: set STITCH_API_KEY in the environment (generate the key in the Stitch web app).
      Never commit the key.

Usage:
    export STITCH_API_KEY="AQ.xxxxxxxx..."
    python3 fetch_screens.py --list                       # list your projects
    python3 fetch_screens.py --project <projectId>        # fetch every screen of a project
    python3 fetch_screens.py                              # defaults to DEFAULT_PROJECT below

Output (under --out, default: ./premium-light-app):
    screens/<slug>.html        # exported HTML for each screen
    screens/<slug>.png         # screenshot for each screen
    screens.json               # manifest (titles, ids, dimensions, RN targets)
    design-system.md           # the project's DESIGN.md (Ivory Studio Luxury, etc.)
    design-theme.json          # structured theme tokens

NOTE ON NETWORK EGRESS: the MCP host (stitch.googleapis.com) returns metadata plus
*signed download URLs* that point at contribution.usercontent.google.com and
lh3.googleusercontent.com. Those two hosts must be reachable to download the HTML/PNG
bytes. In locked-down egress environments (e.g. Claude Code on the web with a
restrictive network policy) they may be blocked with a 403 on CONNECT; run this script
from a machine/policy where those hosts are allowed.
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.request

ENDPOINT = "https://stitch.googleapis.com/mcp"
DEFAULT_PROJECT = "15360757500694020784"  # Kya-Pehnu "Premium Light App Design"
_id = [0]


def _key():
    k = os.environ.get("STITCH_API_KEY", "").strip()
    if not k:
        sys.exit("ERROR: set STITCH_API_KEY in the environment (create the key in the Stitch web app).")
    return k


def rpc(method, params):
    _id[0] += 1
    body = json.dumps({"jsonrpc": "2.0", "id": _id[0], "method": method, "params": params}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json, text/event-stream")
    req.add_header("X-Goog-Api-Key", _key())
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read().decode("utf-8", "replace")
        ctype = r.headers.get("content-type", "")
    if "text/event-stream" in ctype:  # unwrap SSE framing if the server streams
        for line in raw.splitlines():
            if line.startswith("data:"):
                raw = line[5:].strip()
                break
    msg = json.loads(raw)
    if "error" in msg:
        raise RuntimeError(f"MCP error on {method}: {json.dumps(msg['error'])}")
    return msg.get("result", {})


def call_tool(name, arguments=None):
    res = rpc("tools/call", {"name": name, "arguments": arguments or {}})
    if res.get("structuredContent") is not None:
        return res["structuredContent"]
    # fall back to text content blocks
    out = []
    for item in res.get("content", []):
        if item.get("type") == "text":
            out.append(item.get("text", ""))
    joined = "\n".join(out)
    try:
        return json.loads(joined)
    except Exception:
        return {"_text": joined}


def slugify(t):
    t = re.sub(r"[^a-z0-9]+", "-", (t or "").strip().lower())
    return re.sub(r"-+", "-", t).strip("-")[:60] or "screen"


def download(url, dest):
    """Download a signed URL to dest. Returns (ok, note)."""
    try:
        req = urllib.request.Request(url, headers={"X-Goog-Api-Key": _key()})
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        with open(dest, "wb") as f:
            f.write(data)
        return True, f"{len(data)} bytes"
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}"
    except Exception as e:
        # Proxy 403 CONNECT etc. surface here.
        return False, f"{type(e).__name__}: {e}"


def rn_target(title):
    t = (title or "").lower()
    table = [
        (("vendor order queue", "dispatch hub"), "customer-app/src/screens/vendor/OrderListScreen.js"),
        (("vendor order detail", "fulfillment"), "customer-app/src/screens/vendor/OrderDetailScreen.js"),
        (("catalogue manager", "inventory"), "customer-app/src/screens/vendor/CatalogManagerScreen.js"),
        (("register your shop", "vendor desk"), "customer-app/src/screens/VendorRegisterScreen.js"),
        (("storefront home",), "customer-app/src/screens/HomeScreen.js"),
        (("product detail",), "customer-app/src/screens/ProductDetailScreen.js"),
        (("your bag", "cart"), "customer-app/src/screens/CartScreen.js"),
        (("sign in", "auth"), "customer-app/src/screens/AuthScreen.js"),
        (("live tracking",), "customer-app/src/screens/LiveTrackingScreen.js"),
        (("my orders",), "customer-app/src/screens/MyOrdersScreen.js"),
        (("profile", "settings"), "customer-app/src/screens/ProfileScreen.js"),
        (("delivery address", "address"), "customer-app/src/screens/AddressScreen.js"),
        (("scrollytelling",), "customer-app/src/components/ScrollytellingSequence.js"),
    ]
    for needles, target in table:
        if any(n in t for n in needles):
            return target
    if "logo" in t:
        return "(brand asset)"
    if t.endswith(".md") or "designbrief" in t:
        return "(design brief document)"
    if any(w in t for w in ("cinematic", "editorial portrait", ".jpg", "photorealistic", "aerial")):
        return "(AI image / background asset)"
    return "(unmapped — reference)"


def list_projects():
    data = call_tool("list_projects", {})
    projs = data.get("projects", []) if isinstance(data, dict) else []
    for p in projs:
        pid = p.get("name", "").split("/")[-1]
        dmd = p.get("designTheme", {}).get("designMd", "")
        ds = ""
        for line in dmd.splitlines():
            if line.strip().startswith("name:"):
                ds = line.split("name:", 1)[1].strip()
                break
        print(f"{pid:24}  {p.get('title','(untitled)')!r}  theme={ds!r}  created={p.get('createTime','')[:10]}")
    return projs


def fetch_project(pid, out_dir):
    os.makedirs(os.path.join(out_dir, "screens"), exist_ok=True)

    # Design system, from list_projects (returned inline).
    proj = None
    for p in call_tool("list_projects", {}).get("projects", []):
        if p.get("name", "").endswith(pid):
            proj = p
            break
    design_name = None
    if proj:
        theme = proj.get("designTheme", {})
        dmd = theme.get("designMd", "").strip()
        if dmd:
            with open(os.path.join(out_dir, "design-system.md"), "w") as f:
                f.write(dmd + "\n")
            if "name:" in dmd:
                design_name = dmd.split("name:", 1)[1].splitlines()[0].strip()
        with open(os.path.join(out_dir, "design-theme.json"), "w") as f:
            json.dump({k: v for k, v in theme.items() if k != "designMd"}, f, indent=2, ensure_ascii=False)

    screens = call_tool("list_screens", {"projectId": pid}).get("screens", [])
    manifest = {
        "project": {
            "title": (proj or {}).get("title"),
            "projectId": pid,
            "name": (proj or {}).get("name"),
            "deviceType": (proj or {}).get("deviceType"),
            "createTime": (proj or {}).get("createTime"),
            "updateTime": (proj or {}).get("updateTime"),
            "designSystemName": design_name,
        },
        "screenCount": len(screens),
        "screens": [],
    }
    ok_html = ok_png = 0
    for s in screens:
        title = s.get("title", "")
        slug = slugify(title)
        entry = {
            "title": title,
            "screenId": s.get("name", "").split("/")[-1],
            "name": s.get("name"),
            "deviceType": s.get("deviceType"),
            "width": s.get("width"),
            "height": s.get("height"),
            "slug": slug,
            "htmlFileName": (s.get("htmlCode") or {}).get("name"),
            "screenshotFileName": (s.get("screenshot") or {}).get("name"),
            "htmlMimeType": (s.get("htmlCode") or {}).get("mimeType"),
            "rnTarget": rn_target(title),
        }
        html_url = (s.get("htmlCode") or {}).get("downloadUrl")
        png_url = (s.get("screenshot") or {}).get("downloadUrl")
        if html_url:
            ok, note = download(html_url, os.path.join(out_dir, "screens", f"{slug}.html"))
            entry["htmlDownload"] = note
            ok_html += ok
        if png_url:
            ok, note = download(png_url, os.path.join(out_dir, "screens", f"{slug}.png"))
            entry["screenshotDownload"] = note
            ok_png += ok
        manifest["screens"].append(entry)
        print(f"  {title[:50]:50}  html={entry.get('htmlDownload','-'):>12}  png={entry.get('screenshotDownload','-')}")

    manifest["screens"].sort(key=lambda x: (x["deviceType"] is None, x["title"].lower()))
    with open(os.path.join(out_dir, "screens.json"), "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\n{len(screens)} screens | HTML downloaded: {ok_html} | PNG downloaded: {ok_png} | out: {out_dir}")
    if ok_html == 0 and screens:
        print("NOTE: 0 files downloaded — the usercontent.google.com / lh3.googleusercontent.com hosts are "
              "likely blocked by your network egress policy. Re-run where those hosts are allowed.")


def main():
    ap = argparse.ArgumentParser(description="Fetch Google Stitch screens via MCP.")
    ap.add_argument("--list", action="store_true", help="list projects and exit")
    ap.add_argument("--project", default=DEFAULT_PROJECT, help="project id to fetch")
    ap.add_argument("--out", default=None, help="output dir (default: ./<slug of project>)")
    args = ap.parse_args()
    if args.list:
        list_projects()
        return
    out = args.out or os.path.join(os.path.dirname(os.path.abspath(__file__)), "premium-light-app")
    fetch_project(args.project, out)


if __name__ == "__main__":
    main()
