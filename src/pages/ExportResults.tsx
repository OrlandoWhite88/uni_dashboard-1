
import React from "react";
import Layout from "@/components/Layout";
import CustomButton from "@/components/ui/CustomButton";
import { Download, FileText, Calendar, ArrowRight } from "lucide-react";

const ExportResults = () => {
  const mockExports = [
    { id: 1, name: "March Imports", date: "Mar 15, 2025", count: 45 },
    { id: 2, name: "February Products", date: "Feb 28, 2025", count: 32 },
    { id: 3, name: "January Analysis", date: "Jan 10, 2025", count: 18 },
  ];

  return (
    <Layout className="pt-28 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Export Results</h1>
          <p className="text-muted-foreground">
            Download your classified products or schedule automatic exports to your systems.
          </p>
        </div>

        <div className="glass-card p-6 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium">Recent Exports</h2>
            <CustomButton size="sm" variant="outline">
              <Calendar size={14} className="mr-2" /> Schedule Export
            </CustomButton>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground rounded-tl-lg">Name</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">Products</th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-muted-foreground rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockExports.map((exp) => (
                  <tr key={exp.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 flex items-center">
                      <FileText size={16} className="mr-2 text-muted-foreground" />
                      {exp.name}
                    </td>
                    <td className="py-3 px-4 text-sm">{exp.date}</td>
                    <td className="py-3 px-4 text-sm">{exp.count} products</td>
                    <td className="py-3 px-4 text-right">
                      <CustomButton size="sm" variant="outline">
                        <Download size={14} className="mr-1" /> Download
                      </CustomButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-xl">
          <h2 className="text-xl font-medium mb-4">Export Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border border-border rounded-lg bg-background/50">
              <h3 className="font-medium mb-2">CSV Format</h3>
              <p className="text-sm text-muted-foreground mb-3">Export in standard CSV format for spreadsheet applications.</p>
              <CustomButton size="sm" variant="outline" className="w-full">
                Export as CSV
              </CustomButton>
            </div>
            
            <div className="p-4 border border-border rounded-lg bg-background/50">
              <h3 className="font-medium mb-2">Excel Format</h3>
              <p className="text-sm text-muted-foreground mb-3">Export in Excel format with formatted columns and data.</p>
              <CustomButton size="sm" variant="outline" className="w-full">
                Export as Excel
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExportResults;
