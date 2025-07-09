import React, { useState } from "react";
import BulkImportFiles from "./BulkImportFiles";
import BatchClassify from "./BatchClassify";

const BulkImport = () => {
  // This will hold both CSV file data and pasted text
  const [importedData, setCsvFile] = useState<string | ArrayBuffer>("");
  const [submitted, setSubmitted] = useState(false);
  
  // Display the appropriate screen based on submission state
  return submitted ? (
    <BatchClassify csvFile={importedData} />
  ) : (
    <BulkImportFiles
      setCsvFile={setCsvFile}
      csvFile={importedData}
      setSubmitted={setSubmitted}
    />
  );
};

export default BulkImport;
