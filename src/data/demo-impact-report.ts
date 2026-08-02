export interface DemoParticipantReport {
  id: string;
  name: string;
  role: string;
  company: string;
  coach: string;
  overallScore: number;
  status: "Excellent" | "Very Good" | "Good";
  topArea: string;
  productivity: string;
  discipline: string;
  ptpProgress: number;
  habits: { name: string; target: string; completion: number }[];
  radarData: { area: string; before: number; after: number }[];
  coachComment: string;
  safarComment: string;
}

export const DEMO_PARTICIPANTS: DemoParticipantReport[] = [
  {
    id: "1", name: "Ahmad Fauzi", role: "Senior VP Operations", company: "PT Astra International Tbk", coach: "Dr. H. Bambang Setiawan", overallScore: 94, status: "Excellent", topArea: "Leadership Excellence", productivity: "132%", discipline: "94%", ptpProgress: 92,
    habits: [
      { name: "Tahajud 4 Rakaat & Istighfar 100x", target: "7x/minggu", completion: 95 },
      { name: "One-on-One Mentoring Tim Operasional", target: "2x/minggu", completion: 90 },
      { name: "Membaca Buku Kepemimpinan 15 Mnt", target: "7x/minggu", completion: 88 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 65, after: 95 }, { area: "Personal Development", before: 60, after: 90 }, { area: "Leadership Excellence", before: 58, after: 96 }, { area: "Relationship & Community", before: 62, after: 88 }, { area: "Professional Impact", before: 70, after: 94 },
    ],
    coachComment: "Ahmad menunjukkan komitmen istiqamah luar biasa. PTP operasional berjalan sesuai jadwal dan kepemimpinannya kini lebih empatik.",
    safarComment: "Aktif saling mengingatkan di grup Sahabat Safar. Menginspirasi peserta lain dalam menjaga amalan harian.",
  },
  {
    id: "2", name: "Dewi Lestari", role: "Finance Director", company: "PT Astra International Tbk", coach: "Ustz. Hj. Nurjanah, M.Ag.", overallScore: 92, status: "Excellent", topArea: "Relationship & Community", productivity: "124%", discipline: "95%", ptpProgress: 90,
    habits: [
      { name: "Dhuha 4 Rakaat & Doa Kelapangan Rezeki", target: "7x/minggu", completion: 96 },
      { name: "Program CSR & Bina Komunitas Usaha", target: "1x/bulan", completion: 90 },
      { name: "Waktu Khusus Keluarga (No Gadget)", target: "2x/minggu", completion: 85 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 62, after: 92 }, { area: "Personal Development", before: 60, after: 88 }, { area: "Leadership Excellence", before: 58, after: 90 }, { area: "Relationship & Community", before: 64, after: 96 }, { area: "Professional Impact", before: 72, after: 94 },
    ],
    coachComment: "Dewi berhasil menyeimbangkan kepemimpinan keuangan yang tegas dengan ketenangan batin dan kepedulian sosial.",
    safarComment: "Inisiatif tinggi dalam mengorganisir kegiatan sosial bersama Sahabat Safar.",
  },
  {
    id: "3", name: "Siti Rahayu", role: "Head of Human Capital", company: "PT Astra International Tbk", coach: "Ust. Ahmad Rifai, M.Pd.", overallScore: 91, status: "Excellent", topArea: "Spiritual Growth", productivity: "128%", discipline: "92%", ptpProgress: 88,
    habits: [
      { name: "Sedekah Subuh & Tilawah 1 Juz", target: "7x/minggu", completion: 92 },
      { name: "Evaluasi Budaya Kerja Islami Tim", target: "1x/minggu", completion: 85 },
      { name: "Olahraga Ringan 20 Mnt", target: "3x/minggu", completion: 80 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 60, after: 94 }, { area: "Personal Development", before: 62, after: 89 }, { area: "Leadership Excellence", before: 55, after: 90 }, { area: "Relationship & Community", before: 65, after: 92 }, { area: "Professional Impact", before: 68, after: 90 },
    ],
    coachComment: "Siti berhasil mengintegrasikan nilai spiritual dalam kebijakan HC perusahaan. Budaya empati meningkat signifikan.",
    safarComment: "Sangat konsisten mencatat jurnal muhasabah harian dan menguatkan rekan se-kelompok.",
  },
  {
    id: "4", name: "Rizky Pratama", role: "IT & Digital Transformation Lead", company: "PT Astra International Tbk", coach: "Ust. Ahmad Rifai, M.Pd.", overallScore: 89, status: "Excellent", topArea: "Personal Development", productivity: "135%", discipline: "91%", ptpProgress: 86,
    habits: [
      { name: "Dzikir Pagi-Petang & Tilawah 15 Mnt", target: "7x/minggu", completion: 90 },
      { name: "Digital Detoks Setelah Jam 9 Malam", target: "7x/minggu", completion: 82 },
      { name: "Sharing Knowledge Tech & Leadership", target: "2x/bulan", completion: 88 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 56, after: 88 }, { area: "Personal Development", before: 58, after: 92 }, { area: "Leadership Excellence", before: 54, after: 86 }, { area: "Relationship & Community", before: 55, after: 84 }, { area: "Professional Impact", before: 68, after: 95 },
    ],
    coachComment: "Perubahan positif pada konsentrasi dan kejernihan pikiran dalam mengambil keputusan arsitektur sistem.",
    safarComment: "Sangat terbantu dengan reminder otomatis sistem dan rajin berbagi insight digital.",
  },
  {
    id: "5", name: "Budi Santoso", role: "General Manager Supply Chain", company: "PT Astra International Tbk", coach: "Dr. H. Bambang Setiawan", overallScore: 87, status: "Very Good", topArea: "Professional Impact", productivity: "126%", discipline: "88%", ptpProgress: 84,
    habits: [
      { name: "Shalat Berjamaah di Awal Waktu", target: "5x/hari", completion: 88 },
      { name: "Review Efisiensi Logistik Berkelanjutan", target: "1x/minggu", completion: 90 },
      { name: "Diskusi Bebas Stres dengan Tim", target: "2x/minggu", completion: 78 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 58, after: 88 }, { area: "Personal Development", before: 55, after: 84 }, { area: "Leadership Excellence", before: 52, after: 86 }, { area: "Relationship & Community", before: 58, after: 82 }, { area: "Professional Impact", before: 65, after: 94 },
    ],
    coachComment: "Perkembangan pesat pada kontrol emosi dan pengelolaan stres kerja di lingkungan logistik yang dinamis.",
    safarComment: "Disiplin mengisi habit tracker dan selalu hadir dalam pertemuan bulanan.",
  },
  {
    id: "6", name: "Hendra Wijaya", role: "GM Sales & Marketing", company: "PT Astra International Tbk", coach: "Dr. H. Bambang Setiawan", overallScore: 86, status: "Very Good", topArea: "Leadership Excellence", productivity: "122%", discipline: "90%", ptpProgress: 85,
    habits: [
      { name: "Shalat Dhuha & Doa Kejujuran Bisnis", target: "5x/minggu", completion: 90 },
      { name: "Coaching Tim Sales Berbasis Nilai", target: "2x/minggu", completion: 85 },
      { name: "Kajian Rutin Bersama Tim", target: "1x/minggu", completion: 88 },
    ],
    radarData: [
      { area: "Spiritual Growth", before: 57, after: 86 }, { area: "Personal Development", before: 56, after: 85 }, { area: "Leadership Excellence", before: 53, after: 90 }, { area: "Relationship & Community", before: 60, after: 84 }, { area: "Professional Impact", before: 66, after: 91 },
    ],
    coachComment: "Hendra membuktikan bahwa target penjualan tinggi dapat dicapai dengan menjunjung etika dan kejujuran kepemimpinan.",
    safarComment: "Konsisten menebar optimisme dan aktif dalam dinamika kelompok Sahabat Safar.",
  },
];

