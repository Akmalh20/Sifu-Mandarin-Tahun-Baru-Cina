
import { Question, Platform } from './types';

export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 600;
export const PLAYER_SPEED = 6;
export const JUMP_FORCE = -18; // Meningkatkan daya lompatan dari -15 ke -18
export const GRAVITY = 0.8;

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Apakah warna 'tuah' yang paling popular dipakai semasa Tahun Baru Cina?",
    options: ["A) Biru", "B) Merah", "C) Hitam"],
    correctIndex: 1,
    explanation: "Dalam budaya Cina, warna merah melambangkan tenaga, kegembiraan, dan nasib baik. Ia juga dipercayai dapat menghalau nasib malang."
  },
  {
    id: 2,
    text: "Apakah nama sampul berisi wang yang diberikan oleh orang dewasa kepada kanak-kanak?",
    options: ["A) Angpao", "B) Beg duit", "C) Sampul surat"],
    correctIndex: 0,
    explanation: "Angpao ialah sampul merah yang mengandungi wang. Pemberian ini adalah simbol doa dan restu supaya kanak-kanak membesar dengan sihat."
  },
  {
    id: 3,
    text: "Berapa harikah perayaan Tahun Baru Cina disambut secara tradisinya?",
    options: ["A) 1 hari", "B) 5 hari", "C) 15 hari"],
    correctIndex: 2,
    explanation: "Perayaan ini disambut selama 15 hari berturut-turut. Hari ke-15 dikenali sebagai Chap Goh Mei."
  },
  {
    id: 4,
    text: "Haiwan ini sangat popular dalam tarian tradisi semasa Tahun Baru Cina. Haiwan apakah itu?",
    options: ["A) Gajah", "B) Singa (Tarian Singa)", "C) Kucing"],
    correctIndex: 1,
    explanation: "Tarian Singa dilakukan dengan iringan bunyi gendang. Ia dipercayai membawa tuah dan kemakmuran kepada tuan rumah."
  },
  {
    id: 5,
    text: "Buah ini berwarna oren dan melambangkan kekayaan. Buah apakah ini?",
    options: ["A) Epal", "B) Pisang", "C) Limau Mandarin"],
    correctIndex: 2,
    explanation: "Dalam bahasa Mandarin, perkataan untuk limau berbunyi hampir sama dengan perkataan 'emas'. Ia simbol kekayaan."
  },
  {
    id: 6,
    text: "Menurut legenda, raksasa 'Nian' takut kepada bunyi bising. Apakah yang digunakan untuk menakutkannya?",
    options: ["A) Mercun dan bunga api", "B) Muzik radio", "C) Bunyi tepukan tangan"],
    correctIndex: 0,
    explanation: "Penduduk mendapati Nian sangat takut dengan warna merah and bunyi bising, jadi mereka membakar mercun untuk menghalaunya."
  },
  {
    id: 7,
    text: "Aktiviti melambung campuran sayur-sayuran (salad) sambil mengucapkan kata-kata baik disebut sebagai...",
    options: ["A) Makan besar", "B) Yee Sang", "C) Rumah terbuka"],
    correctIndex: 1,
    explanation: "Yee Sang adalah salad ikan mentah dan sayur. Melambung bahan ini setinggi mungkin adalah simbol harapan untuk kejayaan tinggi."
  },
  {
    id: 8,
    text: "Zodiak Cina diwakili oleh berapa jenis haiwan?",
    options: ["A) 5 haiwan", "B) 10 haiwan", "C) 12 haiwan"],
    correctIndex: 2,
    explanation: "Zodiak Cina mempunyai kitaran 12 tahun, diwakili oleh 12 ekor haiwan seperti Tikus, Lembu, Harimau, dan lain-lain."
  },
  {
    id: 9,
    text: "Apakah hiasan merah yang selalu digantung di depan pintu rumah dan biasanya berbentuk bulat?",
    options: ["A) Belon", "B) Tanglung", "C) Bendera"],
    correctIndex: 1,
    explanation: "Tanglung merah melambangkan harapan untuk masa depan yang cerah dan penyatuan keluarga."
  },
  {
    id: 10,
    text: "\"Gong Xi Fa Cai\" adalah ucapan yang biasa didengar. Apakah maksud ringkasnya?",
    options: ["A) Selamat Hari Jadi", "B) Selamat Tahun Baru/Semoga Murah Rezeki", "C) Selamat Malam"],
    correctIndex: 1,
    explanation: "\"Gong Xi\" bermaksud tahniah, dan \"Fa Cai\" bermaksud mendapat kekayaan. Kita mendoakan kawan dimurahkan rezeki."
  }
];

export const INITIAL_PLATFORMS: Platform[] = [
  { x: 0, y: 500, width: 800, height: 100 },
  { x: 500, y: 380, width: 250, height: 30 }, 
  { x: 900, y: 450, width: 300, height: 150 },
  { x: 1050, y: 320, width: 200, height: 30 }, 
  { x: 1300, y: 400, width: 400, height: 200 },
  { x: 1500, y: 280, width: 150, height: 30 }, 
  { x: 1800, y: 480, width: 500, height: 120 },
  { x: 2100, y: 350, width: 200, height: 30 }, 
  { x: 2400, y: 420, width: 400, height: 180 },
  { x: 2650, y: 300, width: 200, height: 30 }, 
  { x: 3000, y: 450, width: 500, height: 150 },
  { x: 3300, y: 330, width: 200, height: 30 }, 
  { x: 3650, y: 450, width: 350, height: 150 }
];

export const NIAN_DATA = [
  { id: 1, x: 450, y: 450, range: 250, speed: 2 },
  { id: 2, x: 1350, y: 350, range: 250, speed: 3 },
  { id: 3, x: 1950, y: 430, range: 300, speed: 2.5 },
  { id: 4, x: 3100, y: 400, range: 350, speed: 3.5 },
];
