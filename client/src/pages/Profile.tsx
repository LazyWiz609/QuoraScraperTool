import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input as InputField } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

const Profile: React.FC = () => {
  const { toast } = useToast();

  const [apiKey, setApiKey] = useState('');
  const [quora_email, setQuoraEmail] = useState('');
  const [quora_password, setQuoraPassword] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiRequest('GET', '/api/user/profile');
        const data = await res.json();

        setApiKey(data.geminiApiKey || '');
        setQuoraEmail(data.quora_email || '');
        setQuoraPassword(data.quora_password || '');
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch profile", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiRequest('POST', '/api/user/profile', {
        geminiApiKey: apiKey,
        quora_email,
        quora_password,
      });

      if (res.ok) {
        toast({ title: "Success", description: "Profile saved successfully!" });
      } else {
        toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-10">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Manage your Gemini API and Quora credentials here.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="apiKey">Gemini API Key</Label>
          <InputField
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="quora_email">Quora Email</Label>
          <InputField
            id="quora_email"
            type="email"
            value={quora_email}
            onChange={(e) => setQuoraEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="quora_password">Quora Password</Label>
          <InputField
            id="quora_password"
            type="password"
            value={quora_password}
            onChange={(e) => setQuoraPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Profile;
