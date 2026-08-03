"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  Heart,
  Target,
  Sparkles,
  Users,
  CheckCircle2,
  BookOpen,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Building2,
  FileText,
  Save,
} from "lucide-react";

interface PtpSheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  readOnly?: boolean;
}

export function PtpSheet({ open, onOpenChange = () => {}, readOnly = false }: PtpSheetProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // PTP State matching the 8 sections of BinaJourney poster
  const [muhasabah, setMuhasabah] = useState(
    "Insight terbesar: Saya perlu melatih kedisiplinan ibadah tepat waktu dan mengendalikan emosi saat memimpin tim."
  );
  const [niat, setNiat] = useState(
    "Karena Allah, saya berkomitmen untuk melatih kedisiplinan ibadah harian, memperbaiki akhlak sabar, dan menjadi teladan kepemimpinan spiritual."
  );
  const [areas, setAreas] = useState<string[]>([
    "Spiritual Growth",
    "Personal Development",
    "Leadership / Professional Excellence",
  ]);
  const [mainTarget, setMainTarget] = useState(
    "Istiqamah Sholat Tahajud 5x seminggu & Menjadi Pemimpin yang Lebih Sabar"
  );
  const [indicator1, setIndicator1] = useState("Sholat Tahajud 5x seminggu tanpa terputus");
  const [indicator2, setIndicator2] = useState("Khatam Tilawah Al-Qur'an 1 juz per minggu");
  const [indicator3, setIndicator3] = useState("Mendengarkan masukan tim dengan tenang tanpa emosi");

  const [coachName, setCoachName] = useState("Ustadz Budi Rahman");
  const [sahabatSafar, setSahabatSafar] = useState("Ahmad Fauzi");
  const [refleksiAkhir, setRefleksiAkhir] = useState("");

  const toggleArea = (area: string) => {
    if (readOnly) return;
    if (areas.includes(area)) {
      setAreas(areas.filter((a) => a !== area));
    } else {
      if (areas.length >= 3) return;
      setAreas([...areas, area]);
    }
  };

  const handleSavePtp = async () => {
    if (readOnly) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: journey } = await supabase
          .from("journeys")
          .select("id, ptp_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (journey) {
          if (journey.ptp_status === "LOCKED") {
            alert("Dokumen PTP telah dikunci oleh Admin dan tidak dapat diubah.");
            return;
          }

          await supabase
            .from("journeys")
            .update({
              muhasabah: muhasabah,
              niat: niat,
              area_transformasi: areas,
              main_target: mainTarget,
              success_indicators: [indicator1, indicator2, indicator3],
              final_reflection: refleksiAkhir,
              updated_at: new Date().toISOString(),
            })
            .eq("id", journey.id);

          await supabase.from("support_team").upsert({
            journey_id: journey.id,
            user_id: user.id,
            coach_name: coachName,
            sahabat_safar_name: sahabatSafar,
          });
        }
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error("Gagal menyimpan PTP:", err);
    } finally {
      setLoading(false);
    }
  };

  const areaList = [
    { id: "Spiritual Growth", label: "Spiritual Growth", desc: <>hubungan kita dengan Allah <span className="text-[1.15em] leading-none">ﷻ</span></> },
    { id: "Personal Development", label: "Personal Development", desc: "hubungan kita dengan diri sendiri" },
    { id: "Leadership Excellence", label: "Leadership/Profesional Excellence", desc: "amanah, tugas dan tanggung jawab kita dalam pekerjaan" },
    { id: "Relationship", label: "Relationship", desc: "hubungan kita dengan orang lain" },
    { id: "Community Impact", label: "Community Impact", desc: "dampak terhadap lingkungan sekitar" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-2xl w-full overflow-y-auto p-0 bg-warm-bg">
        <SheetHeader className="bg-navy-900 text-white p-6 border-b border-navy-800">
          <div className="flex items-center space-x-2 text-accent text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>BinaJourney • SLJ 90 Hari</span>
          </div>
          <SheetTitle className="text-xl font-extrabold text-white">
            Personal Transformation Project (PTP)
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-300">
            &ldquo;Perjalanan ke Baitullah mengubah cara kita memandang hidup. Istiqamah menentukan bagaimana kita menjalankannya.&rdquo;
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Section 1: HASIL MUHASABAH */}
          <div className="bg-white p-5 rounded-xl border border-warm-border space-y-2 shadow-2xs">
            <div className="flex items-center space-x-2 text-navy-900 font-bold text-sm">
              <span className="h-6 w-6 rounded-full bg-navy-900 text-accent text-xs flex items-center justify-center font-extrabold">1</span>
              <h4>HASIL MUHASABAH</h4>
            </div>
            <p className="text-xs text-gray-500">Insight terbesar yang saya peroleh tentang diri saya adalah...</p>
            <Textarea
              value={muhasabah}
              onChange={(e) => setMuhasabah(e.target.value)}
              placeholder="Tuliskan refleksi muhasabah Anda..."
              className="text-xs min-h-[80px]"
            />
          </div>

          {/* Section 2: NIAT PERUBAHAN */}
          <div className="bg-white p-5 rounded-xl border border-warm-border space-y-2 shadow-2xs">
            <div className="flex items-center space-x-2 text-navy-900 font-bold text-sm">
              <span className="h-6 w-6 rounded-full bg-navy-900 text-accent text-xs flex items-center justify-center font-extrabold">2</span>
              <h4>NIAT PERUBAHAN</h4>
              <Heart className="h-4 w-4 text-accent fill-accent ml-auto" />
            </div>
            <p className="text-xs text-gray-500">Karena Allah, saya berkomitmen untuk...</p>
            <Textarea
              value={niat}
              onChange={(e) => setNiat(e.target.value)}
              placeholder="Tuliskan niat perubahan Anda..."
              className="text-xs min-h-[80px] font-serif italic"
            />
          </div>

          {/* Section 3: AREA TRANSFORMASI */}
          <div className="bg-white p-5 rounded-xl border border-warm-border space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-navy-900 font-bold text-sm">
                <span className="h-6 w-6 rounded-full bg-navy-900 text-accent text-xs flex items-center justify-center font-extrabold">3</span>
                <h4>AREA TRANSFORMASI (MAKSIMAL 3)</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                {areas.length}/3 Dipilih
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {areaList.map((item) => {
                const isSelected = areas.includes(item.id);
                const isMaxedOut = !isSelected && areas.length >= 3;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleArea(item.id)}
                    className={`p-3 rounded-lg border flex items-start space-x-3 transition-all ${
                      isMaxedOut
                        ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                        : isSelected
                        ? "border-navy-900 bg-navy-50/50 cursor-pointer"
                        : "border-warm-border bg-white cursor-pointer"
                    }`}
                  >
                    <Checkbox checked={isSelected} disabled={isMaxedOut} className="mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-navy-900 block">{item.label}</span>
                      <span className="text-[11px] text-gray-500">{item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: TARGET PERUBAHAN (90 HARI) & INDIKATOR */}
          <div className="bg-white p-5 rounded-xl border border-warm-border space-y-4 shadow-2xs">
            <div className="flex items-center space-x-2 text-navy-900 font-bold text-sm">
              <span className="h-6 w-6 rounded-full bg-navy-900 text-accent text-xs flex items-center justify-center font-extrabold">4</span>
              <h4>TARGET PERUBAHAN (90 HARI) & INDIKATOR</h4>
            </div>

            {/* Panduan Formulasi Indikator 4 Dimensi */}
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200/80 space-y-2 text-xs text-navy-900">
              <div className="flex items-center space-x-2 font-bold text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Panduan Formulasi Indikator Keberhasilan (Terukur):</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Formulasikan 3 indikator terukur Anda berdasarkan 4 dimensi utama:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="font-bold text-[#0B2C6B] block">1. Kualitas</span>
                  <p className="text-slate-600">Mutu & khusyu (misal: <em>Sholat Tepat Waktu & Khusyu</em>)</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="font-bold text-[#0B2C6B] block">2. Kuantitas</span>
                  <p className="text-slate-600">Jumlah target (misal: <em>Khatam Al-Qur&apos;an 1 juz/minggu</em>)</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="font-bold text-[#0B2C6B] block">3. Waktu</span>
                  <p className="text-slate-600">Jadwal subuh (misal: <em>Bangun jam 04.00 WIB setiap hari</em>)</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200/60 shadow-2xs">
                  <span className="font-bold text-[#0B2C6B] block">4. Biaya</span>
                  <p className="text-slate-600">Nominal ikhtiar (misal: <em>Budget / alokasi nominal Rp 20.000/hari</em>)</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Satu perubahan utama yang ingin saya wujudkan:
                </label>
                <Input
                  value={mainTarget}
                  onChange={(e) => setMainTarget(e.target.value)}
                  placeholder="Target utama 90 hari..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-gray-700">Indikator Keberhasilan (3 Indikator):</label>
                <Input
                  value={indicator1}
                  onChange={(e) => setIndicator1(e.target.value)}
                  placeholder="Indikator 1..."
                  className="text-xs"
                />
                <Input
                  value={indicator2}
                  onChange={(e) => setIndicator2(e.target.value)}
                  placeholder="Indikator 2..."
                  className="text-xs"
                />
                <Input
                  value={indicator3}
                  onChange={(e) => setIndicator3(e.target.value)}
                  placeholder="Indikator 3..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 6: TIM PENDUKUNG (DITENTUKAN OLEH ADMIN) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-warm-border space-y-2">
            <div className="flex items-center space-x-2 text-navy-900 font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <h4>TIM PENDUKUNG (DITENTUKAN OLEH ADMIN)</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Coach Pendamping dan Sahabat Safar akan ditentukan oleh Admin berdasarkan evaluasi Initial Process Anda.
            </p>
          </div>

          {/* Section 8: REFLEKSI AKHIR */}
          <div className="bg-white p-5 rounded-xl border border-warm-border space-y-2 shadow-2xs">
            <div className="flex items-center space-x-2 text-navy-900 font-bold text-sm">
              <span className="h-6 w-6 rounded-full bg-navy-900 text-accent text-xs flex items-center justify-center font-extrabold">8</span>
              <h4>REFLEKSI AKHIR (DIISE SAAT PROGRAM SELESAI)</h4>
            </div>
            <p className="text-xs text-gray-500">Perubahan paling nyata yang saya rasakan setelah 90 hari adalah...</p>
            <Textarea
              value={refleksiAkhir}
              onChange={(e) => setRefleksiAkhir(e.target.value)}
              placeholder="Catatan refleksi akhir program..."
              className="text-xs min-h-[70px]"
            />
          </div>
        </div>

        <SheetFooter className="p-4 bg-white border-t border-warm-border sticky bottom-0">
          <Button
            onClick={handleSavePtp}
            disabled={loading}
            className="w-full bg-navy-900 hover:bg-black text-accent font-bold text-xs gap-2 py-5 rounded-lg shadow-sm"
          >
            <Save className="h-4 w-4" />
            {loading ? "Menyimpan PTP..." : saved ? "✓ Personal Transformation Project Tersimpan" : "Simpan Personal Transformation Project Digital"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
