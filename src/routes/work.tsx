import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, ExternalLink } from "lucide-react";
import { BEHANCE, behanceProjects, moreProjects } from "@/components/portfolio-data";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "More Work — Sujith S Poojary" },
      { name: "description", content: "More product concepts and selected Behance projects by Sujith S Poojary." },
    ],
  }),
  component: WorkPage,
});

function WorkPage() {
  return (
    <main className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary">
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Back to portfolio
          </Link>
          <nav aria-label="Work page sections" className="flex items-center gap-4 text-sm font-semibold">
            <a href="#behance-work" className="transition-colors hover:text-primary">Behance</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pt-20">
        <p className="font-semibold text-primary">Selected work</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">More projects and Behance work</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          A closer look at more product concepts, alongside the projects published on Behance.
        </p>
      </section>

      <section id="more-projects" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">More Projects</h2>
            <p className="mt-2 text-muted-foreground">Selected work created during my time at CocoGrid.</p>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">{moreProjects.length} projects</span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {moreProjects.map((project) => (
            <a key={project.href} href={project.href} target="_blank" rel="noreferrer" className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className="font-display text-sm font-bold text-muted-foreground">{project.number}</span>
              <div aria-hidden="true" className="mt-4 h-1.5 w-14 rounded-full bg-foreground" />
              <h3 className="mt-8 font-display text-2xl font-bold leading-tight">{project.title}</h3>
              <p className="mt-1 font-display text-lg font-medium text-muted-foreground">{project.sub}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{project.detail}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-foreground/10 bg-background/50 px-3 py-1 text-xs font-semibold">{tag}</span>
                ))}
              </div>
              <span className="behance-hover-badge absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-black/45 text-white shadow-soft backdrop-blur-sm">
                <ExternalLink aria-hidden className="h-5 w-5 stroke-white" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="behance-work" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-semibold text-primary">Published projects</p>
            <h2 className="mt-1 font-display text-3xl font-bold md:text-4xl">On Behance</h2>
          </div>
          <a href={BEHANCE} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary">
            View Behance profile <ArrowUpRight aria-hidden className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {behanceProjects.map((project) => (
            <a
              key={project.href}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              onMouseMove={(event) => {
                if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width - 0.5;
                const y = (event.clientY - bounds.top) / bounds.height - 0.5;
                event.currentTarget.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
              }}
              onMouseLeave={(event) => { event.currentTarget.style.transform = ""; }}
              className="group relative overflow-hidden rounded-2xl border bg-card shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                <img src={project.image} alt={`${project.title} on Behance`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute right-3 top-3 inline-flex translate-x-[140%] items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-300 group-hover:translate-x-0 group-focus-visible:translate-x-0">View project <ArrowUpRight aria-hidden className="h-4 w-4" /></span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl font-bold">{project.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{project.sub}</p>
                <div className="mt-4 flex flex-wrap gap-2">{project.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{t}</span>)}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t px-6 py-8">
        <p className="text-center text-sm text-muted-foreground">No pixels were harmed. Many were moved. © 2026 - Sujith S Poojary</p>
      </footer>
    </main>
  );
}