/** Copy and option lists lifted verbatim from the source page. */

export const CITIES = [
  "Amsterdam",
  "Ankara",
  "Antwerp",
  "Barcelona",
  "Berlin",
  "Bratislava",
  "Brno",
  "Brussels",
  "Bucharest",
  "Budapest",
  "Debrecen",
  "Geneva",
  "Istanbul",
  "Kaunas",
  "Kosice",
  "Kyiv",
  "Lisbon",
  "Lviv",
  "Lyon",
  "Madrid",
  "Milan",
  "Munich",
  "Napoca",
  "Paris",
  "Plovdiv",
  "Porto",
  "Prague",
  "Rome",
  "Rotterdam",
  "Salzburg",
  "Sofia",
  "Split",
  "Vienna",
  "Vilnius",
  "Zagreb",
  "Zurich",
];

export const PASSENGERS = [
  "1 adult",
  "2 adults",
  "3 adults",
  "4 adults",
  "5 adults",
  "6 adults",
  "7 adults",
  "8 adults",
];

/** Flag sprites ship with the theme as 4x3 SVGs keyed by ISO country code. */
export const FLAG = (cc: string) =>
  `/wp-content/plugins/lte-ext/assets/flags/4x3/${cc}.svg`;

export const DESTINATIONS = [
  { name: "Vilnius", cc: "lt", to: 736, img: "/wp-content/uploads/2025/02/05_budapest-365x430.jpg" },
  { name: "Zagreb", cc: "hr", to: 727, img: "/wp-content/uploads/2025/02/02_rome-365x430.jpg" },
  { name: "Zurich", cc: "ch", to: 747, img: "/wp-content/uploads/2025/02/03_prague-365x430.jpg" },
  { name: "Madrid", cc: "es", to: 746, img: "/wp-content/uploads/2025/02/06_warszawa-365x430.jpg" },
];

/** Country strip — codes and `?to=` ids read off the source anchors. */
export const COUNTRIES = [
  { name: "Austria", cc: "at", to: 722 },
  { name: "Belgium", cc: "be", to: 724 },
  { name: "Bulgaria", cc: "bg", to: 726 },
  { name: "Croatia", cc: "hr", to: 728 },
  { name: "Czech Republic", cc: "cz", to: 730 },
  { name: "France", cc: "fr", to: 731 },
  { name: "Germany", cc: "de", to: 717 },
  { name: "Hungary", cc: "hu", to: 733 },
  { name: "Italy", cc: "it", to: 735 },
  { name: "Lithuania", cc: "lt", to: 737 },
  { name: "Netherlands", cc: "nl", to: 738 },
  { name: "Portugal", cc: "pt", to: 740 },
  { name: "Romania", cc: "ro", to: 742 },
  { name: "Slovakia", cc: "sk", to: 744 },
  { name: "Spain", cc: "es", to: 693 },
  { name: "Switzerland", cc: "ch", to: 748 },
  { name: "Turkey", cc: "tr", to: 749 },
  { name: "Ukraine", cc: "ua", to: 719 },
];

export const BENEFITS = [
  "Wi-Fi gratuit",
  "Écran vidéo",
  "Boissons chaudes",
  "Sanitaires",
  "Prises USB",
  "Climatisation",
];

export const COUNTERS = [
  { value: 95, label: "Véhicules confortables" },
  { value: 32, label: "Villes desservies" },
  { value: 120, label: "Lignes interurbaines" },
  { value: 67, label: "Départs par jour" },
];

/* The source renders the current Mon-Sun week with today's tab labelled
   "TODAY" — the scrape caught 31 AUG / 01 SEP / TODAY / 03 SEP on 2 Sep.
   Hardcoding those dates made the clone drift from the source by a whole
   section every day, so they are computed instead. */
export type ScheduleDay = { day: string; date: string; today?: boolean };

export function scheduleDays(now: Date = new Date()): ScheduleDay[] {
  const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const MONTHS = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
  const monday = new Date(now);
  // getDay(): 0 = Sunday, so shift back to the Monday of this week
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return DAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? { day: "Aujourd'hui", date: "", today: true }
      : { day, date: `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}` };
  });
}

