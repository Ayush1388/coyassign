import { AppHeader } from "@/components/nav/app-header";

/** Placeholder for Coy's existing experience. Intentionally blank, per the brief. */
export default function HomePage() {
  return (
    <>
      <AppHeader />
      <section aria-label="Home" className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-muted">Home: Coy&apos;s existing experience lives here.</p>
      </section>
    </>
  );
}
