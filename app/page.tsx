import ProductCard from "@/components/ProductCard";
import { wigs } from "@/lib/constants";
import Link from "next/link";

const Page = () => {
    return (
       <section>
            <h1 className="text-center">The Online Store for Raw Hair Wigs & Bundles</h1>
            <p className="text-center mt-5">Human hairs, extension bundles, wigs and hair products in one place !</p>



      <div className="mt-20 space-y-7">
          <h3>Featured Products</h3>
          

        <div className="products-grid mt-10">
                {wigs.map((wig) => (
                    <ProductCard key={wig.id} product={wig} />
                ))}
            </div>
        </div>

        <Link href="/products">
            <p className="text-sm text-light-gray hover:text-gold transition-colors text-center">
              View all products
            </p>
          </Link>

            

       </section>
    )
}
export default Page