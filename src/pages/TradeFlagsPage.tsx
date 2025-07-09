import React from "react";
import Layout from "@/components/Layout";
import TradeComplianceFlags from "@/components/TradeComplianceFlags";
import { useLocation } from "react-router-dom";

const TradeFlagsPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const hsCode = queryParams.get("hsCode") || "";

  return (
    <Layout className="pt-20 pb-16">
      <div className="space-y-6">
        <TradeComplianceFlags initialHsCode={hsCode} />
      </div>
    </Layout>
  );
};

export default TradeFlagsPage;
