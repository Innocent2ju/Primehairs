export interface Wig {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

export const wigs: Wig[] = [
  {
    id: 1,
    name: "Brazilian Body Wave Wig",
    price: 189.99,
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    category: "Body Wave",
    inStock: true,
  },
  {
    id: 2,
    name: "Deep Curly Lace Front",
    price: 249.99,
    image:
      "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=600&q=80",
    category: "Curly",
    inStock: true,
  },
  {
    id: 3,
    name: "Straight Silk Closure Wig",
    price: 159.99,
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80",
    category: "Straight",
    inStock: true,
  },
  {
    id: 4,
    name: "Kinky Curly Full Lace",
    price: 299.99,
    image:
      "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=600&q=80",
    category: "Curly",
    inStock: false,
  },
  {
    id: 5,
    name: "Loose Wave HD Lace Wig",
    price: 219.99,
    image:
      "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80",
    category: "Loose Wave",
    inStock: true,
  },
  {
    id: 6,
    name: "Water Wave Bob Wig",
    price: 139.99,
    image:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
    category: "Bob",
    inStock: true,
  },
  {
    id: 7,
    name: "Honey Blonde Highlight Wig",
    price: 269.99,
    image:
      "https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=600&q=80",
    category: "Colored",
    inStock: true,
  },
  {
    id: 8,
    name: "Natural Afro Textured Wig",
    price: 199.99,
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    category: "Afro",
    inStock: true,
  },
];
