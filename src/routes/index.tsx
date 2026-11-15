import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, BriefcaseBusiness, Mail } from "lucide-react";
import { ParticleText } from "@/components/ParticleText";
import { WaveLoop } from "@/components/WaveLoop";
import { RunnerGame } from "@/components/RunnerGame";
import { SlingButton } from "@/components/SlingButton";
import { ThemeSwitch } from "@/components/unlumen-ui/theme-switch";
import { AboutStack } from "@/components/AboutStack";
import { ToolsOrbit } from "@/components/ToolsOrbit";
import { HeroPill } from "@/components/HeroPill";
import { useIsMobile } from "@/hooks/use-mobile";
import { BEHANCE, EMAIL, LINKEDIN, experience, projects, skills } from "@/components/portfolio-data";
import profileImage from "@/assets/profile image.jpg";
import resumePdf from "@/assets/Resume.pdf";
import sujithAvatar from "@/assets/sujith-avatar.webp";
import emailIllustration from "@/assets/email-illustration.webp";
import linkedinIllustration from "@/assets/linkedin-illustration.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sujith S Poojary — UI/UX Designer, Mangalore" },
      { name: "description", content: "Portfolio of Sujith S Poojary, UI/UX designer crafting user-centric products: research, wireframes, prototypes and design systems." },
      { property: "og:title", content: "Sujith S Poojary — UI/UX Designer" },
      { property: "og:description", content: "Playful, user-centric UI/UX design work by Sujith S Poojary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")), { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Index() {
  useReveal();
  return (
    <main className="overflow-x-hidden">
      <Nav />
      <Hero />
      <Projects />
      <About />
      <Tools />
      <Experience />
      <WaveLoop />
      <Contact />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav className="flex items-center gap-1 rounded-full border bg-card/80 p-1.5 shadow-soft backdrop-blur">
        <a href="#top" aria-label="Back to top" className="block shrink-0 rounded-full transition-transform duration-500 ease-[cubic-bezier(.34,1.8,.5,1)] hover:scale-110">
          <span className="block h-14 w-14 overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-card shadow-soft">
            <img
              src={profileImage}
              alt="Sujith S Poojary"
              width={56}
              height={56}
              style={{ objectPosition: "center 100%", transform: "translate(2px, -2px) scale(1.08)" }}
              className="h-14 w-14 rounded-full object-cover"
            />
          </span>
        </a>
        {["work", "about", "contact"].map((s) => (
          <a key={s} href={`#${s}`} className="rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors hover:bg-muted">{s}</a>
        ))}
        <ThemeSwitch className="ml-1" />
      </nav>
    </header>
  );
}

function Hero() {
  return (
    // Phones: the section hugs its content (no full-screen height, no centring) so the gaps between the nav,
    // the greeting pill, the heading and the tagline stay tight; the heading box is only as tall as the logo.
    <section id="top" className="relative flex flex-col items-center justify-center px-4 pt-20 md:min-h-screen max-md:min-h-0 max-md:justify-start max-md:pb-24 max-md:pt-[7.25rem]">
      <HeroPill />
      {/* Phones: the heading box is 1.5rem wider than the padded column (it bleeds 0.75rem each side) so the logo can run closer to the screen edges. */}
      <div className="h-28 w-full max-w-7xl max-md:w-[calc(100%+1.5rem)] md:h-[46vh]">
        <ParticleText text="UI/UX Designer" src="/logo.svg" />
      </div>
      <p className="reveal max-w-md text-center text-muted-foreground">Bringing creativity into every interface.</p>
      <a href="#about" aria-label="Scroll to about" className="absolute bottom-8 grid h-12 w-12 place-items-center rounded-full border bg-card shadow-soft animate-bob">↓</a>
    </section>
  );
}

// Filled 24x24 glyphs (Material Icons, Apache-2.0) drawn like the brand marks: solid, in the primary colour.
const skillIcons: Record<string, string> = {
  "User Research": "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  "UI Design": "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  "Interaction Design": "M21 3 3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z",
  "Wireframing": "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  "Prototyping": "M8 5v14l11-7z",
  "User Flows": "M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z",
  "UX Audits": "M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z",
  "Vibe Coding": "M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z",
  "Design-to-Code": "M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
};

function ScatterPill({ children }: { children: ReactNode }) {
  const [t, setT] = useState("");
  return (
    <span
      className="pill cursor-default hover:bg-accent"
      style={{ transform: t }}
      onMouseEnter={() => setT(`translate(${(Math.random() - 0.5) * 14}px, ${-6 - Math.random() * 8}px) rotate(${(Math.random() - 0.5) * 12}deg)`)}
      onMouseLeave={() => setT("")}
    >
      {children}
    </span>
  );
}

function About() {
  return (
    <section id="about" className="mx-auto grid max-w-6xl gap-10 px-6 pt-8 pb-6 md:grid-cols-[1.4fr_1fr] md:items-center md:pb-16 md:pt-28">
      <div className="reveal">
        <p className="font-semibold text-primary">About me</p>
        <h2 className="mt-2 text-4xl font-extrabold leading-[1.2] md:text-6xl">Design isn’t just<br /><span className="rounded-2xl bg-foreground px-3 text-background">on the screen.</span></h2>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          It’s in the way we interact, decide, explore, and experience everyday life. I believe good design quietly shapes these moments. As a UI/UX designer, I’m interested in creating digital experiences that feel natural, purposeful, and worth remembering.
        </p>
        <h3 className="mt-10 text-sm font-bold uppercase tracking-widest text-muted-foreground">Skills</h3>
        <div className="mt-4 flex flex-wrap gap-2">{skills.map((s) => { const d = skillIcons[s]; return <ScatterPill key={s}>{d && <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-current text-primary"><path d={d} /></svg>}{s}</ScatterPill>; })}</div>
      </div>
      <aside className="reveal self-center py-6 md:py-0">
        <AboutStack
          cards={[
            {
              role: "UI/UX Designer · Mangalore",
              name: "Sujith S Poojary",
              description: "Junior UI/UX Designer at CocoGrid, crafting interfaces that feel natural and purposeful.",
              imageSrc: sujithAvatar,
              imageAlt: "Illustrated portrait of Sujith S Poojary",
              isFeatured: true,
              ctaLabel: "View resume",
              ctaHref: resumePdf,
            },
            {
              role: "Say hello",
              name: "Email me",
              description: "Have a project or an idea to explore? My inbox is always open.",
              imageSrc: emailIllustration,
              imageAlt: "Illustration of Sujith opening an envelope",
              ctaLabel: "Send email",
              ctaHref: `mailto:${EMAIL}`,
            },
            {
              role: "Let's connect",
              name: "LinkedIn",
              description: "Follow along for design work, collaborations and friendly chats.",
              imageSrc: linkedinIllustration,
              imageAlt: "Illustration of Sujith pointing at a LinkedIn badge",
              ctaLabel: "Connect",
              ctaHref: LINKEDIN,
            },
          ]}
        />
      </aside>
    </section>
  );
}

function Tools() {
  return (
    <section id="tools" className="mx-auto block max-w-6xl px-6 pb-28 text-left">
      <h3 className="reveal text-sm font-bold uppercase tracking-widest text-muted-foreground">Tools</h3>
      <div className="reveal w-full"><ToolsOrbit /></div>
    </section>
  );
}

function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-6xl px-6 pb-16 md:pb-20">
      <p className="reveal font-semibold text-primary">Career</p>
      <h2 className="reveal mt-2 text-4xl font-extrabold md:text-6xl">Work experience</h2>
      <div className="reveal mt-8 flex max-w-3xl items-start gap-4 rounded-2xl border bg-card p-5 md:gap-5 md:p-6">
        <span aria-hidden className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-foreground text-background md:h-[4.5rem] md:w-[4.5rem]">
          <BriefcaseBusiness className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold leading-tight tracking-tight md:text-[1.75rem]">{experience.company} · {experience.location}</p>
          <p className="mt-2 text-base text-muted-foreground">{experience.period}</p>
          {/* LinkedIn-style timeline: a vertical line joins the roles held here, earliest first, the current one lit. */}
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Career progression</p>
          <ol className="mt-3 space-y-3 border-l border-border pl-5">
            {experience.progression.map((step, index) => {
              const current = index === experience.progression.length - 1;
              return (
                <li key={step} className={`relative text-base ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  <span aria-hidden className={`absolute -left-[1.6rem] top-[0.4rem] h-2.5 w-2.5 rounded-full border-2 ${current ? "border-foreground bg-foreground" : "border-muted-foreground bg-card"}`} />
                  {step}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Device({ kind }: { kind: string }) {
  return kind === "phone" ? (
    <div className="h-44 w-24 rounded-[1.4rem] border-4 border-foreground bg-card p-2 shadow-lift">
      <div className="mx-auto h-1.5 w-8 rounded-full bg-foreground" />
      <div className="mt-3 space-y-2"><div className="h-8 rounded-lg bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /><div className="h-10 rounded-lg bg-accent" /></div>
    </div>
  ) : (
    <div>
      <div className="h-32 w-52 rounded-t-xl border-4 border-foreground bg-card p-2">
        <div className="flex gap-2"><div className="h-20 w-10 rounded bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 rounded bg-muted" /><div className="h-10 rounded bg-accent" /><div className="h-3 w-2/3 rounded bg-muted" /></div></div>
      </div>
      <div className="mx-auto h-2.5 w-60 -translate-x-1 rounded-b-lg bg-foreground" />
    </div>
  );
}

function ProjectCard({ p, i }: { p: (typeof projects)[number]; i: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const move = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current!.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  };
  return (
    <div className="reveal h-full min-h-[30rem]" style={{ transitionDelay: `${(i % 2) * 120}ms` }}>
      <a ref={ref} href={p.href} target="_blank" rel="noreferrer" aria-label={`${p.title} — view on Behance (opens in a new tab)`}
        onMouseMove={move} onMouseLeave={() => (ref.current!.style.transform = "")}
        className="group flex h-full w-full flex-col rounded-3xl border bg-card p-3 text-left shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:shadow-lift">
        {/* Image cards skip the gradient: it bleeds through the anti-aliased rounded edge as a light hairline */}
        <div className={`relative isolate grid aspect-4/3 place-items-center overflow-hidden rounded-2xl ${p.image ? "bg-black" : p.grad}`}>
          {p.image ? (
            <img src={p.image} alt={`${p.title} project thumbnail`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
          ) : (
            <div className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"><Device kind={p.device} /></div>
          )}
          {/* Subtle 1px stroke drawn above the image (an inset ring on the wrapper would be hidden beneath it) */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-[0.5px] ring-inset ring-white/12" />
          <span className="absolute right-4 top-4 inline-flex translate-x-[140%] items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform duration-300 group-hover:translate-x-0">View Project <ArrowUpRight aria-hidden className="h-4 w-4" /></span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-3xl font-bold leading-tight">{p.title}</h3>
          <p className="mt-1 font-display text-lg font-medium leading-snug text-muted-foreground">{p.sub}</p>
          <p className="mt-3 text-muted-foreground">{p.desc}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">{p.tags.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{t}</span>)}</div>
        </div>
      </a>
    </div>
  );
}

function Projects() {
  return (
    <section id="work" className="mx-auto max-w-6xl px-6 py-20 max-md:pt-4">
      <div className="reveal flex items-end justify-between">
        <div><p className="font-semibold text-primary">Selected work</p><h2 className="mt-2 text-4xl font-extrabold md:text-6xl">Projects ✦</h2></div>
        <p className="hidden text-muted-foreground md:block">03 featured projects</p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl auto-rows-fr gap-8 md:grid-cols-2">
        {projects.slice(0, 3).map((p, i) => <ProjectCard key={p.title} p={p} i={i} />)}
      </div>
      <div className="mt-10 flex justify-center">
        <Link to="/work" className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent">
          Explore My Work <ArrowUpRight aria-hidden className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

// Brand glyphs (Simple Icons, CC0) for the contact rows; they follow the text colour.
const LINKEDIN_PATH = "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
const BEHANCE_PATH = "M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.595.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.699c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.711.958 1.182.241.579.357 1.203.341 1.83a3.506 3.506 0 0 1-.506 1.961 3.726 3.726 0 0 1-1.503 1.287 3.588 3.588 0 0 1 2.027 1.437c.464.747.697 1.615.67 2.494a4.593 4.593 0 0 1-.423 2.032 3.945 3.945 0 0 1-1.163 1.413 5.114 5.114 0 0 1-1.683.807 7.135 7.135 0 0 1-1.928.259H0V4.084h6.947Zm-.235 12.9c.308.004.616-.029.916-.099a2.18 2.18 0 0 0 .766-.332c.228-.158.411-.371.534-.619.142-.317.208-.663.191-1.009a2.08 2.08 0 0 0-.642-1.715 2.618 2.618 0 0 0-1.696-.505h-3.54v4.279h3.471Zm13.635-5.967a2.13 2.13 0 0 0-1.654-.619 2.336 2.336 0 0 0-1.163.259 2.474 2.474 0 0 0-.738.62 2.359 2.359 0 0 0-.396.792c-.074.239-.12.485-.137.734h4.769a3.239 3.239 0 0 0-.679-1.785l-.002-.001Zm-13.813-.648a2.254 2.254 0 0 0 1.423-.433c.399-.355.607-.88.56-1.413a1.916 1.916 0 0 0-.178-.891 1.298 1.298 0 0 0-.495-.533 1.851 1.851 0 0 0-.711-.274 3.966 3.966 0 0 0-.835-.073H3.241v3.631h3.293v-.014ZM21.62 5.122h-5.976v1.527h5.976V5.122Z";
const BrandIcon = ({ path }: { path: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 fill-current"><path d={path} /></svg>
);

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={label} title={label}
      className="grid h-16 w-16 place-items-center rounded-2xl border bg-card text-muted-foreground transition-[transform,background,color] duration-300 ease-out hover:-translate-y-1 hover:bg-accent hover:text-foreground sm:h-20 sm:w-20">
      {children}
    </a>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sent) return;
    const f = new FormData(e.currentTarget);
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${f.get("name")}`)}&body=${encodeURIComponent(`${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`)}`;
    setSent(true);
    window.location.href = mailto;
    window.setTimeout(() => setSent(false), 3000);
  };
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 pt-14 pb-28 text-center">
      <p className="reveal font-semibold text-primary">Have something in mind?</p>
      <h2 className="reveal mt-2 text-5xl font-extrabold md:text-7xl">Let's make something happen.</h2>
      <p className="reveal mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Have a project, an idea to explore, or just want to talk design? My inbox is open.</p>
      <form onSubmit={submit} className="reveal mx-auto mt-12 grid max-w-2xl gap-6 rounded-3xl border bg-card p-8 text-left shadow-soft md:grid-cols-2">
        <div className="float-field"><input id="name" name="name" required placeholder=" " /><label htmlFor="name">Your name</label></div>
        <div className="float-field"><input id="email" name="email" type="email" required placeholder=" " /><label htmlFor="email">Email address</label></div>
        <div className="float-field md:col-span-2"><textarea id="message" name="message" rows={3} required placeholder=" " /><label htmlFor="message">What's on your mind?</label></div>
        <button disabled={sent} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-wait md:col-span-2">Let's talk <ArrowUpRight aria-hidden className="h-4 w-4" /></button>
      </form>
      <div className="reveal mt-10 flex justify-center gap-4">
        <IconLink href={`mailto:${EMAIL}`} label="Email"><Mail aria-hidden className="h-7 w-7" /></IconLink>
        <IconLink href={LINKEDIN} label="LinkedIn"><BrandIcon path={LINKEDIN_PATH} /></IconLink>
        <IconLink href={BEHANCE} label="Behance"><BrandIcon path={BEHANCE_PATH} /></IconLink>
      </div>
    </section>
  );
}

function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer className="mx-auto max-w-6xl px-6 pb-10">
      <RunnerGame />
      <div className="mt-6 flex items-center justify-end gap-3 pr-2">
        <span className="max-w-40 text-right text-xs text-muted-foreground">Drag down and release to return to top</span>
        <SlingButton onSend={() => window.scrollTo({ top: 0, behavior: "smooth" })} padColor="var(--sling-pad)" iconColor="var(--sling-icon)" accentColor="var(--sling-accent, var(--particle))" wellColor="var(--sling-well)" bandColor="var(--sling-band)" size={isMobile ? 40 : 48} strokeWidth={3} armAt={40} maxPull={110} launchSpeed={2600} recoil={0.2} flight={100} particles={8} spread={50} axis="vertical" tapSends ariaLabel="Back to top" />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">No pixels were harmed. Many were moved. © 2026 - Sujith S Poojary</p>
    </footer>
  );
}
