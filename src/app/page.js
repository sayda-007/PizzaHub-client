import FeaturedMenu from "@/components/home/FeaturedMenu";
import BrandIntroduction from "@/components/home/BrandIntroduction";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import WhyChoose from "@/components/home/WhyChoose";
import { getPublicMenu } from "@/lib/public-menu";

export default async function Home() {
  const menu = await getPublicMenu();

  return (
    <main className="bg-paper">
      <Hero />
      <BrandIntroduction />
      <WhyChoose />
      <HowItWorks />
      <FeaturedMenu items={menu.items} status={menu.status} />
    </main>
  );
}
