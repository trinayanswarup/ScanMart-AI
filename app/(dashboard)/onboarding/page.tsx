"use client";

import { Coffee, Scissors, ShoppingBasket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import type { BusinessType } from "@/types";

const icons: Record<BusinessType, typeof Scissors> = { salon: Scissors, cafe: Coffee, grocery: ShoppingBasket };
const descriptions: Record<BusinessType, string> = {
  salon: "Products, tools, styling, and care supplies.",
  cafe: "Ingredients, packaging, and counter inventory.",
  grocery: "Everyday goods across fast-moving categories.",
};

export default function OnboardingPage() {
  const { state, setCurrentStoreId } = useApp();
  const router = useRouter();

  return (
    <div className="page-wrap" style={{ maxWidth: 950 }}>
      <div className="page-header">
        <div>
          <div className="eyebrow">Demo workspace</div>
          <h1>Which store would you like to manage?</h1>
          <p>Each store has its own inventory, automation workflows, and public storefront.</p>
        </div>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <div className="grid-3" style={{ marginTop: 8 }}>
          {state.stores.map((store) => {
            const Icon = icons[store.businessType];
            return (
              <button
                key={store.id}
                className="subtle-card"
                style={{ textAlign: "left", padding: 22, cursor: "pointer" }}
                onClick={() => { setCurrentStoreId(store.id); router.push("/dashboard"); }}
              >
                <Icon size={24} color="#2C645B" />
                <strong style={{ display: "block", marginTop: 18, fontSize: 15 }}>{store.name}</strong>
                <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, margin: "6px 0 0" }}>
                  {descriptions[store.businessType]}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
