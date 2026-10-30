export interface Wig {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  description: string;
  stock: number;
}

export const wigs: Wig[] = [
  {
    id: 1,
    name: "Brazilian Body Wave Wig",
    slug: "brazilian-body-wave-wig",
    price: 189.99,
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    category: "Body Wave",
    inStock: true,
    stock: 14,
    description:
      "Crafted from 100% virgin Brazilian human hair, this body wave wig delivers natural-looking volume and a soft, silky texture. The pre-plucked hairline and bleached knots create an undetectable finish that blends seamlessly with your scalp. Lightly tangle-free and shed-free, it holds curls beautifully and can be washed, dyed, and heat-styled to suit your look.",
  },
  {
    id: 2,
    name: "Deep Curly Lace Front",
    slug: "deep-curly-lace-front",
    price: 249.99,
    image:
      "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=600&q=80",
    category: "Curly",
    inStock: true,
    stock: 7,
    description:
      "Defined, bouncy curls with lasting moisture retention — this deep curly lace front is made from premium virgin human hair that springs back to its natural pattern after every wash. The HD transparent lace front gives you a realistic scalp simulation across the hairline, while the adjustable straps and combs inside the cap ensure a secure, all-day fit.",
  },
  {
    id: 3,
    name: "Straight Silk Closure Wig",
    slug: "straight-silk-closure-wig",
    price: 159.99,
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80",
    category: "Straight",
    inStock: true,
    stock: 22,
    description:
      "Sleek, polished, and effortlessly chic, this straight silk closure wig features a 4×4 silk base closure that mimics the appearance of a real scalp, making it virtually undetectable. The 100% human hair strands lie flat and smooth, resisting frizz in humidity while remaining easy to comb through. Perfect for a classic, sophisticated look.",
  },
  {
    id: 4,
    name: "Kinky Curly Full Lace",
    slug: "kinky-curly-full-lace",
    price: 299.99,
    image:
      "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=600&q=80",
    category: "Curly",
    inStock: false,
    stock: 0,
    description:
      "Embrace your natural texture with this kinky curly full lace wig, hand-tied strand by strand onto a breathable Swiss lace cap for maximum styling versatility. The full lace construction lets you part the hair anywhere — sides, middle, or pull it all up into a ponytail. Made from 100% unprocessed human hair that blends flawlessly with natural afro-textured hair.",
  },
  {
    id: 5,
    name: "Loose Wave HD Lace Wig",
    slug: "loose-wave-hd-lace-wig",
    price: 219.99,
    image:
      "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80",
    category: "Loose Wave",
    inStock: true,
    stock: 9,
    description:
      "Effortless beach waves with a touch of glamour — this loose wave HD lace wig uses ultra-thin high-definition lace that disappears against any skin tone, creating the illusion of hair growing directly from your scalp. The loose wave pattern is airy and full-bodied, holding its shape wash after wash without losing softness or volume.",
  },
  {
    id: 6,
    name: "Water Wave Bob Wig",
    slug: "water-wave-bob-wig",
    price: 139.99,
    image:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
    category: "Bob",
    inStock: true,
    stock: 18,
    description:
      "A chic, shoulder-length bob with a rippling water wave texture that adds movement and dimension to every look. This wig is constructed with a 13×4 lace front and a machine-weft body for a lightweight yet durable wear experience. The human hair blend is tangle-resistant and can be flat-ironed straight or enhanced with a diffuser for extra wave definition.",
  },
  {
    id: 7,
    name: "Honey Blonde Highlight Wig",
    slug: "honey-blonde-highlight-wig",
    price: 269.99,
    image:
      "https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=600&q=80",
    category: "Colored",
    inStock: true,
    stock: 5,
    description:
      "Sun-kissed honey blonde highlights weave through a natural dark brown base, giving this wig a dimensional, salon-fresh look straight out of the box. The pre-colored 100% human hair is treated with a nourishing process that keeps it soft, lustrous, and resistant to dryness. Pair with warm-toned makeup for a radiant, glowing look year-round.",
  },
  {
    id: 8,
    name: "Natural Afro Textured Wig",
    slug: "natural-afro-textured-wig",
    price: 199.99,
    image:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    category: "Afro",
    inStock: true,
    stock: 11,
    description:
      "A celebration of natural hair in its fullest form, this afro textured wig is coily, voluminous, and completely unapologetic. Made from high-quality human hair with a 4C curl pattern, it can be picked out for maximum volume, moisturized and defined for a twist-out effect, or styled with your favourite products just like your own hair. The lightweight cap design keeps airflow comfortable during long wear.",
  },
];
