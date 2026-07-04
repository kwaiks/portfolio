import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { About } from "@/components/About";
import { Experience } from "@/components/Experience";
import { CaseStudies } from "@/components/CaseStudies";
import { Stack } from "@/components/Stack";
import { AiWriteup } from "@/components/AiWriteup";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6">
        <Hero />

        <Section id="about" label="about" title="About">
          <About />
        </Section>

        <Section id="work" label="experience" title="Experience">
          <Experience />
        </Section>

        <Section id="projects" label="selected work" title="Case studies">
          <CaseStudies />
        </Section>

        <Section id="stack" label="stack" title="Stack & tools">
          <Stack />
        </Section>

        <Section id="ai" label="how the ai works" title="How this site's AI works">
          <AiWriteup />
        </Section>

        <Section id="contact" label="contact" title="Get in touch">
          <Contact />
        </Section>

        <Footer />
      </main>

      <AssistantWidget />
    </>
  );
}
