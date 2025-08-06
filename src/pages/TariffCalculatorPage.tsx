import React from "react";
import Layout from "@/components/Layout";
import TariffCalculator from "@/components/TariffCalculator";
import { useLocation } from "react-router-dom";
import { ClassificationRecord } from "@/lib/supabaseService";

interface LocationState {
  initialHsCode?: string;
  initialClassificationData?: ClassificationRecord;
}

const TariffCalculatorPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hsCodeFromQuery = queryParams.get("hsCode") || "";
  
  // Get state data passed from navigation
  const state = location.state as LocationState;
  const initialHsCode = state?.initialHsCode || hsCodeFromQuery;
  const initialClassificationData = state?.initialClassificationData;

  return (
    <Layout className="pt-20 pb-16">
      <div className="space-y-6">
        <TariffCalculator
          initialHsCode={initialHsCode}
          initialClassificationData={initialClassificationData}
        />
      </div>
    </Layout>
  );
};

export default TariffCalculatorPage;
