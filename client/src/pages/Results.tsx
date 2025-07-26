import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import Loading from '@/components/ui/loading';
import type { JobResponse } from '@/types/api';
import { Bot, ExternalLink } from 'lucide-react';

const Results: React.FC = () => {
  const [match, params] = useRoute('/results/:jobId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  const jobId = params?.jobId ? parseInt(params.jobId) : null;

  const {
  data: jobData,
  isLoading,
  error,
  refetch,
} = useQuery<JobResponse, Error>({
  queryKey: [`/api/jobs/${jobId}`],
  queryFn: async () => {
    const res = await apiRequest("GET", `/api/jobs/${jobId}`);
    return res.json(); // returns type JobResponse
  },
  enabled: !!jobId,
  refetchInterval: (query) => {
  const data = query.state.data;
  return data?.job?.status === 'processing' ? 3000 : false;
},
});



  const generateAnswersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/jobs/${jobId}/generate-answers`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI answer generation started!",
      });
      setLocation(`/answers/${jobId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate answers. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, selected }: { questionId: number; selected: boolean }) => {
      const response = await apiRequest('POST', `/api/questions/${questionId}/select`, { selected });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
    },
  });

  const handleQuestionToggle = (questionId: number, checked: boolean) => {
    const newSelected = new Set(selectedQuestions);
    if (checked) {
      newSelected.add(questionId);
    } else {
      newSelected.delete(questionId);
    }
    setSelectedQuestions(newSelected);
    updateQuestionMutation.mutate({ questionId, selected: checked });
  };

  const handleSelectAll = () => {
    const newAllSelected = !allSelected;
    setAllSelected(newAllSelected);
    
    const newSelected = new Set<number>();
    if (newAllSelected && jobData?.questions) {
      jobData.questions.forEach((q: any) => {
        newSelected.add(q.id);
        updateQuestionMutation.mutate({ questionId: q.id, selected: true });
      });
    } else if (jobData?.questions) {
      jobData.questions.forEach((q: any) => {
        updateQuestionMutation.mutate({ questionId: q.id, selected: false });
      });
    }
    
    setSelectedQuestions(newSelected);
  };

  const handleGenerateAnswers = () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question to generate answers.",
        variant: "destructive",
      });
      return;
    }
    generateAnswersMutation.mutate();
  };

  // Update selected questions when data changes
  useEffect(() => {
    if (jobData?.questions) {
      const selected = new Set<number>();
      jobData.questions.forEach((q: any) => {
        if (q.selected) {
          selected.add(q.id);
        }
      });
      setSelectedQuestions(selected);
      setAllSelected(selected.size === jobData.questions.length && jobData.questions.length > 0);
    }
  }, [jobData]);

  if (!match || !jobId) {
    return <div>Job not found</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Loading message="Loading job details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Job</h3>
              <p className="text-gray-600">Failed to load job details. Please try again.</p>
              <Button onClick={() => setLocation('/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = jobData?.job;
  const questions = jobData?.questions || [];

  // if (job?.status === 'processing') {
  //   return (
  //     <div className="space-y-6">
  //       <Loading message="Scraping Questions..." progress={45} />
  //     </div>
  //   );
  // }
  if (job?.status === 'processing' || !jobData?.questions) {
  return (
    <div className="space-y-6">
      <Loading message="Scraping Questions..." progress={45} />
    </div>
  );
}


  if (job?.status === 'failed') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scraping Failed</h3>
              <p className="text-gray-600">The scraping job failed. Please try again with different parameters.</p>
              <Button onClick={() => setLocation('/input')} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <BreadcrumbPage>Scraping Results</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scraping Results</CardTitle>
              <p className="text-gray-600 mt-1">Select questions to generate AI answers</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Found {questions.length} questions
              </span>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Question List */}
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions found for this job.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question: any, index: number) => (
                <div
                  key={question.id}
                  className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedQuestions.has(question.id)}
                    onCheckedChange={(checked) => handleQuestionToggle(question.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{question.question}</h3>
                    <div className="flex items-center mt-2 space-x-2">
                      <a
                        href={question.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        View on Quora
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                    <div className="flex items-center mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {job?.topic?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <Button variant="outline" onClick={() => setLocation('/input')}>
              Back to Input
            </Button>
            <Button 
              onClick={handleGenerateAnswers}
              disabled={selectedQuestions.size === 0 || generateAnswersMutation.isPending}
            >
              {generateAnswersMutation.isPending ? (
                'Generating...'
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Generate AI Answers ({selectedQuestions.size})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Results;
