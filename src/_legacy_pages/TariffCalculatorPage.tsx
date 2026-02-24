import React from "react";
import Layout from "@/components/Layout";
import TariffCalculator from "@/components/TariffCalculator";
import { useLocation } from "react-router-dom";

const TariffCalculatorPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hsCode = queryParams.get("hsCode") || "";
  const originCountry = queryParams.get("originCountry") || "";

  return (
    <Layout className="pt-20 pb-16">
      <div className="space-y-6">
        <TariffCalculator
          initialHsCode={hsCode}
          initialOriginCountry={originCountry}
        />
      </div>
    </Layout>
  );
};

export default TariffCalculatorPage;
