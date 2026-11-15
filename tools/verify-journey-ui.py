"""Regression checks for participant plan validation using real SLJ components."""
import argparse
import functools
import http.server
from pathlib import Path
import threading

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "tmp/trial-ui-fixture/dist"


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not (DIST / self.path.split("?")[0].lstrip("/")).is_file():
            self.path = "/index.html"
        super().do_GET()

    def log_message(self, *args):
        pass


parser = argparse.ArgumentParser()
parser.add_argument("--width", type=int, default=390)
parser.add_argument("--port", type=int, default=5104)
args = parser.parse_args()

server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", args.port), functools.partial(SpaHandler, directory=str(DIST))
)
threading.Thread(target=server.serve_forever, daemon=True).start()
origin = f"http://127.0.0.1:{args.port}"

try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(
            viewport={"width": args.width, "height": 900},
            locale="id-ID", reduced_motion="reduce",
        )
        page = context.new_page()
        page.set_default_timeout(7000)
        page.route("**/*", lambda route: route.continue_()
                   if route.request.url.startswith(origin) else route.abort())
        page.goto(origin + "/journey", wait_until="networkidle")
        page.get_by_role("button").filter(has_text="Hasil Muhasabah").click()
        page.get_by_role("textbox").first.fill("Menjaga kebiasaan tilawah.")
        page.get_by_role("button", name="Selanjutnya", exact=True).click()
        page.get_by_role("textbox", name="Tulis niat Anda di sini...").fill(
            "Membangun kebiasaan spiritual yang konsisten."
        )
        page.get_by_role("button", name="Selanjutnya", exact=True).click()
        page.locator('textarea[placeholder="Contoh: Konsisten sholat 5 waktu berjamaah"]:visible').fill(
            "Membaca Al-Qur'an setiap pagi selama 14 hari."
        )
        next_button = page.get_by_role("button", name="Selanjutnya", exact=True)
        expect(next_button).to_be_enabled()
        next_button.click()
        expect(page.get_by_role("alert")).to_contain_text("nama indikator")
        expect(page.get_by_role("textbox", name="Apa yang diukur?")).to_be_focused()
        print("Passed actionable feedback for incomplete transformation indicators", flush=True)

        page.get_by_role("textbox", name="Apa yang diukur?").fill("Sesi tilawah")
        next_button.click()
        expect(page.get_by_role("alert")).to_contain_text("satuan indikator")
        expect(page.get_by_role("textbox", name="Satuan", exact=True)).to_be_focused()
        page.get_by_role("textbox", name="Satuan", exact=True).fill("sesi")
        next_button.click()
        expect(page.get_by_role("alert")).to_contain_text("tidak boleh sama")
        expect(page.get_by_role("spinbutton", name="Target", exact=True)).to_be_focused()
        page.get_by_role("spinbutton", name="Target", exact=True).fill("14")

        page.get_by_role("combobox").first.select_option("quality")
        page.get_by_role("textbox", name="Apa yang diukur?").fill("Kekhusyukan salat")
        page.get_by_role("spinbutton", name="Nilai awal", exact=True).fill("1")
        page.get_by_role("spinbutton", name="Target", exact=True).fill("5")
        page.get_by_role("textbox", name="Satuan", exact=True).fill("skor")
        page.locator("summary:visible").filter(has_text="Sumber data & rubrik").click()
        page.get_by_role("textbox", name="3", exact=True).fill("Mulai khusyuk secara konsisten")

        page.evaluate("window.__failSave = true")
        next_button.click()
        expect(page.get_by_role("alert")).to_contain_text("Synthetic save failure")
        expect(page.get_by_role("textbox", name="Apa yang diukur?")).to_have_value("Kekhusyukan salat")
        page.evaluate("window.__failSave = false")
        next_button.click()
        expect(page.get_by_role("heading", name="Action Plan & Habit Engine")).to_be_visible()
        page.get_by_role("button", name="Buat Action Plan Custom Baru").click()
        page.locator('input[placeholder^="Contoh: Tahajud 4 Rakaat"]:visible').fill("Tilawah pagi")
        page.get_by_role("button", name="Simpan Action Plan", exact=True).click()
        page.get_by_role("button", name="Selesai ✓", exact=True).click()
        expect(page.get_by_role("heading", name="Rencana perubahan Selesai!")).to_be_visible()
        indicator = page.evaluate("JSON.parse(sessionStorage.getItem('db')).ptp_indicators[0]")
        assert set(indicator["quality_rubric"]) == {"1", "2", "3", "4", "5"}
        assert indicator["quality_rubric"]["3"] == "Mulai khusyuk secara konsisten"
        page.goto(origin + "/journey", wait_until="networkidle")
        page.get_by_role("button").filter(has_text="Area Transformasi").click()
        page.locator("summary:visible").filter(has_text="Sumber data & rubrik").click()
        expect(page.get_by_role("textbox", name="3", exact=True)).to_have_value("Mulai khusyuk secara konsisten")
        print("Passed validation, save failure recovery and plan completion", flush=True)

        page.goto(origin + "/baseline", wait_until="networkidle")
        notice = page.get_by_text("Latihan 14 hari berfokus pada Spiritual Growth.", exact=True)
        expect(notice).to_be_visible()
        page.get_by_role("button", name="Mulai Muhasabah", exact=True).click()
        expect(notice).to_have_count(0)
        for button in page.get_by_role("button", name="7", exact=True).all():
            button.click()
        page.get_by_role("button", name="Langkah Berikutnya", exact=True).click()
        expect(notice).to_have_count(0)

        page.goto(origin + "/journal", wait_until="networkidle")
        page.get_by_text("Panduan refleksi", exact=True).click()
        expect(page.get_by_text("Apa pelajaran terbesar yang Allah tunjukkan kepada Anda selama perjalanan ini?", exact=True)).to_be_visible()
        page.evaluate("""() => {
          const db = JSON.parse(sessionStorage.getItem('db'));
          db.profiles[0].start_date = new Date(Date.now() - 13 * 86400000).toISOString();
          sessionStorage.setItem('db', JSON.stringify(db));
        }""")
        page.reload(wait_until="networkidle")
        page.get_by_text("Panduan refleksi", exact=True).click()
        expect(page.get_by_role("heading").filter(has_text="Refleksi 14 Hari")).to_be_visible()
        expect(page.get_by_text("Apa tantangan terbesar yang dapat melemahkan komitmen Anda?", exact=True)).to_be_visible()
        expect(page.get_by_text("Bagaimana perasaan Anda hari ini?", exact=True)).to_be_visible()
        print("Passed introductory-only trial notice and journal guide perspective", flush=True)

        page.goto(origin + "/journey?scenario=program", wait_until="networkidle")
        page.get_by_role("button").filter(has_text="Area Transformasi").click()
        for area in ("Spiritual Growth", "Personal Development", "Relationship"):
            page.get_by_role("button", name="Selanjutnya", exact=True).click()
            expect(page.get_by_role("alert")).to_contain_text(area)
            expect(page.get_by_role("textbox", name="Apa yang diukur?")).to_be_focused()
            page.get_by_role("textbox", name="Apa yang diukur?").fill("Sesi latihan " + area)
            page.get_by_role("textbox", name="Satuan", exact=True).fill("sesi")
            page.get_by_role("spinbutton", name="Target", exact=True).fill("90")

        page.evaluate("() => { window.__draftHold = new Promise(resolve => { window.__releaseDraft = resolve; }); }")
        page.get_by_role("spinbutton", name="Target", exact=True).fill("80")
        page.wait_for_function("window.__draftStarted === true")
        page.get_by_role("button", name="Selanjutnya", exact=True).click()
        expect(page.get_by_role("button", name="Menyimpan…", exact=True)).to_be_disabled()
        page.evaluate("window.__releaseDraft()")
        expect(page.get_by_role("heading", name="Action Plan & Habit Engine")).to_be_visible()
        assert page.evaluate("JSON.parse(sessionStorage.getItem('db')).journeys[0].ptp_draft") is None
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        print("Passed 90-day multi-area validation and overlapping autosave/publication", flush=True)
        browser.close()
finally:
    server.shutdown()
