'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export default function WorkspaceSettingsPage() {
  const [provider, setProvider] = React.useState('gemini');
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Workspace Settings</h1>
        <p className="text-xs text-muted-foreground">
          Configure AI model providers, automated sync schedules, and workspace preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Card className="p-5 space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base">AI Model Provider</CardTitle>
            <CardDescription>
              Select the primary LLM provider for RAG conversational extraction and prompt
              completion.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Default Provider</label>
              <Select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                options={[
                  { value: 'gemini', label: 'Google Gemini (gemini-2.0-flash)' },
                  { value: 'groq', label: 'Groq (llama-3.3-70b-versatile)' },
                  { value: 'openai', label: 'OpenAI (gpt-4o-mini)' },
                  { value: 'anthropic', label: 'Anthropic (claude-3-5-sonnet)' },
                  { value: 'ollama', label: 'Ollama (Local deepseek-r1 / llama3)' },
                ]}
              />
            </div>
          </CardContent>

          <CardFooter className="p-0 pt-2 flex items-center justify-between border-t border-border mt-4">
            <span className="text-xs text-muted-foreground">
              Fallback chain will automatically engage if primary fails.
            </span>
            <Button type="submit" size="sm" variant="default">
              {saved ? 'Saved!' : 'Save Settings'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
