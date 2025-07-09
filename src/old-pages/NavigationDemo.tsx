import React from 'react';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { Organization } from '@/components/NavigationSidebar/types';
import Layout from '@/components/Layout';

const NavigationDemo = () => {
  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  const handleOrganizationChange = (organization: Organization) => {
    console.log('Organization changed to:', organization);
  };

  const organizations: Organization[] = [
    { id: 'ai-hs-code-genie', name: 'AI HS Code Genie' },
    { id: 'test-org-1', name: 'Test Organization 1' },
    { id: 'test-org-2', name: 'Test Organization 2' },
  ];

  return (
    <Layout className="pt-32 pb-16">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Navigation Sidebar Demo</h1>
        
        <div className="flex gap-8">
          {/* Navigation Sidebar */}
          <div className="flex-shrink-0">
            <NavigationSidebar
              organizationName="Uni Customs"
              organizations={organizations}
              onSearch={handleSearch}
              onOrganizationChange={handleOrganizationChange}
              searchPlaceholder="Search features..."
            />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 glass-card p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Main Content Area</h2>
            <p className="text-muted-foreground mb-4">
              This is where the main content would be displayed. The navigation sidebar 
              on the left provides quick access to all the features of the application.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 bg-secondary/20 rounded-lg">
                <h3 className="font-medium mb-2">Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Single Product Classification</li>
                  <li>Batch Classification</li>
                  <li>Tariff Calculator</li>
                  <li>Classification History</li>
                  <li>USHTS Reference</li>
                </ul>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-medium mb-2">Integration Notes:</h3>
                <p className="text-sm text-muted-foreground">
                  The navigation sidebar is fully refactored and ready to be integrated 
                  into the dashboard. It maintains the exact visual design from the 
                  Locofy component while being more maintainable and reusable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NavigationDemo;