export const SCHEDULE_ROWS = [
  { from: "Antananarivo", depart: "06:00", duration: "10h 30m", to: "Mahajanga", arrive: "16:30", price: 55000, seats: 18 },
  { from: "Antananarivo", depart: "07:00", duration: "7h 15m", to: "Toamasina", arrive: "14:15", price: 35000, seats: 22 },
  { from: "Fianarantsoa", depart: "05:30", duration: "11h 20m", to: "Toliara", arrive: "16:50", price: 50000, seats: 15 },
  { from: "Antananarivo", depart: "08:00", duration: "3h 10m", to: "Antsirabe", arrive: "11:10", price: 15000, seats: 20 },
  { from: "Antananarivo", depart: "18:00", duration: "9h 00m", to: "Fianarantsoa", arrive: "03:00", price: 40000, seats: 12 },
  { from: "Toamasina", depart: "07:30", duration: "7h 15m", to: "Antananarivo", arrive: "14:45", price: 35000, seats: 25 },
  { from: "Mahajanga", depart: "06:30", duration: "10h 30m", to: "Antananarivo", arrive: "17:00", price: 55000, seats: 16 },
  { from: "Antananarivo", depart: "16:00", duration: "18h 00m", to: "Toliara", arrive: "10:00", price: 90000, seats: 10 },
];

export const FAQS = [
  "Puis-je réserver un billet en ligne ?",
  "Le taxi-brousse fait-il des arrêts en cours de route ?",
  "Existe-t-il des réductions pour les enfants, les seniors et les étudiants ?",
  "Comment annuler ou modifier un billet ?",
  "Les véhicules proposent-ils des prises de recharge à bord ?",
];

export const TESTIMONIALS = [
  {
    author: "Hanta Rakotonirina",
    avatar: "/wp-content/uploads/2024/12/testimonials_01-140x140.jpg?v=2",
    quote:
      "Réservation en ligne très simple et j'ai pu choisir ma place à l'avance. Le taxi-brousse est parti à l'heure et le trajet Antananarivo–Toamasina s'est très bien passé.",
  },
  {
    author: "Tiana Andrianina",
    avatar: "/wp-content/uploads/2024/12/testimonials_02-140x140.jpg?v=2",
    quote:
      "Enfin une façon fiable de réserver un taxi-brousse ! Plus besoin de faire la queue à la gare. J'ai payé par Mobile Money et reçu mon billet avec QR code aussitôt.",
  },
  {
    author: "Miora Razafy",
    avatar: "/wp-content/uploads/2024/12/testimonials_03-140x140.jpg?v=2",
    quote:
      "Chauffeur expérimenté, véhicule propre et confortable pour aller à Fianarantsoa. Les tarifs sont clairs, affichés à l'avance. Je recommande Coopérative Plus.",
  },
  {
    author: "Fanja Ratsimba",
    avatar: "/wp-content/uploads/2024/12/testimonials_04-480x480.jpg?v=2",
    quote:
      "Service au top pour mon trajet vers Mahajanga. Départs réguliers et personnel à l'écoute. La réservation depuis le téléphone m'a fait gagner beaucoup de temps.",
  },
];

export const POSTS = [
  {
    category: "Bus travel",
    date: "October 14, 2024",
    comments: 0,
    title: "The art of slow travel and why taking the bus is making a comeback",
    href: "/the-art-of-slow-travel-and-why-taking-the-bus-is-making-a-comeback",
    img: "/wp-content/uploads/2025/02/blog_01-500x347.jpg",
  },
  {
    category: "Booking",
    date: "September 10, 2024",
    comments: 1,
    title: "Why the road less traveled often begins with a bus ticket",
    href: "/why-the-road-less-traveled-often-begins-with-a-bus-ticket",
    img: "/wp-content/uploads/2025/02/blog_02-500x347.jpg",
  },
  {
    category: "Charters",
    date: "September 10, 2024",
    comments: 0,
    title: "Beyond the destination: the hidden beauty of bus journeys",
    href: "/beyond-the-destination-the-hidden-beauty-of-bus-journeys",
    img: "/wp-content/uploads/2025/02/blog_03-500x347.jpg",
  },
];
