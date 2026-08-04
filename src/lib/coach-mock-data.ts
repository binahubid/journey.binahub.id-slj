import { JourneyStatus } from "@/types/slj";

export type CoachAlertType = "HABIT_HALTED" | "CHECKPOINT_UNFILLED" | "COACH_ACTION_NEEDED" | "INACTIVE";

export interface CoachCheckpoint {
  month: 1 | 2 | 3;
  status: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  participantNote?: string;
  coachNote?: string;
  date?: string;
}

export interface CoachParticipant {
  id: string;
  fullName: string;
  initials: string;
  company: string;
  batch: string;
  city: string;
  dayCount: number;
  journeyStatus: JourneyStatus;
  habitCompletionPercent: number;
  streak: number;
  lastActive: string;
  lastActiveDaysAgo: number;
  lastHabitLogDaysAgo: number;
  checkpointOpenDaysAgo?: number;
  lastCheckpointStatus: "ON_TRACK" | "NEED_SUPPORT" | "NOT_FILLED";
  coachRepliedDaysAgo?: number;
  muhasabah: string;
  niat: string;
  mainTarget: string;
  transformationAreas: string[];
  successIndicators: string[];
  baseline: Record<string, number>;
  habitTrend: number[];
  journals: { date: string; title: string; excerpt: string }[];
  indicatorReports: {
    month: number;
    area: string;
    quality: number;
    quantity: number;
    time: number;
    cost: number;
  }[];
  managerEvaluations: {
    month: number;
    productivity: number;
    discipline: number;
    integrity: number;
    note: string;
  }[];
  checkpoints: CoachCheckpoint[];
  ptpSnapshots: { version: string; date: string; status: string; note: string }[];
}

export const coachProfile = {
  name: "Faris Ramadhan",
  role: "Lead Coach",
  initials: "FR",
  cohort: "SLJ Corporate 2026",
};

