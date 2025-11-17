"use client";

import React from "react";
import TariffCalculator from "@/components/TariffCalculator";
import { useSearchParams } from "next/navigation";

const TariffCalculatorPage: React.FC = () => {
  const searchParams = useSearchParams();
  const hsCode = searchParams.get("hsCode") || "";

  return (
    <div className="py-8">
      <div className="space-y-6">
        <TariffCalculator initialHsCode={hsCode} />
      </div>
    </div>
  );
};

export default TariffCalculatorPage;
