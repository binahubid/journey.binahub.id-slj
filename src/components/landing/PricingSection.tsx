import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Mulai dari kebiasaan",
    duration: "14 hari",
    price: "Gratis",
    description: "Kenali BinaJourney melalui aktivitas spiritual sehari-hari.",
    features: ["Catatan salat & Al-Qur’an", "Hadits harian", "Jurnal refleksi"],
    href: "/register",
    action: "Mulai uji coba",
    trial: true,
  },
  {
    name: "Bangun fondasi",
    duration: "1 bulan",
    price: "Rp3 juta",
    description: "Mulai perubahan dengan fokus pengembangan yang terarah.",
    features: [
      "Pendampingan transformasi",
      "Rencana perubahan pribadi",
      "Pemantauan progres",
    ],
    href: "#kontak",
    action: "Diskusikan program",
    trial: false,
  },
  {
    name: "Jaga konsistensi",
    duration: "2 bulan",
    price: "Rp5 juta",
    description: "Berikan waktu untuk melatih dan memperkuat kebiasaan baru.",
    features: [
      "Pendampingan transformasi",
      "Rencana perubahan pribadi",
      "Pemantauan progres",
    ],
    href: "#kontak",
    action: "Diskusikan program",
    trial: false,
  },
  {
    name: "Perkuat perubahan",
    duration: "3 bulan",
    price: "Rp7 juta",
    description:
      "Jalani proses perubahan secara lebih menyeluruh dan berkelanjutan.",
    features: [
      "Pendampingan transformasi",
      "Rencana perubahan pribadi",
      "Pemantauan progres",
    ],
    href: "#kontak",
    action: "Diskusikan program",
    trial: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 bg-[#F5F7FB] px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8B6724]">
            Pilihan perjalanan
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
            Mulai dengan satu langkah baik.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Coba ruang spiritual selama 14 hari. Saat Anda siap melangkah lebih
            jauh, diskusikan program pendampingan bersama BinaHub.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.duration}
              className={`flex flex-col rounded-3xl border p-6 ${plan.trial ? "border-navy-900 bg-navy-900 text-white" : "border-slate-200 bg-white text-navy-900"}`}
            >
              <p
                className={`text-sm font-medium ${plan.trial ? "text-blue-200" : "text-slate-500"}`}
              >
                {plan.duration}
              </p>
              <h3 className="mt-3 text-lg font-semibold">{plan.name}</h3>
              <p className="mt-6 text-3xl font-semibold tracking-tight tabular-nums">
                {plan.price}
              </p>
              <p
                className={`mt-1 text-xs ${plan.trial ? "text-blue-200" : "text-slate-500"}`}
              >
                {plan.trial ? "Tanpa pembayaran" : "Estimasi per peserta"}
              </p>
              <p
                className={`mt-5 min-h-16 text-sm leading-6 ${plan.trial ? "text-blue-100" : "text-slate-600"}`}
              >
                {plan.description}
              </p>
              <ul className="mb-7 mt-4 flex-1 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check
                      aria-hidden
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.trial ? "text-[#DAB568]" : "text-slate-500"}`}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-medium ${plan.trial ? "bg-white text-navy-900 hover:bg-blue-50" : "border border-slate-200 hover:bg-slate-50"}`}
              >
                {plan.action}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-500">
          Harga pendampingan merupakan estimasi awal. Cakupan layanan dan jadwal
          disepakati bersama BinaHub sebelum bergabung. Uji coba berfokus pada
          aktivitas spiritual, dengan pratinjau area pengembangan lainnya.
          Aktivitas tambahan seperti berkuda dibahas terpisah.
        </p>
      </div>
    </section>
  );
}
