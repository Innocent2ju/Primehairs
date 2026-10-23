export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <section>
      <h1 className="text-center">{slug.replace(/-/g, " ")}</h1>
    </section>
  );
}
