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
  "Free WiFi",
  "TV Zone",
  "Hot Drinks",
  "Restroom",
  "Sockets",
  "Climate Control",
];

export const COUNTERS = [
  { value: 95, label: "Comfortable buses" },
  { value: 32, label: "European countries" },
  { value: 120, label: "Intercity routes" },
  { value: 67, label: "Routes per day" },
];

/* The source renders the current Mon-Sun week with today's tab labelled
   "TODAY" — the scrape caught 31 AUG / 01 SEP / TODAY / 03 SEP on 2 Sep.
   Hardcoding those dates made the clone drift from the source by a whole
   section every day, so they are computed instead. */
export type ScheduleDay = { day: string; date: string; today?: boolean };

export function scheduleDays(now: Date = new Date()): ScheduleDay[] {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monday = new Date(now);
  // getDay(): 0 = Sunday, so shift back to the Monday of this week
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return DAYS.map((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? { day: "Today", date: "", today: true }
      : { day, date: `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}` };
  });
}

export const SCHEDULE_ROWS = [
  { from: "Kaunas", depart: "10:00", duration: "9h 43m", to: "Brno", arrive: "19:43", price: 117, seats: 42 },
  { from: "Berlin", depart: "08:00", duration: "8h 1m", to: "Kaunas", arrive: "16:01", price: 42, seats: 40 },
  { from: "Bratislava", depart: "05:00", duration: "10h 42m", to: "Porto", arrive: "15:42", price: 73, seats: 39 },
  { from: "Vienna", depart: "08:00", duration: "9h 38m", to: "Munich", arrive: "17:38", price: 76, seats: 20 },
  { from: "Antwerp", depart: "17:00", duration: "10h 54m", to: "Porto", arrive: "03:54", price: 22, seats: 38 },
  { from: "Lisbon", depart: "05:00", duration: "9h 33m", to: "Madrid", arrive: "14:33", price: 26, seats: 49 },
  { from: "Istanbul", depart: "07:00", duration: "7h 52m", to: "Brno", arrive: "14:52", price: 65, seats: 37 },
  { from: "Zagreb", depart: "19:30", duration: "2h 58m", to: "Split", arrive: "22:28", price: 78, seats: 36 },
];

export const FAQS = [
  "Can I book a ticket online?",
  "Does the bus make stops along the way?",
  "Are there discounts for children, seniors, and students?",
  "How can I return or exchange a ticket?",
  "Do the buses have Wi-Fi and charging ports?",
];

export const TESTIMONIALS = [
  {
    author: "Stefanie Rashford",
    avatar: "/wp-content/uploads/2024/12/testimonials_01-140x140.jpg",
    quote:
      "Absolutely delightful! The sushi here is always fresh and beautifully presented, with a fantastic variety of rolls and sashimi to choose from. The atmosphere is warm and inviting, and the",
  },
  {
    author: "Patric Stone",
    avatar: "/wp-content/uploads/2024/12/testimonials_02-140x140.jpg",
    quote:
      "Service was exceptional, and it's clear that you have a genuine passion for what you do. The attention to detail and willingness to personalize the experience made it truly memorable.",
  },
  {
    author: "Hugo James",
    avatar: "/wp-content/uploads/2024/12/testimonials_03-140x140.jpg",
    quote:
      "The work done was outstanding! The dedication and hard work put into it were evident and greatly appreciated. The level of skill and expertise demonstrated was truly impressive, and it",
  },
  {
    author: "Cassie Carleton",
    avatar: "/wp-content/uploads/2024/12/testimonials_04-480x480.jpg",
    quote:
      "The product delivered exceeded expectations! The attention to detail and commitment to quality were evident in every aspect. The level of customer service provided was also exceptional and greatly appreciated.",
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
