"use client";

import React, { useState } from "react";
import BulkImportFiles from "@/_legacy_pages/BulkImportFiles";
import BatchClassify from "@/_legacy_pages/BatchClassify";

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
