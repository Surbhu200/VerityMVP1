import { getServerSession } from "next-auth";
import { AdminIngestionForm } from "@/components/admin-ingestion-form";
import { AdminProductList } from "@/components/admin-product-list";
import { AdminSignInForm } from "@/components/admin-sign-in-form";
import { Reveal } from "@/components/reveal";
import { authOptions, isAdminSession } from "@/lib/auth";
import { getAdminProducts } from "@/lib/products";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = isAdminSession(session);
  const products = isAdmin ? await getAdminProducts() : [];

  return (
    <main>
      <section className="premium-grid border-b border-ink/10">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Reveal>
            <p className="text-sm font-bold uppercase text-coral">Admin</p>
            <h1 className="mt-3 text-4xl font-black tracking-[0] sm:text-6xl">Product research operations.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-ink/72">
              Admin-only ingestion creates the product record immediately and queues research discovery. Paste a normal
              Amazon listing now; affiliate tracking can be added later.
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-ink/58">
              Operators can add products quickly while the heavier evidence workflow runs behind the scenes: product
              data, article discovery, AI curation, scoring, and publication readiness stay separated.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:px-8">
        <Reveal>{isAdmin ? <AdminIngestionForm /> : <AdminSignInForm />}</Reveal>
        <Reveal delay={0.1}>
          <aside className="glass-panel rounded-lg p-6">
            <p className="text-sm font-bold uppercase text-coral">Workflow state</p>
            <h2 className="mt-3 text-2xl font-black">Immediate response, background evidence work.</h2>
            <div className="mt-6 space-y-3">
              {["ASIN extraction", "Product data enrichment", "Research API aggregation", "AI evidence curation"].map(
                (item, index) => (
                  <div key={item} className="rounded-md border border-ink/10 bg-paper/70 p-3">
                    <p className="text-xs font-bold uppercase text-ink/42">Stage {index + 1}</p>
                    <p className="mt-1 font-semibold">{item}</p>
                  </div>
                )
              )}
            </div>
          </aside>
        </Reveal>
      </section>

      {isAdmin ? (
        <section className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
          <Reveal>
            <AdminProductList products={products} />
          </Reveal>
        </section>
      ) : null}
    </main>
  );
}
