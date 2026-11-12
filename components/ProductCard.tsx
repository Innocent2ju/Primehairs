import Link from "next/link";
import type { Wig } from "@/lib/constants";

interface ProductCardProps {
  product: Wig;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link href={`/products/${product.slug}`} id="product-card">
      <img src={product.image} alt={product.name} className="poster" />
      <h3 className="title">{product.name}</h3>
      <p>{product.category}</p>
      <div className="price-stock">
        <p>${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
};

export default ProductCard;