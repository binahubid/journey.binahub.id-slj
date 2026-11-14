import Link from "next/link";
import { Globe, Instagram, Linkedin, Youtube } from "lucide-react";

const socialLinks = [
  { href: "https://binahub.id", label: "Website BinaHub", icon: Globe },
  {
    href: "https://instagram.com/binahub.id",
    label: "Instagram BinaHub",
    icon: Instagram,
  },
  {
    href: "https://www.linkedin.com/company/binahubid/",
    label: "LinkedIn BinaHub",
    icon: Linkedin,
  },
  {
    href: "https://youtube.com/@binahubid",
    label: "YouTube BinaHub",
    icon: Youtube,
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-navy-900/10 bg-white px-5 pb-6 pt-12 text-navy-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">
          <div>
            <a
              href="https://binahub.id"
              aria-label="BinaHub"
              className="inline-block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
            >
              <img
                src="/binahub_logo.webp"
                alt="BinaHub"
                loading="lazy"
                width="1574"
                height="448"
                className="h-auto w-36"
              />
            </a>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">
              Transformasi manusia, kepemimpinan, dan kapabilitas untuk masa
              depan yang terus berubah.
            </p>
            <p className="mt-3 text-xs font-medium text-[#85652D]">
              People. Learning. Elevated.
            </p>
            <div className="mt-5 flex gap-2">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-11 place-items-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-navy-900 hover:text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.5}
                  />
                </a>
              ))}
            </div>
          </div>
          <nav aria-label="Navigasi footer">
            <h2 className="text-sm font-semibold">Jelajahi BinaJourney</h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 text-sm text-slate-600">
              {[
                ["#tentang", "Tentang program"],
                ["#tahapan", "Empat tahap"],
                ["#ekosistem", "Pendampingan"],
                ["#sasaran", "Untuk siapa"],
                ["#pricing", "Pilihan program"],
                ["#faq", "Pertanyaan umum"],
                ["/panduan", "Panduan pengguna"],
                ["/login", "Masuk ke akun"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center underline-offset-4 hover:text-navy-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="text-sm font-semibold">Hubungi BinaHub</h2>
            <address className="mt-4 text-sm not-italic leading-7 text-slate-600">
              Kencana Tower, Level Mezzanine
              <br />
              Jl. Raya Meruya Ilir No. 88
              <br />
              Business Park Kebon Jeruk
              <br />
              Jakarta Barat 11620
            </address>
            <div className="mt-3 flex flex-col items-start text-sm text-slate-600">
              <a
                href="mailto:info@binahub.id"
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-900"
              >
                info@binahub.id
              </a>
              <a
                href="tel:02129601514"
                className="inline-flex min-h-11 items-center underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy-900"
              >
                021-29601514
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs leading-6 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} BinaHub. PT Binahub Solusi
            Transformasi.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <Link
              href="/terms#kebijakan-privasi"
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              Kebijakan privasi
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
            >
              Syarat & ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
