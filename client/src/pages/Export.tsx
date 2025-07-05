import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Home, Download } from 'lucide-react';

const Export: React.FC = () => {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your Q&A pairs have been successfully exported to PDF
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => setLocation('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Export;
