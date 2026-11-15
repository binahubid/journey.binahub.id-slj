import Link from "next/link";

const plans = [
  {
    name: "Mulai dari kebiasaan",
    duration: "14 hari",
    price: "Gratis",
    originalPrice: null,
    description: "Kenali BinaJourney melalui aktivitas spiritual sehari-hari.",
    features: ["Catatan salat & Al-Qur’an", "Hadits harian", "Jurnal refleksi"],
    href: "/register",
    action: "Mulai uji coba",
    trial: true,
    background: "/landing/slj/pricing-trial.webp",
    surface: "border-navy-900 bg-navy-900 text-white",
    accent: "text-[#E4C992]",
  },
  {
    name: "Bangun fondasi",
    duration: "1 bulan",
    price: "Rp3 juta",
    originalPrice: "Rp9 juta",
    description: "Mulai perubahan dengan fokus pengembangan yang terarah.",
    features: [
      "Pendampingan transformasi",
      "Rencana perubahan pribadi",
      "Pemantauan progres",
    ],
    href: "#kontak",
    action: "Diskusikan program",
    trial: false,
    background: "/landing/slj/pricing-foundation.webp",
    surface: "border-navy-900/10 bg-[#EFF4FE] text-navy-900",
    accent: "text-[#305D96]",
  },
  {
    name: "Jaga konsistensi",
    duration: "2 bulan",
    price: "Rp5 juta",
    originalPrice: "Rp14 juta",
    description: "Berikan waktu untuk melatih dan memperkuat kebiasaan baru.",
    features: [
      "Pendampingan transformasi",
      "Rencana perubahan pribadi",
      "Pemantauan progres",
    ],
    href: "#kontak",
    action: "Diskusikan program",
    trial: false,
    background: "/landing/slj/pricing-consistency.webp",
    surface: "border-navy-900/10 bg-[#EEF7F2] text-navy-900",
    accent: "text-[#2E6855]",
  },
  {
    name: "Perkuat perubahan",
    duration: "3 bulan",
    price: "Rp7 juta",
    originalPrice: "Rp19 juta",
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
    background: "/landing/slj/pricing-transformation.webp",
    surface: "border-navy-900/10 bg-[#FCF5E7] text-navy-900",
    accent: "text-[#8B6724]",
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
            return (
              <article
                key={plan.duration}
                className={`relative isolate flex flex-col overflow-hidden rounded-3xl border p-6 ${plan.surface}`}
              >
                <img
                  src={plan.background}
                  alt=""
                  aria-hidden="true"
                  width="768"
                  height="1152"
                  loading="lazy"
                  className="pointer-events-none absolute inset-0 -z-10 size-full scale-105 object-cover blur-[2px]"
                />
                {plan.trial && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-navy-900/10 via-navy-900/35 to-navy-900/55"
                  />
                )}
                <div className="flex min-h-10 flex-wrap items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${plan.accent}`}>
                    {plan.duration}
                  </p>
                  {plan.originalPrice && (
                    <span className="rounded-full border border-[#8B6724]/20 bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#74521B]">
                      Penawaran terbatas
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{plan.name}</h3>
                <div className="mt-6 flex min-h-20 flex-col justify-end gap-1">
                  {plan.originalPrice && (
                    <p className="text-sm tabular-nums text-[#30405C]">
                      <span className="sr-only">Harga normal </span>
                      <del>{plan.originalPrice}</del>
                    </p>
                  )}
                  <p className="text-4xl font-semibold tracking-tight tabular-nums">
                    {plan.originalPrice && <span className="sr-only">Harga promo </span>}
                    {plan.price}
                  </p>
                </div>
                <p
                  className={`mt-1 text-xs ${
                    plan.trial ? "text-blue-100" : "text-[#30405C]"
                  }`}
                >
                  {plan.trial ? "Tanpa pembayaran" : "Harga promo per peserta"}
                </p>
                <p
                  className={`mt-5 min-h-16 text-sm leading-6 ${
                    plan.trial ? "text-blue-100" : "text-[#30405C]"
                  }`}
                >
                  {plan.description}
                </p>
                <ul className="mb-7 mt-4 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
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
        <p className="mt-6 max-w-4xl text-xs leading-6 text-slate-600">
          Harga promo pendampingan berlaku per peserta. Cakupan layanan dan jadwal
          disepakati bersama BinaHub sebelum bergabung. Uji coba berfokus pada
          aktivitas spiritual, dengan pratinjau area pengembangan lainnya.
          Aktivitas tambahan seperti berkuda dibahas terpisah.
        </p>
      </div>
    </section>
  );
}