export const coachParticipants: CoachParticipant[] = [
  {
    id: "ahmad-fauzan",
    fullName: "Ahmad Fauzan",
    initials: "AF",
    company: "Bank Syariah Indonesia",
    batch: "Batch Leadership A",
    city: "Jakarta",
    dayCount: 47,
    journeyStatus: JourneyStatus.CHECKPOINT_2,
    habitCompletionPercent: 42,
    streak: 2,
    lastActive: "2 jam lalu",
    lastActiveDaysAgo: 0,
    lastHabitLogDaysAgo: 1,
    lastCheckpointStatus: "NEED_SUPPORT",
    coachRepliedDaysAgo: 6,
    muhasabah: "Saya sering menunda percakapan penting dan belum konsisten menjaga ritme ibadah saat pekerjaan meningkat.",
    niat: "Menjadi pemimpin yang hadir, tenang, dan dapat dipercaya dalam setiap amanah.",
    mainTarget: "Membangun ritme kepemimpinan yang disiplin tanpa mengorbankan kualitas hubungan dan ibadah.",
    transformationAreas: ["Spiritual Growth", "Leadership Excellence", "Relationship"],
    successIndicators: ["Shalat tepat waktu minimal 5 hari per minggu", "Satu sesi coaching tim setiap minggu", "Percakapan bermakna dengan keluarga 3 kali per minggu"],
    baseline: { "Spiritual Growth": 62, "Personal Development": 58, Relationship: 54, "Leadership Excellence": 67, "Community Impact": 45 },
    habitTrend: [71, 57, 64, 43, 50, 36, 42],
    journals: [
      { date: "2 Agustus 2026", title: "Belajar hadir sebelum memberi arahan", excerpt: "Hari ini saya menyadari tim lebih membutuhkan ketenangan saya daripada jawaban yang cepat." },
      { date: "31 Juli 2026", title: "Ritme yang perlu dijaga", excerpt: "Pekerjaan yang padat kembali membuat tilawah tertunda. Saya perlu memindahkannya ke pagi hari." },
    ],
    indicatorReports: [
      { month: 1, area: "Leadership Excellence", quality: 72, quantity: 68, time: 61, cost: 78 },
      { month: 1, area: "Spiritual Growth", quality: 70, quantity: 64, time: 58, cost: 80 },
      { month: 2, area: "Leadership Excellence", quality: 66, quantity: 62, time: 55, cost: 76 },
    ],
    managerEvaluations: [
      { month: 1, productivity: 7, discipline: 6, integrity: 9, note: "Terlihat lebih terbuka menerima umpan balik dan mulai membangun ritme delegasi." },
      { month: 2, productivity: 7, discipline: 6, integrity: 9, note: "Perlu menjaga konsistensi tindak lanjut ketika tekanan operasional meningkat." },
    ],
    checkpoints: [
      { month: 1, status: "ON_TRACK", participantNote: "Mulai menemukan ritme yang lebih sehat.", coachNote: "Pertahankan ritme pagi dan prioritaskan satu kebiasaan kunci.", date: "18 Juni 2026" },
      { month: 2, status: "NEED_SUPPORT", participantNote: "Dua pekan terakhir cukup berat dan beberapa habit terlewat.", date: "18 Juli 2026" },
      { month: 3, status: "NOT_FILLED" },
    ],
    ptpSnapshots: [
      { version: "Versi 2", date: "20 Juni 2026", status: "REVISION", note: "Target dipersempit menjadi tiga ritme kepemimpinan utama." },
      { version: "Versi 1", date: "19 Mei 2026", status: "INITIAL", note: "PTP awal disusun setelah baseline selesai." },
    ],
  },
  {
    id: "siti-nurhaliza",
    fullName: "Siti Nurhaliza",
    initials: "SN",
    company: "Bank Syariah Indonesia",
    batch: "Batch Leadership A",
    city: "Bandung",
    dayCount: 47,
    journeyStatus: JourneyStatus.CHECKPOINT_2,
    habitCompletionPercent: 88,
    streak: 16,
    lastActive: "35 menit lalu",
    lastActiveDaysAgo: 0,
    lastHabitLogDaysAgo: 0,
    lastCheckpointStatus: "ON_TRACK",
    coachRepliedDaysAgo: 1,
    muhasabah: "Saya ingin menjaga standar tinggi tanpa membuat tim merasa takut melakukan kesalahan.",
    niat: "Memimpin dengan ketegasan yang tetap menghadirkan rasa aman.",
    mainTarget: "Membangun budaya umpan balik yang jujur dan suportif di dalam tim.",
    transformationAreas: ["Relationship", "Leadership Excellence", "Personal Development"],
    successIndicators: ["Satu sesi feedback setiap pekan", "Delegasi dua keputusan operasional", "Refleksi kepemimpinan setiap Jumat"],
    baseline: { "Spiritual Growth": 78, "Personal Development": 72, Relationship: 69, "Leadership Excellence": 75, "Community Impact": 61 },
    habitTrend: [79, 86, 86, 93, 86, 93, 88],
    journals: [{ date: "3 Agustus 2026", title: "Memberi ruang kepada tim", excerpt: "Delegasi hari ini berjalan lebih baik ketika saya memberi konteks, bukan hanya instruksi." }],
    indicatorReports: [{ month: 2, area: "Leadership Excellence", quality: 86, quantity: 82, time: 80, cost: 84 }],
    managerEvaluations: [{ month: 2, productivity: 9, discipline: 9, integrity: 9, note: "Perubahan paling terlihat pada kualitas delegasi dan komunikasi lintas fungsi." }],
    checkpoints: [
      { month: 1, status: "ON_TRACK", participantNote: "Lebih sadar terhadap pola komunikasi.", coachNote: "Mulai ukur perubahan dari respons tim.", date: "18 Juni 2026" },
      { month: 2, status: "ON_TRACK", participantNote: "Delegasi dan feedback mulai konsisten.", coachNote: "Pertahankan dan dokumentasikan praktik yang paling efektif.", date: "18 Juli 2026" },
      { month: 3, status: "NOT_FILLED" },
    ],
    ptpSnapshots: [{ version: "Versi 1", date: "19 Mei 2026", status: "LOCKED", note: "PTP disepakati tanpa revisi mayor." }],
  },
  {
    id: "rizky-pratama",
    fullName: "Rizky Pratama",
    initials: "RP",
    company: "Bank Syariah Indonesia",
    batch: "Batch Leadership B",
    city: "Surabaya",
    dayCount: 32,
    journeyStatus: JourneyStatus.CHECKPOINT_1,
    habitCompletionPercent: 18,
    streak: 0,
    lastActive: "6 hari lalu",
    lastActiveDaysAgo: 6,
    lastHabitLogDaysAgo: 6,
    checkpointOpenDaysAgo: 2,
    lastCheckpointStatus: "NOT_FILLED",
    muhasabah: "Saya masih mudah kehilangan arah ketika banyak prioritas datang bersamaan.",
    niat: "Melatih disiplin untuk menuntaskan amanah satu per satu.",
    mainTarget: "Membangun sistem prioritas harian yang sederhana dan konsisten.",
    transformationAreas: ["Personal Development", "Spiritual Growth", "Leadership Excellence"],
    successIndicators: ["Menentukan tiga prioritas setiap pagi", "Review harian sebelum pulang", "Shalat Dzuhur tepat waktu"],
    baseline: { "Spiritual Growth": 55, "Personal Development": 43, Relationship: 59, "Leadership Excellence": 48, "Community Impact": 39 },
    habitTrend: [43, 29, 29, 14, 14, 0, 18],
    journals: [],
    indicatorReports: [],
    managerEvaluations: [{ month: 1, productivity: 5, discipline: 4, integrity: 8, note: "Memiliki potensi kuat, tetapi konsistensi penyelesaian pekerjaan masih perlu didampingi." }],
    checkpoints: [
      { month: 1, status: "NOT_FILLED" },
      { month: 2, status: "NOT_FILLED" },
      { month: 3, status: "NOT_FILLED" },
    ],
    ptpSnapshots: [{ version: "Versi 1", date: "3 Juli 2026", status: "INITIAL", note: "PTP awal dengan fokus sistem prioritas." }],
  },
  {
    id: "maya-lestari",
    fullName: "Maya Lestari",
    initials: "ML",
    company: "Bank Syariah Indonesia",
    batch: "Batch Leadership B",
    city: "Medan",
    dayCount: 68,
    journeyStatus: JourneyStatus.CHECKPOINT_3,
    habitCompletionPercent: 0,
    streak: 0,
    lastActive: "17 hari lalu",
    lastActiveDaysAgo: 17,
    lastHabitLogDaysAgo: 19,
    checkpointOpenDaysAgo: 9,
    lastCheckpointStatus: "NOT_FILLED",
    muhasabah: "Saya ingin kembali menemukan energi untuk menjalankan perubahan yang sudah saya mulai.",
    niat: "Kembali hadir dan menuntaskan perjalanan ini dengan jujur.",
    mainTarget: "Memulihkan ritme ibadah dan komunikasi keluarga secara bertahap.",
    transformationAreas: ["Spiritual Growth", "Relationship", "Personal Development"],
    successIndicators: ["Kembali mencatat habit harian", "Mengisi checkpoint ketiga", "Menjadwalkan percakapan dengan coach"],
    baseline: { "Spiritual Growth": 64, "Personal Development": 60, Relationship: 71, "Leadership Excellence": 57, "Community Impact": 53 },
    habitTrend: [14, 0, 0, 0, 0, 0, 0],
    journals: [{ date: "16 Juli 2026", title: "Menjaga energi", excerpt: "Saya perlu berhenti menuntut perubahan besar ketika tenaga sedang terbatas." }],
    indicatorReports: [{ month: 2, area: "Relationship", quality: 61, quantity: 55, time: 52, cost: 70 }],
    managerEvaluations: [],
    checkpoints: [
      { month: 1, status: "ON_TRACK", participantNote: "Ritme awal cukup baik.", coachNote: "Jaga target tetap realistis.", date: "2 Juni 2026" },
      { month: 2, status: "NEED_SUPPORT", participantNote: "Mulai kehilangan konsistensi.", coachNote: "Kita sederhanakan kembali target minggu depan.", date: "2 Juli 2026" },
      { month: 3, status: "NOT_FILLED" },
    ],
    ptpSnapshots: [
      { version: "Versi 2", date: "5 Juli 2026", status: "REVISION", note: "Intensitas habit diturunkan agar lebih realistis." },
      { version: "Versi 1", date: "5 Mei 2026", status: "INITIAL", note: "PTP awal berfokus pada spiritual dan keluarga." },
    ],
  },
  {
    id: "dimas-ardiansyah",
    fullName: "Dimas Ardiansyah",
    initials: "DA",
    company: "Bank Syariah Indonesia",
    batch: "Batch Leadership A",
    city: "Makassar",
    dayCount: 47,
    journeyStatus: JourneyStatus.ACTIVE,
    habitCompletionPercent: 73,
    streak: 8,
    lastActive: "Kemarin",
    lastActiveDaysAgo: 1,
    lastHabitLogDaysAgo: 1,
    lastCheckpointStatus: "ON_TRACK",
    coachRepliedDaysAgo: 2,
    muhasabah: "Saya perlu lebih konsisten membagikan manfaat di luar lingkaran kerja utama.",
    niat: "Menjadikan kompetensi saya sebagai jalan memberi manfaat.",
    mainTarget: "Membangun satu program mentoring internal yang berjalan konsisten.",
    transformationAreas: ["Community Impact", "Leadership Excellence", "Personal Development"],
    successIndicators: ["Dua sesi mentoring per bulan", "Dokumentasi materi mentoring", "Evaluasi peserta mentoring"],
    baseline: { "Spiritual Growth": 70, "Personal Development": 76, Relationship: 68, "Leadership Excellence": 74, "Community Impact": 49 },
    habitTrend: [64, 71, 79, 71, 79, 71, 73],
    journals: [{ date: "2 Agustus 2026", title: "Berbagi sebelum sempurna", excerpt: "Saya tidak perlu menunggu materi sempurna untuk mulai membantu rekan lain." }],
    indicatorReports: [{ month: 1, area: "Community Impact", quality: 74, quantity: 68, time: 72, cost: 81 }],
    managerEvaluations: [{ month: 1, productivity: 8, discipline: 8, integrity: 9, note: "Mulai aktif mengembangkan anggota tim di luar tanggung jawab formal." }],
    checkpoints: [
      { month: 1, status: "ON_TRACK", participantNote: "Program mentoring mulai diuji.", coachNote: "Fokus pada satu format yang mudah diulang.", date: "18 Juni 2026" },
      { month: 2, status: "NOT_FILLED" },
      { month: 3, status: "NOT_FILLED" },
    ],
    ptpSnapshots: [{ version: "Versi 1", date: "19 Mei 2026", status: "LOCKED", note: "PTP berfokus pada mentoring internal." }],
  },
  {
    id: "nur-aulia",
    fullName: "Nur Aulia",
    initials: "NA",
    company: "Bank Syariah Indonesia",
    batch: "Batch Leadership C",
    city: "Yogyakarta",
    dayCount: 21,
    journeyStatus: JourneyStatus.ACTIVE,
    habitCompletionPercent: 64,
    streak: 5,
    lastActive: "4 jam lalu",
    lastActiveDaysAgo: 0,
    lastHabitLogDaysAgo: 0,
    lastCheckpointStatus: "NOT_FILLED",
    muhasabah: "Saya ingin lebih berani menyampaikan kebutuhan dan batasan dengan cara yang baik.",
    niat: "Menjadi pribadi yang jujur, hangat, dan tegas dalam hubungan.",
    mainTarget: "Membangun komunikasi asertif dalam keluarga dan pekerjaan.",
    transformationAreas: ["Relationship", "Personal Development", "Spiritual Growth"],
    successIndicators: ["Satu percakapan jujur setiap minggu", "Jurnal emosi tiga kali seminggu", "Dzikir pagi konsisten"],
    baseline: { "Spiritual Growth": 73, "Personal Development": 57, Relationship: 51, "Leadership Excellence": 60, "Community Impact": 48 },
    habitTrend: [50, 57, 64, 57, 71, 64, 64],
    journals: [{ date: "3 Agustus 2026", title: "Jujur tanpa menyakiti", excerpt: "Saya mulai memahami bahwa kejelasan juga merupakan bentuk kepedulian." }],
    indicatorReports: [],
    managerEvaluations: [],
    checkpoints: [
      { month: 1, status: "NOT_FILLED" },
      { month: 2, status: "NOT_FILLED" },
      { month: 3, status: "NOT_FILLED" },
    ],
    ptpSnapshots: [{ version: "Versi 1", date: "15 Juli 2026", status: "INITIAL", note: "PTP awal berfokus pada komunikasi asertif." }],
  },
];

