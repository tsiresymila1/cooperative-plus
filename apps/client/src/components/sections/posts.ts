/** Blog index parsed from the source listing DOM. */
export type Post = {
  slug: string;
  title: string;
  img: string;
  cat: string;
  catHref: string;
  date: string;
  comments: number;
  excerpt: string;
};

export const BLOG_POSTS: Post[] = [
  {
    "slug": "/the-art-of-slow-travel-and-why-taking-the-bus-is-making-a-comeback",
    "title": "The Art of Slow Travel and Why Taking the Bus Is Making a Comeback",
    "img": "/wp-content/uploads/2025/02/blog_01.jpg",
    "cat": "Bus travel",
    "catHref": "/category/bus-travel",
    "date": "October 14, 2024",
    "comments": 0,
    "excerpt": "…"
  },
  {
    "slug": "/why-the-road-less-traveled-often-begins-with-a-bus-ticket",
    "title": "Why the Road Less Traveled Often Begins with a Bus Ticket",
    "img": "/wp-content/uploads/2025/02/blog_02.jpg",
    "cat": "Booking",
    "catHref": "/category/booking",
    "date": "September 10, 2024",
    "comments": 1,
    "excerpt": "…"
  },
  {
    "slug": "/beyond-the-destination-the-hidden-beauty-of-bus-journeys",
    "title": "Beyond the Destination: The Hidden Beauty of Bus Journeys",
    "img": "/wp-content/uploads/2025/02/blog_03.jpg",
    "cat": "Charters",
    "catHref": "/category/charters",
    "date": "September 10, 2024",
    "comments": 0,
    "excerpt": "…"
  },
  {
    "slug": "/what-you-learn-about-life-on-a-12-hour-bus-ride",
    "title": "What You Learn About Life on a 12-Hour Bus Ride",
    "img": "/wp-content/uploads/2025/02/blog_04.jpg",
    "cat": "Online",
    "catHref": "/category/online",
    "date": "August 5, 2024",
    "comments": 1,
    "excerpt": "…"
  },
  {
    "slug": "/how-charter-buses-bring-weddings-teams-and-tours-to-life",
    "title": "How Charter Buses Bring Weddings Teams and Tours to Life",
    "img": "/wp-content/uploads/2025/02/blog_05.jpg",
    "cat": "Bus travel",
    "catHref": "/category/bus-travel",
    "date": "July 7, 2024",
    "comments": 2,
    "excerpt": "…"
  },
  {
    "slug": "/the-unsung-heroes-of-group-trips-are-charter-buses",
    "title": "The Unsung Heroes of Group Trips Are Charter Buses",
    "img": "",
    "cat": "Comfort",
    "catHref": "/category/comfort",
    "date": "June 4, 2024",
    "comments": 0,
    "excerpt": "…"
  },
  {
    "slug": "/making-every-group-trip-feel-like-an-adventure-with-a-charter-bus",
    "title": "Making Every Group Trip Feel Like an Adventure with a Charter Bus",
    "img": "/wp-content/uploads/2025/02/blog_06.jpg",
    "cat": "Comfort",
    "catHref": "/category/comfort",
    "date": "May 19, 2024",
    "comments": 0,
    "excerpt": "…"
  },
  {
    "slug": "/charter-buses-as-the-smart-and-sustainable-choice-for-travel",
    "title": "Charter Buses as the Smart and Sustainable Choice for Travel",
    "img": "/wp-content/uploads/2025/02/blog_07.jpg",
    "cat": "Booking",
    "catHref": "/category/booking",
    "date": "May 12, 2024",
    "comments": 3,
    "excerpt": "…"
  },
  {
    "slug": "/bus-tours-that-will-change-the-way-you-see-the-world",
    "title": "Bus Tours That Will Change the Way You See the World",
    "img": "/wp-content/uploads/2025/02/blog_08.jpg",
    "cat": "Booking",
    "catHref": "/category/booking",
    "date": "April 12, 2024",
    "comments": 1,
    "excerpt": "…"
  },
  {
    "slug": "/the-educational-power-of-riding-through-history-on-a-bus-tour",
    "title": "The Educational Power of Riding Through History on a Bus Tour",
    "img": "",
    "cat": "Booking",
    "catHref": "/category/booking",
    "date": "March 12, 2024",
    "comments": 2,
    "excerpt": "…"
  },
  {
    "slug": "/breathtaking-bus-tours-from-vineyards-to-volcanoes",
    "title": "Breathtaking Bus Tours from Vineyards to Volcanoes",
    "img": "/wp-content/uploads/2025/02/blog_09.jpg",
    "cat": "Booking",
    "catHref": "/category/booking",
    "date": "February 12, 2024",
    "comments": 0,
    "excerpt": "…"
  }
];
