import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";

export default function Home() {
  return (
    <main style={{ background: "#05060e", minHeight: "100vh" }}>
      <Hero />
      <HowItWorks />
    </main>
  );
}
