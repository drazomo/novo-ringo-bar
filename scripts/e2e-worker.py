#!/usr/bin/env python3
"""End-to-end panel test against wrangler dev (workerd) + GitHub storage on the engine repo's panel-test branch."""
import json, re, time, urllib.request, urllib.error, http.cookiejar, os
B = "http://127.0.0.1:8787"
LOG = os.path.expandvars("$HERMES_HOME/cache/scratch/wrangler-dev.log")
cj = http.cookiejar.CookieJar()
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), NoRedirect)
res = []
def req(method, path, body=None, origin=True):
    h = {"Content-Type": "application/json"}
    if origin: h["Origin"] = B
    r = urllib.request.Request(B + path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    try:
        with op.open(r, timeout=60) as f: return f.status, f.read().decode("utf-8","replace"), dict(f.headers)
    except urllib.error.HTTPError as e: return e.code, e.read().decode("utf-8","replace"), dict(e.headers)
def check(name, ok, info: object = ""):
    res.append((name, ok)); print(("PASS " if ok else "FAIL ") + name + (f"  [{info}]" if info and not ok else ""))

for p, want in [("/", 200), ("/carta", 200), ("/en/menu", 200), ("/panel", 200), ("/panel/qr", 200), ("/panel/qr-carta.png", 200), ("/llms.txt", 200), ("/robots.txt", 200), ("/sitemap-index.xml", 200), ("/no-such-page", 404), ("/hacer-pedido", 301)]:
    s, b, h = req("GET", p, origin=False); check(f"GET {p} -> {want}", s == want, s)
s, b, _ = req("GET", "/api/panel/data", origin=False); check("data without login -> 401", s == 401, s)
s, b, _ = req("POST", "/api/panel/login", {"email": "x@y.com"}, origin=False); check("POST without Origin -> 403 (CSRF)", s == 403, s)
s, b, _ = req("POST", "/api/panel/login", {"email": "stranger@example.com"}); check("unknown email -> same ok answer", s == 200 and '"ok":true' in b, b)
open(LOG).read()
before = open(LOG).read().count("Login link for")
s, b, _ = req("POST", "/api/panel/login", {"email": "mark@thebrandinghouseusa.com"}); check("allowed email -> ok", s == 200, b)
time.sleep(1)
links = re.findall(r"(http://127\.0\.0\.1:8787/api/panel/auth\?t=[A-Za-z0-9_.\-]+)", open(LOG).read())
check("login link issued (dev console)", len(links) >= 1)
s, b, h = req("GET", links[-1].replace(B, ""), origin=False); check("auth link -> 302 + session cookie", s == 302 and any(c.name == "tbh_panel" for c in cj), s)
s, b, _ = req("GET", "/api/panel/data", origin=False)
d = json.loads(b) if s == 200 else {}
check("data via GitHub storage", s == 200 and d.get("storage") == "github" and len(d.get("menu", {}).get("items", [])) > 10, b[:200])
s, b, _ = req("POST", "/api/panel/closure", {"from": "2031-01-01", "to": "2031-01-02", "reason": "otro", "msg_es": "Prueba del motor TBH (se deshace)", "msg_en": "Engine test"})
d = json.loads(b) if b.startswith("{") else {}
check("save closure -> GitHub commit", s == 200 and d.get("ok") and len(d.get("commit", "")) == 40, b[:200])
cid = d.get("changes", [{}])[0].get("id")
s, b, _ = req("POST", "/api/panel/undo", {"id": cid}); d2 = json.loads(b) if b.startswith("{") else {}
check("undo -> second commit, closure gone", s == 200 and d2.get("ok") and not any(c.get("msg_es", "").startswith("Prueba del motor") for c in d2.get("closures", [])), b[:200])
s, b, _ = req("POST", "/api/panel/closure", {"from": "2020-01-01", "to": "2020-01-02", "msg_es": "x"}); check("invalid edit -> 400 with message", s == 400 and "error" in b, b)
s, b, _ = req("POST", "/api/panel/logout", {}); s2, _, _ = req("GET", "/api/panel/data", origin=False); check("logout -> 401 after", s == 200 and s2 == 401, (s, s2))
print(f"\n{sum(ok for _, ok in res)}/{len(res)} passed")
