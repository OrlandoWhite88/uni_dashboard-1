import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClassifyPageContent from "./ClassifyPageContent";

function ClassifyPageLoadingFallback() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card p-8 rounded-xl flex flex-col items-center justify-center h-60">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-base font-medium mb-1">Loading classification...</p>
      </div>
    </div>
  );
}

export default function ClassifyPage() {
  return (
    <Suspense fallback={<ClassifyPageLoadingFallback />}>
      <ClassifyPageContent />
    </Suspense>
  );
}