export interface AllParticipantSummary {
  rank: number;
  name: string;
  role: string;
  overallScore: number;
  status: "Excellent" | "Very Good" | "Good";
  topArea: string;
  ptpProgress: number;
  productivity: string;
  discipline: string;
}

export const ALL_25_PARTICIPANTS: AllParticipantSummary[] = [
  { rank: 1, name: "Ahmad Fauzi", role: "Senior VP Operations", overallScore: 94, status: "Excellent", topArea: "Leadership Excellence", ptpProgress: 92, productivity: "132%", discipline: "94%" },
  { rank: 2, name: "Dewi Lestari", role: "Finance Director", overallScore: 92, status: "Excellent", topArea: "Relationship & Community", ptpProgress: 90, productivity: "124%", discipline: "95%" },
  { rank: 3, name: "Siti Rahayu", role: "Head of Human Capital", overallScore: 91, status: "Excellent", topArea: "Spiritual Growth", ptpProgress: 88, productivity: "128%", discipline: "92%" },
  { rank: 4, name: "Rizky Pratama", role: "IT & Digital Transformation Lead", overallScore: 89, status: "Excellent", topArea: "Personal Development", ptpProgress: 86, productivity: "135%", discipline: "91%" },
  { rank: 5, name: "Budi Santoso", role: "General Manager Supply Chain", overallScore: 87, status: "Very Good", topArea: "Professional Impact", ptpProgress: 84, productivity: "126%", discipline: "88%" },
  { rank: 6, name: "Hendra Wijaya", role: "GM Sales & Marketing", overallScore: 86, status: "Very Good", topArea: "Leadership Excellence", ptpProgress: 85, productivity: "122%", discipline: "90%" },
  { rank: 7, name: "Maya Indah", role: "Corporate Secretary", overallScore: 86, status: "Very Good", topArea: "Relationship & Community", ptpProgress: 83, productivity: "120%", discipline: "89%" },
  { rank: 8, name: "Irfan Hakim", role: "Quality Assurance Manager", overallScore: 85, status: "Very Good", topArea: "Professional Impact", ptpProgress: 82, productivity: "118%", discipline: "87%" },
  { rank: 9, name: "Rina Kurnia", role: "Plant Manager Subang", overallScore: 85, status: "Very Good", topArea: "Leadership Excellence", ptpProgress: 81, productivity: "125%", discipline: "86%" },
  { rank: 10, name: "Eko Prasetyo", role: "Head of Risk Management", overallScore: 84, status: "Very Good", topArea: "Spiritual Growth", ptpProgress: 80, productivity: "115%", discipline: "88%" },
  { rank: 11, name: "Linda Kusuma", role: "Treasury Manager", overallScore: 84, status: "Very Good", topArea: "Personal Development", ptpProgress: 80, productivity: "116%", discipline: "85%" },
  { rank: 12, name: "Fajar Hidayat", role: "Procurement Lead", overallScore: 83, status: "Very Good", topArea: "Professional Impact", ptpProgress: 79, productivity: "114%", discipline: "84%" },
  { rank: 13, name: "Dian Permata", role: "Internal Audit Manager", overallScore: 83, status: "Very Good", topArea: "Spiritual Growth", ptpProgress: 78, productivity: "112%", discipline: "86%" },
  { rank: 14, name: "Bambang Tri", role: "Regional Branch Manager", overallScore: 82, status: "Good", topArea: "Leadership Excellence", ptpProgress: 77, productivity: "110%", discipline: "82%" },
  { rank: 15, name: "Nina Kartika", role: "Talent Acquisition Manager", overallScore: 82, status: "Good", topArea: "Relationship & Community", ptpProgress: 76, productivity: "111%", discipline: "83%" },
  { rank: 16, name: "Yudi Suhendra", role: "Safety & EHS Manager", overallScore: 81, status: "Good", topArea: "Personal Development", ptpProgress: 75, productivity: "108%", discipline: "81%" },
  { rank: 17, name: "Anita Sari", role: "Learning & Development Lead", overallScore: 81, status: "Good", topArea: "Spiritual Growth", ptpProgress: 75, productivity: "109%", discipline: "82%" },
  { rank: 18, name: "Agus Setiawan", role: "Warehouse & Inventory Manager", overallScore: 80, status: "Good", topArea: "Professional Impact", ptpProgress: 74, productivity: "107%", discipline: "80%" },
  { rank: 19, name: "Tari Wulandari", role: "Corporate Communication Lead", overallScore: 80, status: "Good", topArea: "Relationship & Community", ptpProgress: 73, productivity: "106%", discipline: "80%" },
  { rank: 20, name: "Farhan Abdullah", role: "Legal & Compliance Lead", overallScore: 79, status: "Good", topArea: "Spiritual Growth", ptpProgress: 72, productivity: "105%", discipline: "79%" },
  { rank: 21, name: "Sri Wahyuni", role: "Accounting Manager", overallScore: 79, status: "Good", topArea: "Personal Development", ptpProgress: 71, productivity: "104%", discipline: "78%" },
  { rank: 22, name: "Dedi Suryadi", role: "Facilities & Asset Manager", overallScore: 78, status: "Good", topArea: "Professional Impact", ptpProgress: 70, productivity: "102%", discipline: "77%" },
  { rank: 23, name: "Fitri Handayani", role: "CSR Program Specialist", overallScore: 78, status: "Good", topArea: "Relationship & Community", ptpProgress: 70, productivity: "103%", discipline: "78%" },
  { rank: 24, name: "Lukman Nurhakim", role: "Maintenance Operations Lead", overallScore: 78, status: "Good", topArea: "Leadership Excellence", ptpProgress: 69, productivity: "101%", discipline: "76%" },
  { rank: 25, name: "Ratna Dewi", role: "IT Infrastructure Manager", overallScore: 77, status: "Good", topArea: "Personal Development", ptpProgress: 68, productivity: "100%", discipline: "75%" },
];

export const DEMO_AREA_GROWTH = [
  { area: "Leadership Excellence", before: 55, after: 91, delta: 36 },
  { area: "Spiritual Growth", before: 62, after: 94, delta: 32 },
  { area: "Personal Development", before: 58, after: 88, delta: 30 },
  { area: "Professional Impact", before: 64, after: 92, delta: 28 },
  { area: "Relationship & Community", before: 60, after: 86, delta: 26 },
];
