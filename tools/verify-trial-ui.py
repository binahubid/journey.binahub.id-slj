"""Isolated browser checks using actual SLJ components and synthetic provider data."""
import argparse
import functools
import http.server
import json
from pathlib import Path
import re
import threading
from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "tmp/trial-ui-fixture/dist"
OUTPUT = ROOT / "tmp/slj-ui-evidence"
OUTPUT.mkdir(parents=True, exist_ok=True)

class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        pathname = self.path.split("?")[0]
        target = DIST / pathname.lstrip("/")
        if not target.is_file():
            self.path = "/index.html"
        super().do_GET()
    def log_message(self, *args):
        pass

parser = argparse.ArgumentParser()
parser.add_argument("--serve-only", action="store_true")
parser.add_argument("--port", type=int, default=5093)
args = parser.parse_args()
server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), functools.partial(SpaHandler, directory=str(DIST)))
if args.serve_only:
    print(f"SLJ isolated UI fixture: http://127.0.0.1:{args.port}", flush=True)
    server.serve_forever()
    raise SystemExit()
threading.Thread(target=server.serve_forever, daemon=True).start()
origin = f"http://127.0.0.1:{args.port}"
results = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="chrome", headless=True)
    try:
        for width in (320, 390, 768, 1366):
            context = browser.new_context(viewport={"width": width, "height": 900}, locale="id-ID", reduced_motion="reduce")
            page = context.new_page()
            errors, external = [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            def handle(route):
                url = route.request.url
                if url.startswith(origin):
                    route.continue_()
                elif url.startswith("https://api.aladhan.com/"):
                    assert "country=Saudi+Arabia" in url
                    route.fulfill(json={"data":{"timings":{"Fajr":"05:11","Dhuhr":"12:05","Asr":"15:17","Maghrib":"17:39","Isha":"19:09"}}})
                else:
                    external.append(url)
                    route.abort()
            page.route("**/*", handle)
            def visit(path):
                page.goto(origin + path)
                page.wait_for_load_state("networkidle")
            def no_overflow():
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"Overflow at {width}: {page.url}"
            visit("/trial")
            page.get_by_role("heading", name="Ruang ibadah hari ini").wait_for()
            (OUTPUT / f"controls-{width}.json").write_text(json.dumps(page.get_by_role("button").all_text_contents(), ensure_ascii=False), encoding="utf-8")
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"trial-{width}.png"), full_page=True)
            subuh = page.get_by_role("button", name=re.compile(r"^Subuh, "))
            assert subuh.get_attribute("aria-pressed") == "false"
            subuh.click()
            page.wait_for_function("document.querySelector('button[aria-label^=\"Subuh, \"]').getAttribute('aria-pressed') === 'true' && !document.querySelector('button[aria-label^=\"Subuh, \"]').disabled")
            page.reload()
            page.wait_for_load_state("networkidle")
            assert subuh.get_attribute("aria-pressed") == "true"
            page.evaluate("window.__failSave = true")
            subuh.click()
            page.get_by_role("alert").filter(has_text="Perubahan belum tersimpan").wait_for()
            assert subuh.get_attribute("aria-pressed") == "true"
            page.evaluate("window.__failSave = false")
            sunnah = page.get_by_role("button", name="Kelola salat sunnah")
            sunnah.click()
            dialog = page.get_by_role("dialog")
            dialog.wait_for()
            page.screenshot(path=str(OUTPUT / f"dialog-{width}.png"))
            for _ in range(15):
                page.keyboard.press("Tab")
                assert dialog.evaluate("(element) => element.contains(document.activeElement)"), "Focus escaped the dialog"
            page.keyboard.press("Escape")
            assert not dialog.is_visible()
            expect(sunnah).to_be_focused()
            page.get_by_role("button", name="Al-Qur’an", exact=True).click()
            page.get_by_role("button", name="Catat Bacaan", exact=True).click()
            page.get_by_label("Nama surah", exact=True).fill("Al-Fatihah")
            page.get_by_label("Dari ayat", exact=True).fill("1")
            page.get_by_label("Sampai ayat", exact=True).fill("7")
            page.get_by_role("button", name="Simpan Bacaan", exact=True).click()
            page.get_by_label("Riwayat bacaan Al-Qur’an").get_by_text("Al-Fatihah", exact=True).wait_for()
            page.get_by_role("button", name="Hadits", exact=True).click()
            mark = page.get_by_role("button", name="Tandai dibaca", exact=True)
            mark.click()
            page.get_by_role("button", name="Sudah dibaca", exact=True).wait_for()
            page.get_by_role("button", name="Refleksi", exact=True).click()
            page.get_by_role("link", name="Buka jurnal refleksi", exact=True).click()
            page.get_by_role("heading", name="Refleksi Hari Ini", exact=True).wait_for()
            page.get_by_text("Waktu Saudi", exact=True).wait_for()
            page.get_by_role("textbox", name="Refleksi hari ini", exact=True).fill("Refleksi peserta demo")
            page.get_by_role("textbox", name="Rencana perbaikan besok", exact=True).fill("Rencana peserta demo")
            page.get_by_role("button", name="Simpan Refleksi Hari Ini", exact=True).click()
            page.get_by_role("button", name=re.compile(r"Refleksi peserta demo")).wait_for()
            page.reload()
            page.get_by_role("button", name=re.compile(r"Refleksi peserta demo")).click()
            page.get_by_role("dialog").get_by_text("Rencana peserta demo", exact=True).wait_for()
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"journal-{width}.png"))
            visit("/trial")
            page.get_by_role("button", name="Pengembangan diri", exact=False).click()
            page.get_by_role("dialog").get_by_role("heading", name="Pengembangan diri").wait_for()
            page.keyboard.press("Escape")
            no_overflow()
            if width < 1024:
                opener = page.get_by_role("button", name="Buka menu peserta")
                opener.click()
                page.get_by_role("dialog").wait_for()
                page.keyboard.press("Escape")
                expect(opener).to_be_focused()
            page.evaluate("sessionStorage.clear()")
            visit("/trial?scenario=expired")
            page.get_by_role("heading", name="Langkah kecil Anda berarti.").wait_for()
            assert page.get_by_role("button", name=re.compile(r"^Subuh, ")).count() == 0
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"expired-{width}.png"), full_page=True)
            page.evaluate("sessionStorage.clear()")
            visit("/onboarding?scenario=none")
            page.get_by_label("Nama lengkap", exact=True).wait_for()
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"onboarding-{width}.png"), full_page=True)
            assert page.get_by_label("Nama lengkap", exact=True).evaluate("(element) => parseFloat(getComputedStyle(element).fontSize)") >= 16 if width < 640 else True
            page.get_by_label("Nama lengkap", exact=True).fill("Peserta Demo")
            page.get_by_label("Kota untuk jadwal salat").fill("Madinah")
            page.get_by_role("button", name="Mulai 14 hari gratis", exact=True).click()
            page.wait_for_url("**/trial")
            page.get_by_role("heading", name="Ruang ibadah hari ini").wait_for()
            visit("/admin/trials")
            page.get_by_role("heading", name="Uji coba spiritual", exact=True).wait_for()
            page.get_by_text("Peserta yang masa trialnya berakhir", exact=True).wait_for()
            no_overflow()
            page.get_by_label("Buka pendaftaran uji coba", exact=True).uncheck()
            page.get_by_role("button", name="Simpan pengaturan").click()
            page.get_by_role("status").get_by_text("Pengaturan tersimpan.").wait_for()
            page.get_by_text("Ditutup", exact=True).wait_for()
            page.screenshot(path=str(OUTPUT / f"admin-trials-{width}.png"), full_page=True)
            visit("/")
            page.get_by_text("Pendaftaran peserta baru sedang ditutup.", exact=True).wait_for()
            assert page.get_by_role("link", name="Coba 14 hari gratis", exact=True).count() == 0
            page.evaluate("sessionStorage.removeItem('access')")
            visit("/onboarding?scenario=none")
            page.get_by_text("Pendaftaran uji coba sedang ditutup.", exact=False).wait_for()
            assert page.get_by_role("button", name="Mulai 14 hari gratis", exact=True).count() == 0
            visit("/panduan")
            page.get_by_role("heading", name="Siapkan agar nyaman dipakai setiap hari").wait_for()
            no_overflow()
            visit("/pricing")
            page.get_by_role("heading", name="Mulai dengan satu langkah baik.").wait_for()
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"pricing-{width}.png"), full_page=True)
            assert not errors, errors
            assert not external, external
            results.append({"width": width, "passed": True, "checks": ["persistence","failed-save rollback","focus trap","Escape","focus restoration","Quran save","hadith save","journal save in Saudi timezone","locked preview","expiry","activation","admin settings","closed enrollment","guide","pricing","no overflow"]})
            context.close()
    finally:
        browser.close()
        server.shutdown()
(OUTPUT / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps({"passed": len(results), "widths": [item["width"] for item in results], "evidence": str(OUTPUT)}))
