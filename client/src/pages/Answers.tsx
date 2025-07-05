import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/components/ui/loading';
import { FileText, HelpCircle, Bot, ExternalLink } from 'lucide-react';

const Answers: React.FC = () => {
  const [match, params] = useRoute('/answers/:jobId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const jobId = params?.jobId ? parseInt(params.jobId) : null;

  const { data: answersData, isLoading, error } = useQuery({
    queryKey: [`/api/jobs/${jobId}/answers`],
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Keep refetching if answers are still being generated
      if (!data?.answers || data.answers.length === 0) {
        return 2000;
      }
      return false;
    },
  });

  const handleExportPDF = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/export-pdf`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quora-qa-export-${jobId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "PDF exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!match || !jobId) {
    return <div>Job not found</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Loading message="Loading answers..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Answers</h3>
              <p className="text-gray-600">Failed to load answers. Please try again.</p>
              <Button onClick={() => setLocation('/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answers = answersData?.answers || [];

  if (answers.length === 0) {
    return (
      <div className="space-y-6">
        <Loading message="Generating AI answers..." progress={75} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AI Generated Answers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Answers Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Generated Answers</CardTitle>
              <p className="text-gray-600 mt-1">Review and export your Q&A pairs</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {answers.length} answers generated
              </span>
              <Button onClick={handleExportPDF} className="bg-green-600 hover:bg-green-700">
                <FileText className="w-4 h-4 mr-2" />
                Export to PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Q&A Pairs */}
          <div className="space-y-6">
            {answers.map((answerData: any, index: number) => (
              <div key={answerData.id} className="border border-gray-200 rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start">
                    <HelpCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    {answerData.question.question}
                  </h3>
                  <a
                    href={answerData.question.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    View on Quora
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Bot className="w-5 h-5 text-green-600 mr-2" />
                    AI Generated Answer
                  </h4>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {answerData.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Answers;
