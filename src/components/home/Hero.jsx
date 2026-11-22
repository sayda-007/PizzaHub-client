import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Hero photograph: Unsplash image 1513104890138-7c749659a591.
// License: Unsplash License (https://unsplash.com/license) - free commercial use.

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="border-b border-line bg-paper"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
        <div>
          <p className="eyebrow">Pizza that brings the table closer</p>
          <h1
            id="hero-title"
            className="mt-5 max-w-2xl text-[clamp(3rem,6.5vw,5rem)] leading-[1.02] font-medium tracking-[-0.035em]"
          >
            Good pizza.
            <br />
            <span className="text-tomato">Better moments.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            PizzaHub is here for the everyday gatherings that taste better with
            a shared slice — from a quiet dinner in to a table full of friends.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/#menu">Explore the menu</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5">
              <Link href="/#our-story">Our story</Link>
            </Button>
          </div>
        </div>

        <figure className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-line bg-muted sm:aspect-[16/10] lg:aspect-[4/5]">
            <Image
              src="/images/artisan-pizza-hero.webp"
              alt="Artisan pizza fresh from the oven, ready to share"
              fill
              sizes="(max-width: 1023px) 100vw, 46vw"
              className="object-cover object-center"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <figcaption className="mt-4 flex items-center gap-3 text-xs tracking-[0.12em] text-ink-muted uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-tomato" />
            A good slice is better shared
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
