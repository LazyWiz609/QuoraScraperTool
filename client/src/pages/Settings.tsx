import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Key, Eye, EyeOff, Save, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/user/settings'],
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: (apiKey: string) => apiRequest('/api/user/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      toast({
        title: "Success",
        description: "API key saved successfully!",
      });
      setApiKey('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    },
  });

  const removeApiKeyMutation = useMutation({
    mutationFn: () => apiRequest('/api/user/api-key', {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      toast({
        title: "Success",
        description: "API key removed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove API key",
        variant: "destructive",
      });
    },
  });

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    
    saveApiKeyMutation.mutate(apiKey.trim());
  };

  const handleRemoveApiKey = () => {
    removeApiKeyMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and API keys</p>
        </div>

        {/* User Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={settings?.username || ''}
                  disabled
                  className="mt-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Google Gemini API Key
            </CardTitle>
            <p className="text-sm text-gray-600">
              Store your Gemini API key securely to generate AI answers without entering it each time.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="flex items-center">
                  <Key className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-sm font-medium">API Key Status:</span>
                </div>
                <Badge 
                  variant={settings?.hasApiKey ? "default" : "secondary"}
                  className="ml-2"
                >
                  {settings?.hasApiKey ? "Configured" : "Not Set"}
                </Badge>
              </div>
              {settings?.hasApiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveApiKey}
                  disabled={removeApiKeyMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>

            {/* Add/Update API Key */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="gemini-api-key">
                  {settings?.hasApiKey ? "Update" : "Add"} Gemini API Key
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="gemini-api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from the{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <Button
                onClick={handleSaveApiKey}
                disabled={saveApiKeyMutation.isPending || !apiKey.trim()}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveApiKeyMutation.isPending ? "Saving..." : "Save API Key"}
              </Button>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Why save your API key?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Skip entering it every time you generate answers</li>
                <li>• Secure storage with your account</li>
                <li>• Easy to update or remove when needed</li>
                <li>• Better Quora-style answer generation with improved prompts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;