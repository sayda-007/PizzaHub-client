import Hero from "@/components/home/Hero";
import BrandIntroduction from "@/components/home/BrandIntroduction";
import WhyChoose from "@/components/home/WhyChoose";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedMenu from "@/components/home/FeaturedMenu";

export default function Home() {
  return (
    <main className="bg-paper">
      <Hero />
      <BrandIntroduction />
      <WhyChoose />
      <HowItWorks />
      <FeaturedMenu />
    </main>
  );
}
