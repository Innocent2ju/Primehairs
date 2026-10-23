import Image from "next/image";
import { wigs } from "@/lib/constants";

const Page = () => {
  return (
    <section>
      <h1 className="text-center">The Online Store for Hair Wigs & Bundles</h1>
      <p className="text-center mt-5">
        Human hairs, extension bundles, wigs and hair products in one place!
      </p>

      <div className="mt-20 space-y-7">
        <h3>Featured Products</h3>

        <div className="products-grid">
          {wigs.map((wig) => (
            <div key={wig.id} id="product-card">
              <Image
                src={wig.image}
                alt={wig.name}
                width={400}
                height={300}
                className="poster"
              />
              <h4 className="title">{wig.name}</h4>
              <p>{wig.category}</p>
              <div className="price-stock">
                <span className="text-gold font-semibold">
                  ${wig.price.toFixed(2)}
                </span>
                <span className="pill">
                  {wig.inStock ? "In Stock" : "Sold Out"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Page;
