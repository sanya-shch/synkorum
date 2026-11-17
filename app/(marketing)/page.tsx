import type { Metadata } from "next";

import { getCurrentUser } from "@/lib/current-user";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

import { Hero } from "./_components/hero";
import { Features } from "./_components/features";
import { Product, Collaboration } from "./_components/product";
import { UseCases, Steps } from "./_components/use-cases";
import { Workspace } from "./_components/workspace";
import { CtaBand } from "./_components/cta-band";
import { SiteHeader } from "./_components/site-header";
import { SiteFooter } from "./_components/site-footer";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const LandingPage = async () => {
  const user = await getCurrentUser();
  const isLoggedIn = !!user;

  return (
    <>
      {/* "<" is escaped so the JSON can never close the script tag early. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <SiteHeader isLoggedIn={isLoggedIn} />

      <main>
        <Hero isLoggedIn={isLoggedIn} />
        <Features />
        <Product />
        <Collaboration />
        <UseCases />
        <Steps />
        <Workspace />
        <CtaBand isLoggedIn={isLoggedIn} />
      </main>

      <SiteFooter />
    </>
  );
};

export default LandingPage;
