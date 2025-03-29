import React from "react";
import Layout from "@/components/Layout";
import TariffCalculator from "@/components/TariffCalculator";
import { useLocation } from "react-router-dom";

const TariffCalculatorPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hsCode = queryParams.get("hsCode") || "";

  return (
    <Layout className="py-8">
      <div className="space-y-6">
        <TariffCalculator initialHsCode={hsCode} />
      </div>
    </Layout>
  );
};

export default TariffCalculatorPage;