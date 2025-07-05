import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as InputField } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { Play } from 'lucide-react';

const Input: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    topic: '',
    keyword: '',
    timeFilter: 'all-time',
    questionLimit: 20,
    geminiApiKey: '',
  });

  const scrapeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/scrape', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Scraping job started successfully!",
      });
      setLocation(`/results/${data.jobId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start scraping job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.keyword) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Set the Gemini API key in environment (for client-side usage)
    if (formData.geminiApiKey) {
      // This would need to be passed to the backend securely
      // For now, we'll assume it's set on the server
    }

    scrapeMutation.mutate({
      topic: formData.topic,
      keyword: formData.keyword,
      timeFilter: formData.timeFilter || undefined,
      questionLimit: formData.questionLimit,
    });
  };

  const topicOptions = [
    { value: 'mental-health', label: 'Mental Health' },
    { value: 'business', label: 'Business & Entrepreneurship' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'technology', label: 'Technology' },
    { value: 'health-fitness', label: 'Health & Fitness' },
    { value: 'education', label: 'Education' },
    { value: 'career', label: 'Career & Jobs' },
    { value: 'finance', label: 'Finance & Money' },
  ];

  const timeFilterOptions = [
    { value: 'all-time', label: 'All Time' },
    { value: 'past-week', label: 'Past Week' },
    { value: 'past-month', label: 'Past Month' },
    { value: 'past-year', label: 'Past Year' },
  ];

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
            <BreadcrumbPage>New Scraping Job</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Scraping Parameters</CardTitle>
          <p className="text-gray-600">Set up your Quora question scraping job</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Selection */}
            <div>
              <Label htmlFor="topic">Topic Category *</Label>
              <Select value={formData.topic} onValueChange={(value) => setFormData({ ...formData, topic: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a topic..." />
                </SelectTrigger>
                <SelectContent>
                  {topicOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Keyword Input */}
            <div>
              <Label htmlFor="keyword">Keywords *</Label>
              <InputField
                id="keyword"
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                placeholder="e.g., startup, anxiety, productivity"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter keywords to search within the selected topic
              </p>
            </div>

            {/* Time Filter */}
            <div>
              <Label htmlFor="time-filter">Time Filter</Label>
              <Select value={formData.timeFilter} onValueChange={(value) => setFormData({ ...formData, timeFilter: value })}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select time filter..." />
                </SelectTrigger>
                <SelectContent>
                  {timeFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Questions */}
            <div>
              <Label htmlFor="question-limit">Number of Questions</Label>
              <InputField
                id="question-limit"
                type="number"
                min="1"
                max="100"
                value={formData.questionLimit}
                onChange={(e) => setFormData({ ...formData, questionLimit: parseInt(e.target.value) || 20 })}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum 100 questions per job</p>
            </div>

            {/* API Configuration */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">AI Configuration</h3>
              <div>
                <Label htmlFor="gemini-api-key">Google Gemini API Key</Label>
                <InputField
                  id="gemini-api-key"
                  type="password"
                  value={formData.geminiApiKey}
                  onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                  placeholder="Enter your Gemini API key"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for AI answer generation
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setLocation('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={scrapeMutation.isPending}>
                {scrapeMutation.isPending ? (
                  'Starting...'
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Scraping
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Input;
