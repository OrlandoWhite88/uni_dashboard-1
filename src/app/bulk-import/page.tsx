"use client";

import React, { useState } from "react";
import BulkImportFiles from "@/pages/BulkImportFiles";
import BatchClassify from "@/pages/BatchClassify";

const BulkImportPage = () => {
  const [csvFile, setCsvFile] = useState<string | ArrayBuffer>("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <BatchClassify csvFile={csvFile} />;
  }

  return (
    <BulkImportFiles
      csvFile={csvFile}
      setCsvFile={setCsvFile}
      setSubmitted={setSubmitted}
    />
  );
};

export default BulkImportPage;
