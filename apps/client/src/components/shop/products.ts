/** Shop products parsed from the source WooCommerce loop. */
export type Product = { id: number; title: string; img: string; price: number; old: number | null; rating: number };

export const PRODUCTS: Product[] = [
  {
    "id": 1,
    "title": "Energy Drink X",
    "img": "/wp-content/uploads/2025/05/shop_10-480x480.jpg",
    "rating": 4,
    "price": 69,
    "old": 79
  },
  {
    "id": 2,
    "title": "Hair Dryer",
    "img": "/wp-content/uploads/2025/05/shop_04-480x480.jpg",
    "rating": 5,
    "price": 54,
    "old": null
  },
  {
    "id": 3,
    "title": "Batteries pack",
    "img": "/wp-content/uploads/2025/05/shop_03-480x480.jpg",
    "rating": 4,
    "price": 29,
    "old": null
  },
  {
    "id": 4,
    "title": "Chocolate Ice Cream",
    "img": "/wp-content/uploads/2025/05/shop_05-480x480.jpg",
    "rating": 5,
    "price": 14,
    "old": null
  },
  {
    "id": 5,
    "title": "Meat Snacks",
    "img": "/wp-content/uploads/2025/05/shop_06-480x480.jpg",
    "rating": 4,
    "price": 19,
    "old": null
  },
  {
    "id": 6,
    "title": "Sun Glasses",
    "img": "/wp-content/uploads/2025/05/shop_13-480x480.jpg",
    "rating": 5,
    "price": 49,
    "old": null
  }
];
