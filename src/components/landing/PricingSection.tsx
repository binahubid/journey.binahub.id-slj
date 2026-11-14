import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Target,
  TrendingUp,
} from "lucide-react";

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
    icon: BookOpen,
    surface: "border-[#24385C] border-t-[#C79A3C] bg-navy-900 text-white",
    accent: "text-[#E4C992]",
    iconSurface: "border-white/15 bg-white/10",
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
    icon: Compass,
    surface: "border-[#CDDCF4] border-t-[#577EBB] bg-[#EFF4FE] text-navy-900",
    accent: "text-[#305D96]",
    iconSurface: "border-[#CDDCF4] bg-white/80",
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
    icon: TrendingUp,
    surface: "border-[#CCE2D7] border-t-[#518C7F] bg-[#EEF7F2] text-navy-900",
    accent: "text-[#2E6855]",
    iconSurface: "border-[#CCE2D7] bg-white/80",
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
    icon: Target,
    surface: "border-[#E9D7B2] border-t-[#BC9144] bg-[#FCF5E7] text-navy-900",
    accent: "text-[#8B6724]",
    iconSurface: "border-[#E9D7B2] bg-white/80",
  },
];

export function PricingSection({
  trialClosed = false,
  trialHref = "/register",
}: {
  trialClosed?: boolean;
  trialHref?: string;
}) {
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
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <article
                key={plan.duration}
                className={`relative isolate flex flex-col overflow-hidden rounded-3xl border border-t-4 p-6 ${plan.surface}`}
              >
                {plan.trial && (
                  <img
                    src="/bg-filosofi.webp"
                    alt=""
                    aria-hidden="true"
                    width="1810"
                    height="869"
                    loading="lazy"
                    className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-50"
                  />
                )}
                <div className="flex min-h-10 items-center justify-between gap-3">
                  <p className={`text-sm font-semibold ${plan.accent}`}>
                    {plan.duration}
                  </p>
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border ${plan.iconSurface} ${plan.accent}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-5"
                      strokeWidth={1.5}
                    />
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{plan.name}</h3>
                <p className="mt-6 text-4xl font-semibold tracking-tight tabular-nums">
                  {plan.price}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    plan.trial ? "text-blue-200" : "text-slate-600"
                  }`}
                >
                  {plan.trial ? "Tanpa pembayaran" : "Estimasi per peserta"}
                </p>
                <p
                  className={`mt-5 min-h-16 text-sm leading-6 ${
                    plan.trial ? "text-blue-100" : "text-slate-600"
                  }`}
                >
                  {plan.description}
                </p>
                <ul className="mb-7 mt-4 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check
                        aria-hidden
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          plan.trial ? "text-[#DAB568]" : "text-slate-500"
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.trial ? trialHref : plan.href}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-center text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${
                    plan.trial
                      ? "bg-white text-navy-900 hover:bg-blue-50 focus-visible:outline-white"
                      : "border border-navy-900/20 bg-white/80 text-navy-900 hover:border-navy-900 hover:bg-navy-900 hover:text-white focus-visible:outline-navy-900"
                  }`}
                >
                  {plan.trial && trialClosed ? "Masuk ke akun" : plan.action}
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                {plan.trial && trialClosed && (
                  <p className="mt-3 text-center text-xs leading-5 text-blue-100">
                    Pendaftaran peserta baru sedang ditutup.
                  </p>
                )}
              </article>
            );
          })}
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
