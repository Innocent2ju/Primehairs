import { wigs } from "@/lib/constants";
import ProductCard from "@/app/components/ProductCard";
import TestBtn from "./components/testbtn";

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
            <ProductCard key={wig.id} wig={wig} />
          ))}

          <TestBtn />
        </div>
      </div>
    </section>
  );
};

export default Page;
