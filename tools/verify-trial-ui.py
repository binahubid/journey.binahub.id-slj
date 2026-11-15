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
                    candidate = (ROOT / "public" / url.removeprefix(origin + "/").split("?")[0]).resolve()
                    if candidate.is_relative_to((ROOT / "public").resolve()) and candidate.is_file():
                        route.fulfill(path=str(candidate))
                    else:
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
            def widget(label):
                if width < 1024:
                    page.get_by_role("group", name="Pilih aktivitas").get_by_role("button", name=label, exact=True).click()
            def habit_details():
                detail = page.get_by_role("button", name="Lihat Detail Habit", exact=True)
                # Swipe the target above the fixed mobile dock before testing a real hit.
                detail.evaluate("element => element.scrollIntoView({block:'center',behavior:'instant'})")
                detail.click()
            def quran_action_fits():
                panel = page.locator("#dashboard-quran").bounding_box()
                action = page.get_by_role("button", name="Catat Bacaan", exact=True).bounding_box()
                assert action["x"] >= panel["x"] and action["x"] + action["width"] <= panel["x"] + panel["width"]
            visit("/trial")
            page.get_by_test_id("adaptive-journey-hero").wait_for()
            hero = page.get_by_test_id("adaptive-journey-hero")
            expect(hero.get_by_text("0/4", exact=True)).to_be_visible()
            (OUTPUT / f"controls-{width}.json").write_text(json.dumps(page.get_by_role("button").all_text_contents(), ensure_ascii=False), encoding="utf-8")
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"trial-{width}.png"), full_page=True)
            if width < 1024:
                shortcuts = page.get_by_role("group", name="Pilih aktivitas")
                expect(shortcuts.get_by_role("button")).to_have_count(6)
                if width == 390:
                    page.emulate_media(reduced_motion="no-preference")
                    habit = shortcuts.get_by_role("button", name="Habit", exact=True)
                    habit.evaluate("""button => {
                        const dock = document.querySelector('nav[aria-label="Navigasi utama"]');
                        window.scrollBy({top: button.getBoundingClientRect().bottom - dock.getBoundingClientRect().top + 12, behavior: "instant"});
                        window.__habitTransition = false;
                        document.addEventListener("transitionrun", event => {
                            if (event.target.id === "dashboard-habits" && event.propertyName === "opacity") window.__habitTransition = true;
                        });
                    }""")
                    assert page.locator("#dashboard-content").bounding_box()["y"] >= page.get_by_role("navigation", name="Navigasi utama").bounding_box()["y"]
                    habit.click()
                    page.wait_for_function("""() => {
                        const panel = document.getElementById("dashboard-habits").getBoundingClientRect();
                        const dock = document.querySelector('nav[aria-label="Navigasi utama"]').getBoundingClientRect();
                        return window.__habitTransition && panel.top >= 64 && panel.top + 100 < dock.top;
                    }""")
                    expect(habit).to_have_attribute("aria-pressed", "true")
                    page.screenshot(path=str(OUTPUT / "widget-reveal-390.png"))
                    page.get_by_role("button", name="Ganti aktivitas", exact=True).click()
                    page.wait_for_function("""() => {
                        const panel = document.getElementById("dashboard-shortcuts").getBoundingClientRect();
                        return panel.top >= 64 && panel.bottom < innerHeight - 64;
                    }""")
                    page.emulate_media(reduced_motion="reduce")
                    hadith = shortcuts.get_by_role("button", name="Hadits", exact=True)
                    hadith.focus()
                    hadith.press("Enter")
                    expect(page.locator("#dashboard-hadith")).to_be_focused()

                for label, key in (("Habit", "habits"), ("Hadits", "hadith"), ("Tilawah", "quran"), ("Jurnal", "journal"), ("Analitik", "analytics"), ("Jadwal salat", "prayer")):
                    widget(label)
                    expect(page.locator(f"#dashboard-{key}")).to_be_visible()
                    expect(shortcuts.get_by_role("button", name=label, exact=True)).to_have_attribute("aria-pressed", "true")
                    assert page.locator('#dashboard-content section[tabindex="-1"]:visible').count() == 1
                    no_overflow()
                assert page.evaluate("""async () => (await Promise.all(['prayer','habits','hadith','quran','journal','analytics'].map(key => new Promise(resolve => {const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src='/icons/dashboard/'+key+'.webp';})))).every(Boolean)""")
            subuh = page.get_by_role("button", name=re.compile(r"^Subuh, ")).last
            assert subuh.get_attribute("aria-pressed") == "false"
            subuh.click()
            expect(subuh).to_have_attribute("aria-pressed", "true")
            expect(subuh).to_be_enabled()
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
            widget("Tilawah")
            quran_action_fits()
            page.get_by_role("button", name="Catat Bacaan", exact=True).click()
            page.get_by_label("Nama surah", exact=True).fill("Al-Fatihah")
            page.get_by_label("Dari ayat", exact=True).fill("1")
            page.get_by_label("Sampai ayat", exact=True).fill("7")
            page.get_by_role("button", name="Simpan Bacaan", exact=True).click()
            page.get_by_label("Riwayat bacaan Al-Qur’an").get_by_text("Al-Fatihah", exact=True).wait_for()
            quran_action_fits()
            expect(hero.get_by_text("1/4", exact=True)).to_be_visible()
            widget("Hadits")
            mark = page.get_by_role("button", name="Tandai dibaca", exact=True)
            mark.click()
            page.get_by_role("button", name="Sudah dibaca", exact=True).wait_for()
            expect(hero.get_by_text("2/4", exact=True)).to_be_visible()
            visit("/journal")
            page.get_by_role("heading", name="Refleksi Hari Ini", exact=True).wait_for()
            page.get_by_text("Waktu Saudi", exact=True).wait_for()
            page.get_by_role("textbox", name="Refleksi hari ini", exact=True).fill("Refleksi peserta demo")
            if width < 1024:
                views = page.get_by_role("group", name="Tampilan jurnal")
                views.get_by_role("button", name=re.compile(r"^Riwayat")).click()
                expect(page.get_by_role("textbox", name="Refleksi hari ini", exact=True)).to_be_hidden()
                views.get_by_role("button", name="Menulis", exact=True).click()
                expect(page.get_by_role("textbox", name="Refleksi hari ini", exact=True)).to_have_value("Refleksi peserta demo")
            page.get_by_text("Lengkapi refleksi", exact=False).click()
            page.get_by_role("textbox", name="Rencana perbaikan besok", exact=True).fill("Rencana peserta demo")
            page.get_by_role("button", name="Simpan Refleksi Hari Ini", exact=True).click()
            expect(page.get_by_role("status").filter(has_text="Refleksi hari ini tersimpan.")).to_be_visible()
            if width < 1024:
                views.get_by_role("button", name=re.compile(r"^Riwayat")).click()
            favorite = page.get_by_role("button", name=re.compile(r"^Tandai favorit"))
            favorite.click()
            expect(page.get_by_role("button", name=re.compile(r"^Hapus favorit"))).to_have_attribute("aria-pressed", "true")
            search = page.get_by_role("searchbox", name="Cari catatan jurnal", exact=True)
            search.fill("tidak ada teks ini")
            expect(page.get_by_text("Tidak ada catatan yang sesuai.", exact=True)).to_be_visible()
            search.fill("Rencana peserta demo")
            expect(page.get_by_role("button", name=re.compile(r"Refleksi peserta demo"))).to_be_visible()
            page.reload()
            expect(page.get_by_role("button", name=re.compile(r"^Hapus favorit"))).to_be_visible()
            page.get_by_role("button", name=re.compile(r"Refleksi peserta demo")).click()
            page.get_by_role("dialog").get_by_text("Rencana peserta demo", exact=True).wait_for()
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"journal-{width}.png"))
            visit("/trial")
            expect(hero.get_by_text("3/4", exact=True)).to_be_visible()
            for prayer in ("Zuhur", "Asar", "Magrib", "Isya"):
                button = page.get_by_role("button", name=re.compile("^" + prayer + ", ")).last
                button.click()
                expect(button).to_be_enabled()
            expect(hero.get_by_text("4/4", exact=True)).to_be_visible()
            hero.get_by_role("button", name="Lihat aktivitas harian", exact=True).click()
            expect(page.get_by_role("dialog").get_by_text("Tercatat", exact=True)).to_have_count(4)
            page.keyboard.press("Escape")
            page.reload(wait_until="networkidle")
            expect(hero.get_by_text("4/4", exact=True)).to_be_visible()
            expand = page.get_by_role("button", name="Lihat ringkasan catatan salat")
            count = page.get_by_text("Hari ini 5 / 5", exact=True)
            assert count.count() == 1, page.locator("#dashboard-prayer").inner_text()
            expand_box, count_box = expand.bounding_box(), count.bounding_box()
            assert expand_box["width"] >= 44 and expand_box["height"] >= 44
            assert expand_box["x"] >= count_box["x"] + count_box["width"]
            expand.click()
            page.get_by_role("dialog").wait_for()
            page.keyboard.press("Escape")
            widget("Analitik")
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
            # Trial habit details must show the actual PTP habit, not the spiritual summary.
            page.evaluate("""() => {const db=JSON.parse(sessionStorage.getItem('db'));db.habits=[{id:'trial-habit',user_id:db.profiles[0].user_id,title:'Refleksi pagi',frequency:'daily',frequency_kind:'daily',quantity:1,target:1,area_category:'Spiritual Growth',effective_from:new Date(Date.now()-86400000).toISOString().slice(0,10)}];sessionStorage.setItem('db',JSON.stringify(db));}""")
            visit("/trial?widget=habits")
            habit_details()
            expect(page.get_by_role("dialog").get_by_role("heading", name="Detail habit PTP", exact=True)).to_be_visible()
            expect(page.get_by_role("dialog").get_by_role("button", name="Refleksi pagi", exact=True)).to_be_visible()
            expect(page.get_by_role("dialog").get_by_text("Aktivitas spiritual hari ini", exact=True)).to_have_count(0)
            page.keyboard.press("Escape")
            visit("/settings")
            page.get_by_role("tab", name="Notifikasi & Lokasi", exact=True).click()
            expect(page.get_by_role("checkbox", name="Pengingat habit harian")).to_be_visible()
            expect(page.get_by_role("checkbox", name="Pengingat evaluasi program")).to_be_visible()
            expect(page.get_by_text("Evaluasi Pekanan", exact=True)).to_be_visible()
            expect(page.get_by_role("checkbox", name="Notifikasi pendamping")).to_have_count(0)
            no_overflow()
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
            page.get_by_test_id("adaptive-journey-hero").wait_for()
            visit("/admin/trials")
            page.get_by_role("heading", name="Uji coba spiritual", exact=True).wait_for()
            page.get_by_text("Peserta yang masa trialnya berakhir", exact=True).wait_for()
            no_overflow()
            expect(page.get_by_text("1–20 dari 23 peserta", exact=True)).to_be_visible()
            page.screenshot(path=str(OUTPUT / f"admin-trials-{width}.png"), full_page=False)
            if width in (390, 1366):
                page.get_by_role("button", name="Berikutnya", exact=True).click()
                expect(page.get_by_text("21–23 dari 23 peserta", exact=True)).to_be_visible()
                expect(page.get_by_text("Peserta Contoh 21", exact=True)).to_be_visible()
                page.get_by_label("Cari nama peserta").fill("Peserta Demo")
                page.get_by_role("button", name="Cari", exact=True).click()
                expect(page.get_by_text("1–1 dari 1 peserta", exact=True)).to_be_visible()
                page.get_by_role("button", name="Lihat progres Peserta Demo", exact=True).click()
                dialog = page.get_by_role("dialog")
                expect(dialog.get_by_text("Aktivitas terakhir", exact=True)).to_be_visible()
                dialog.get_by_role("button", name="Jeda akses", exact=True).click()
                expect(dialog.get_by_role("button", name="Konfirmasi jeda akses")).to_be_disabled()
                dialog.get_by_label("Alasan tindakan").fill("Pemeriksaan akses akun")
                page.screenshot(path=str(OUTPUT / f"admin-trials-pause-{width}.png"))
                dialog.get_by_role("button", name="Konfirmasi jeda akses").click()
                expect(dialog.get_by_text("Akses uji coba dijeda.", exact=True)).to_be_visible()
                expect(dialog.get_by_text("Pemeriksaan akses akun", exact=True)).to_be_visible()
                dialog.get_by_role("button", name="Tutup dialog", exact=True).click()
                page.get_by_label("Status akses").select_option("paused")
                expect(page.get_by_role("button", name="Lihat progres Peserta Demo", exact=True)).to_be_visible()
                visit("/trial")
                expect(page.get_by_role("heading", name="Akses uji coba dijeda")).to_be_visible()
                expect(page.get_by_role("link", name="Lihat hasil uji coba", exact=True)).to_be_visible()
                expect(page.get_by_text("Pemeriksaan akses akun", exact=True)).to_have_count(0)
                no_overflow()
                page.screenshot(path=str(OUTPUT / f"trial-paused-{width}.png"))
                visit("/admin/trials")
                page.get_by_role("button", name="Lihat progres Peserta Demo", exact=True).click()
                dialog = page.get_by_role("dialog")
                dialog.get_by_role("button", name="Pulihkan akses", exact=True).click()
                dialog.get_by_label("Alasan tindakan").fill("Pemeriksaan selesai")
                dialog.get_by_role("button", name="Konfirmasi pulihkan akses").click()
                expect(dialog.get_by_text("Akses uji coba dipulihkan.", exact=True)).to_be_visible()
                expect(dialog.get_by_text("Pemeriksaan selesai", exact=True)).to_be_visible()
                visit("/trial")
                page.get_by_test_id("adaptive-journey-hero").wait_for()
                visit("/admin/trials")
            page.get_by_text("Pendaftaran peserta baru", exact=True).click()

            page.get_by_label("Buka pendaftaran uji coba", exact=True).uncheck()
            page.get_by_role("button", name="Simpan pengaturan").click()
            page.get_by_role("status").get_by_text("Pengaturan tersimpan.").wait_for()
            page.get_by_text("Ditutup", exact=True).wait_for()
            page.screenshot(path=str(OUTPUT / f"admin-trials-registration-{width}.png"), full_page=False)
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
            page.evaluate("sessionStorage.clear()")
            visit("/dashboard?scenario=program&widget=habits")
            page.get_by_test_id("adaptive-journey-hero").wait_for()
            expect(page.locator("#dashboard-habits")).to_be_visible()
            habit_details()
            expect(page.get_by_role("dialog").get_by_role("heading", name="Detail habit PTP", exact=True)).to_be_visible()
            expect(page.get_by_role("dialog").get_by_role("button", name="Menyusun prioritas", exact=True)).to_be_visible()
            page.keyboard.press("Escape")
            widget("Analitik")
            expect(page.locator("#dashboard-analytics")).to_be_visible()
            page.reload(wait_until="networkidle")
            expect(page.locator("#dashboard-analytics")).to_be_visible()
            if width >= 1024:
                assert page.locator('#dashboard-content section[tabindex="-1"]:visible').count() == 6
            no_overflow()
            page.screenshot(path=str(OUTPUT / f"program-{width}.png"), full_page=True)
            page.evaluate("""() => {const db=JSON.parse(sessionStorage.getItem('db'));db.notifications=[1,2].map(i=>({id:'notification-'+i,user_id:db.profiles[0].user_id,title:'Pengingat demo '+i,message:'Periksa latihan harian Anda.',category:'reminder',is_read:false,created_at:new Date().toISOString()}));sessionStorage.setItem('db',JSON.stringify(db));}""")
            visit("/notifications")
            expect(page.get_by_role("link", name="Notifikasi, 2 belum dibaca", exact=True)).to_be_visible()
            page.get_by_role("button").filter(has_text="Pengingat demo 1").click()
            expect(page.get_by_role("link", name="Notifikasi, 1 belum dibaca", exact=True)).to_be_visible()
            page.evaluate("window.__failSave=true")
            page.get_by_role("button", name="Tandai dibaca", exact=True).click()
            expect(page.get_by_role("alert")).to_contain_text("belum berhasil ditandai")
            expect(page.get_by_role("link", name="Notifikasi, 1 belum dibaca", exact=True)).to_be_visible()
            page.evaluate("window.__failSave=false")
            page.get_by_role("button", name="Tandai dibaca", exact=True).click()
            expect(page.get_by_role("link", name="Notifikasi", exact=True)).to_be_visible()
            page.reload(wait_until="networkidle")
            expect(page.get_by_role("link", name="Notifikasi", exact=True)).to_be_visible()
            no_overflow()
            if width == 390:
                page.add_init_script("window.__sljReadDelay = 280;")
                nav = page.get_by_role("navigation", name="Navigasi utama")
                for label, status_text in (
                    ("Rencana", "Memuat rencana perubahan"),
                    ("Jurnal", "Memuat jurnal refleksi"),
                    ("Profil", "Memuat profil"),
                    ("Beranda", "Memuat beranda"),
                    ("Progres", "Memuat progres dan evaluasi"),
                ):
                    nav.get_by_role("link", name=label, exact=True).click()
                    loader = page.get_by_role("status").filter(has_text=status_text)
                    expect(loader).to_be_visible()
                    expect(nav.get_by_role("link", name=label, exact=True)).to_have_attribute("aria-current", "page")
                    if label == "Progres":
                        page.screenshot(path=str(OUTPUT / "skeleton-progres-390.png"))
                    expect(loader).to_be_hidden(timeout=20000)

                progress_views = page.get_by_role("group", name="Tampilan progres")
                periods = page.get_by_role("group", name="Periode evaluasi")
                expect(periods.get_by_role("button", name="Bulan 2", exact=True)).to_have_attribute("aria-pressed", "true")
                chart = page.get_by_role("img", name="Grafik persentase pelaksanaan habit per area")
                expect(chart).to_be_visible()
                page.screenshot(path=str(OUTPUT / "progres-390.png"), full_page=True)
                progress_views.get_by_role("button", name="Capaian", exact=True).click()
                expect(chart).to_be_hidden()
                page.locator("#progress-targets").get_by_role("button", name="Isi capaian bulan", exact=True).first.click()
                expect(page.get_by_role("dialog")).to_be_visible()
                page.keyboard.press("Escape")
                progress_views.get_by_role("button", name="Evaluasi", exact=True).click()
                note = page.get_by_role("textbox", name=re.compile(r"Catatan checkpoint bulan"))
                note.fill("Catatan evaluasi program untuk uji browser.")
                page.get_by_role("button", name="Simpan catatan checkpoint", exact=True).click()
                expect(page.get_by_role("button", name="Tersimpan", exact=True)).to_be_visible()
                page.reload(wait_until="networkidle")
                progress_views.get_by_role("button", name="Evaluasi", exact=True).click()
                expect(note).to_have_value("Catatan evaluasi program untuk uji browser.")
                periods.get_by_role("button", name="Bulan 3", exact=True).click()
                expect(note).to_be_disabled()
                no_overflow()
            assert not errors, errors
            assert not external, external
            results.append({"width": width, "passed": True, "checks": ["six widget shortcuts","icon assets","single mobile panel","prayer expand spacing","trial habit detail","trial reminder settings","persistence","failed-save rollback","focus trap","Escape","focus restoration","Quran save","hadith save","journal save in Saudi timezone","locked preview","expiry","activation","admin settings","closed enrollment","guide","pricing","no overflow"]})
            context.close()
    finally:
        browser.close()
        server.shutdown()
(OUTPUT / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps({"passed": len(results), "widths": [item["width"] for item in results], "evidence": str(OUTPUT)}))
