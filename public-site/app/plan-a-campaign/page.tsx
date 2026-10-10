import type { Metadata } from "next";
import { PageHero } from "@/components/PageSections";
import CampaignProcess from "@/components/campaign/CampaignProcess";
import CTABlock from "@/components/CTABlock";

export const metadata: Metadata = {
  title: "Plan a Campaign — Ashton Media",
  description: "How an out-of-home campaign with Ashton Media runs, from first brief to proof of posting.",
};

export default function PlanACampaignPage() {
  return (
    <div className="bg-canvas text-white">
      <PageHero
        title="Plan a Campaign"
        tag="Working with us"
        sub="Six steps from your brief to proof that the campaign ran. Here is what happens at each one, and what a booking includes."
      />
      <CampaignProcess />
      <CTABlock primaryLabel="Send us your brief" primaryHref="/contact" />
    </div>
  );
}
