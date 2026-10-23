import Navbar from "../components/Navbar";

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">All Products</h1>
        <p className="text-gray-500">Products will appear here.</p>
      </main>
    </>
  );
}