export function getCoachParticipant(id: string) {
  return coachParticipants.find((participant) => participant.id === id);
}

export function getCoachAlert(participant: CoachParticipant): { type: CoachAlertType; label: string } | undefined {
  if (participant.lastActiveDaysAgo > 14) return { type: "INACTIVE", label: "Tidak aktif" };
  if (participant.lastCheckpointStatus === "NEED_SUPPORT" && (participant.coachRepliedDaysAgo === undefined || participant.coachRepliedDaysAgo > 3)) {
    return { type: "COACH_ACTION_NEEDED", label: "Perlu tindak lanjut" };
  }
  if (participant.checkpointOpenDaysAgo !== undefined && participant.checkpointOpenDaysAgo > 7 && participant.lastCheckpointStatus === "NOT_FILLED") {
    return { type: "CHECKPOINT_UNFILLED", label: "Checkpoint tertunda" };
  }
  if (participant.lastHabitLogDaysAgo >= 5) return { type: "HABIT_HALTED", label: "Habit terhenti" };
  return undefined;
}

export const journeyStatusLabels: Record<JourneyStatus, string> = {
  [JourneyStatus.DRAFT]: "Draft",
  [JourneyStatus.ONBOARDING]: "Onboarding",
  [JourneyStatus.ACTIVE]: "Aktif",
  [JourneyStatus.CHECKPOINT_1]: "Checkpoint 1",
  [JourneyStatus.CHECKPOINT_2]: "Checkpoint 2",
  [JourneyStatus.CHECKPOINT_3]: "Checkpoint 3",
  [JourneyStatus.COMPLETED]: "Selesai",
  [JourneyStatus.ARCHIVED]: "Diarsipkan",
};
