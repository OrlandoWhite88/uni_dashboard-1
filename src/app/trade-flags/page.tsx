"use client";

import React from "react";
import TradeComplianceFlags from "@/components/TradeComplianceFlags";
import { useSearchParams } from "next/navigation";

export default function TradeFlagsRoute() {
  const searchParams = useSearchParams();
  const hsCode = searchParams.get("hsCode") || "";

  return (
    <div className="space-y-6">
      <TradeComplianceFlags initialHsCode={hsCode} />
    </div>
  );
}
