export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Stage 4 Bootstrap
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-950">
            Work & Learning Planner
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
            The application shell is ready. Next steps will add planning domain
            rules, a Vikunja task provider, weekly planning, and review flows.
          </p>
        </div>
      </section>
    </main>
  );
}
