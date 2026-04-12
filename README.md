# Market Report Viewer

Static site for browsing daily market reports generated in the OpenClaw workspace.

## Local export

```bash
python3 /home/node/.openclaw/workspace/scripts/export_market_report_site.py
```

Then preview locally:

```bash
cd /home/node/.openclaw/workspace/sites/market-report-viewer
python3 -m http.server 8000
```

Open `http://127.0.0.1:8000`.

## Publish to GitHub Pages

Recommended: keep this folder as its own clean git repo and publish as a dedicated GitHub Pages site.
