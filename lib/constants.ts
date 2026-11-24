export interface AttributePricingRule {
  hairLength?: string;
  laceType?: string;
  density?: string;
  color?: string;
  price: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  variants: string[];
  hairType: string[];
  hairTexture: string[];
  density: string[];
  colors: string[];
  hairLength: string[];
  laceType: string[];
  closureSizes: string[];
  tags: string[];
  basePrice: number;
  attributePricing: AttributePricingRule[];
  inStock: boolean;
  stock: number;
}

export const wigs: Product[] = [
  {
    id: 1,
    title: "Brazilian Body Wave Wig",
    slug: "brazilian-body-wave-wig",
    description: "Crafted from 100% virgin Brazilian human hair, this body wave wig delivers natural-looking volume and a soft, silky texture. The pre-plucked hairline and bleached knots create an undetectable finish that blends seamlessly with your scalp.",
    overview: "Sleek, voluminous body wave texture with transparent HD lace for a seamless melt.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    ],
    hairType: ["Human Hair", "Virgin Hair"],
    hairTexture: ["Body Wave"],
    density: ["150%", "180%"],
    colors: ["Natural Black", "Dark Brown"],
    hairLength: ["10 inches", "14 inches", "18 inches", "24 inches"],
    laceType: ["Frontal Lace"],
    closureSizes: ["13x4", "13x6"],
    tags: ["best-seller", "body-wave", "human-hair"],
    basePrice: 45000,
    attributePricing: [
      { hairLength: "10 inches", price: 45000 },
      { hairLength: "14 inches", price: 65000 },
      { hairLength: "18 inches", price: 85000 },
      { hairLength: "24 inches", price: 110000 },
    ],
    inStock: true,
    stock: 14,
  },
  {
    id: 2,
    title: "Deep Curly Lace Front",
    slug: "deep-curly-lace-front",
    description: "Defined, bouncy curls with lasting moisture retention — this deep curly lace front is made from premium virgin human hair that springs back to its natural pattern after every wash.",
    overview: "Bouncy, moisture-rich deep curls with HD lace front construction.",
    image: "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1595959183082-7b570b7e1e6b?w=600&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Deep Curly"],
    density: ["180%", "200%"],
    colors: ["Natural Black"],
    hairLength: ["12 inches", "16 inches", "20 inches"],
    laceType: ["Frontal Lace"],
    closureSizes: ["13x4"],
    tags: ["curly", "trending"],
    basePrice: 55000,
    attributePricing: [
      { hairLength: "12 inches", price: 55000 },
      { hairLength: "16 inches", price: 75000 },
      { hairLength: "20 inches", price: 95000 },
    ],
    inStock: true,
    stock: 7,
  },
  {
    id: 3,
    title: "Straight Silk Closure Wig",
    slug: "straight-silk-closure-wig",
    description: "Sleek, polished, and effortlessly chic, this straight silk closure wig features a 4×4 silk base closure that mimics the appearance of a real scalp.",
    overview: "Bone straight texture with an ultra-realistic silk closure base.",
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Bone Straight"],
    density: ["150%", "180%"],
    colors: ["Natural Black", "Jet Black"],
    hairLength: ["10 inches", "14 inches", "18 inches"],
    laceType: ["Closure Lace"],
    closureSizes: ["4x4", "5x5"],
    tags: ["straight", "closure", "classic"],
    basePrice: 40000,
    attributePricing: [
      { hairLength: "10 inches", price: 40000 },
      { hairLength: "14 inches", price: 58000 },
      { hairLength: "18 inches", price: 75000 },
    ],
    inStock: true,
    stock: 22,
  },
  {
    id: 4,
    title: "Kinky Curly Full Lace",
    slug: "kinky-curly-full-lace",
    description: "Embrace your natural texture with this kinky curly full lace wig, hand-tied strand by strand onto a breathable Swiss lace cap for maximum styling versatility.",
    overview: "4C texture full lace wig allowing versatile parting and ponytails.",
    image: "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Kinky Curly"],
    density: ["180%"],
    colors: ["Natural Black"],
    hairLength: ["14 inches", "18 inches"],
    laceType: ["Full Lace"],
    closureSizes: [],
    tags: ["kinky-curly", "full-lace"],
    basePrice: 65000,
    attributePricing: [
      { hairLength: "14 inches", price: 65000 },
      { hairLength: "18 inches", price: 90000 },
    ],
    inStock: false,
    stock: 0,
  },
  {
    id: 5,
    title: "Loose Wave HD Lace Wig",
    slug: "loose-wave-hd-lace-wig",
    description: "Effortless beach waves with a touch of glamour — this loose wave HD lace wig uses ultra-thin high-definition lace that disappears against any skin tone.",
    overview: "Airy loose wave pattern with invisible HD lace melt.",
    image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Loose Wave"],
    density: ["180%"],
    colors: ["Natural Black"],
    hairLength: ["16 inches", "20 inches", "24 inches"],
    laceType: ["Frontal Lace"],
    closureSizes: ["13x4"],
    tags: ["loose-wave", "hd-lace"],
    basePrice: 50000,
    attributePricing: [
      { hairLength: "16 inches", price: 50000 },
      { hairLength: "20 inches", price: 72000 },
      { hairLength: "24 inches", price: 98000 },
    ],
    inStock: true,
    stock: 9,
  },
  {
    id: 6,
    title: "Water Wave Bob Wig",
    slug: "water-wave-bob-wig",
    description: "A chic, shoulder-length bob with a rippling water wave texture that adds movement and dimension to every look.",
    overview: "Short, bouncy water wave bob with 13x4 lace front.",
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Water Wave"],
    density: ["150%"],
    colors: ["Natural Black"],
    hairLength: ["10 inches", "12 inches"],
    laceType: ["Frontal Lace"],
    closureSizes: ["13x4"],
    tags: ["bob", "water-wave"],
    basePrice: 35000,
    attributePricing: [
      { hairLength: "10 inches", price: 35000 },
      { hairLength: "12 inches", price: 42000 },
    ],
    inStock: true,
    stock: 18,
  },
  {
    id: 7,
    title: "Honey Blonde Highlight Wig",
    slug: "honey-blonde-highlight-wig",
    description: "Sun-kissed honey blonde highlights weave through a natural dark brown base, giving this wig a dimensional, salon-fresh look straight out of the box.",
    overview: "Pre-colored honey blonde highlights on premium human hair.",
    image: "https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Straight"],
    density: ["180%"],
    colors: ["Honey Blonde", "Dark Brown"],
    hairLength: ["14 inches", "18 inches"],
    laceType: ["Frontal Lace"],
    closureSizes: ["13x4"],
    tags: ["colored", "highlights", "blonde"],
    basePrice: 60000,
    attributePricing: [
      { hairLength: "14 inches", price: 60000 },
      { hairLength: "18 inches", price: 82000 },
    ],
    inStock: true,
    stock: 5,
  },
  {
    id: 8,
    title: "Natural Afro Textured Wig",
    slug: "natural-afro-textured-wig",
    description: "A celebration of natural hair in its fullest form, this afro textured wig is coily, voluminous, and completely unapologetic.",
    overview: "Voluminous 4C afro textured coil wig designed for easy maintenance.",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    variants: [
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    ],
    hairType: ["Human Hair"],
    hairTexture: ["Afro Kinky"],
    density: ["180%"],
    colors: ["Natural Black"],
    hairLength: ["10 inches", "14 inches"],
    laceType: ["Closure Lace"],
    closureSizes: ["4x4"],
    tags: ["afro", "natural-texture"],
    basePrice: 42000,
    attributePricing: [
      { hairLength: "10 inches", price: 42000 },
      { hairLength: "14 inches", price: 56000 },
    ],
    inStock: true,
    stock: 11,
  },
];