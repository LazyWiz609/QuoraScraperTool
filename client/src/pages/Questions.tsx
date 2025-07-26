import React, { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Loading from "@/components/ui/loading";
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, HelpCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const Questions: React.FC = () => {
  const [match, params] = useRoute("/questions/:jobId");
  const [, setLocation] = useLocation();
  const jobId = params?.jobId ? parseInt(params.jobId) : null;
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/jobs/${jobId}/questions`],
    enabled: !!jobId,
  });

  const toggleSelection = (id: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };
  
    const generateAnswersMutation = useMutation({
    mutationFn: async () => {
        // Step 1: Update selected states in DB
        const selectionResponse = await fetch(`/api/jobs/${jobId}/select-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            selectedQuestionIds: Array.from(selectedQuestions),
        }),
        });

        const selectionRes = await selectionResponse.json();
        if (!selectionResponse.ok) {
        throw new Error(selectionRes.error || "Failed to update question selection");
        }

        // Step 2: Generate answers
        const response = await fetch(`/api/jobs/${jobId}/generate-answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            selectedQuestionIds: Array.from(selectedQuestions),
        }),
        });

        const res = await response.json();
        if (!response.ok) throw new Error(res.error || "Failed to generate answers");
        return res;
    },
    onSuccess: () => {
        setSelectedQuestions(new Set());
        setLocation(`/answers/${jobId}`);
    },
    onError: (err: any) => {
        toast({
        title: "Error",
        description: err.message || "Could not generate answers.",
        variant: "destructive",
        });
    },
    });

  if (!match || !jobId) return <div>Job not found</div>;
  if (isLoading) return <Loading message="Loading questions..." />;
  if (error || !data?.questions) return <div>Error loading questions</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Scraped Questions</h2>

          {data.questions.map((q: any) => (
            <div
              key={q.id}
              className="border rounded-lg p-4 space-y-2 bg-white shadow-sm"
            >
              <div className="flex items-start gap-3 text-gray-900 font-medium">
                <Checkbox
                  checked={selectedQuestions.has(q.id)}
                  onCheckedChange={() => toggleSelection(q.id)}
                  className="mt-1"
                />
                <HelpCircle className="w-5 h-5 mt-1 text-blue-600" />
                <span>{q.question}</span>
              </div>
              <a
                href={q.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                View on Quora <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          ))}

          {/* Action Buttons */}
          {data.questions.length > 0 && (
            <div className="flex justify-end space-x-4 pt-6">
              <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button
                onClick={() => generateAnswersMutation.mutate()}
                disabled={
                  selectedQuestions.size === 0 || generateAnswersMutation.isPending
                }
              >
                {generateAnswersMutation.isPending ? (
                  "Generating..."
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate AI Answers ({selectedQuestions.size})
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Questions;
