import React, { useState } from "react";
import BulkImportFiles from "./BulkImportFiles";
import BatchClassify from "./BatchClassify";

const BulkImport = () => {
  const [csvFile, setCsvFile] = useState<string | ArrayBuffer>("");
  const [submitted, setSubmitted] = useState(false);
  return submitted ? (
    <BatchClassify csvFile={csvFile} />
  ) : (
    <BulkImportFiles
      setCsvFile={setCsvFile}
      csvFile={csvFile}
      setSubmitted={setSubmitted}
    />
  );
};

export default BulkImport;
