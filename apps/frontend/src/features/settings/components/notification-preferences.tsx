'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { NotificationPreferences } from '../types/settings.types';

interface NotificationSettingsProps {
  preferences: NotificationPreferences;
  onChange: (prefs: NotificationPreferences) => void;
}

export function NotificationSettings({ preferences, onChange }: NotificationSettingsProps) {
  const toggleKey = (key: keyof NotificationPreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const items: Array<{
    key: keyof NotificationPreferences;
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      key: 'repositorySync',
      title: 'Repository Synchronization',
      description: 'Receive notifications when repository webhook sync or manual pull completes.',
      icon: '🔄',
    },
    {
      key: 'knowledgeProcessing',
      title: 'Knowledge Indexing & Embeddings',
      description: 'Alert when AST code chunking or pgvector embedding generation finishes.',
      icon: '📚',
    },
    {
      key: 'aiCompletion',
      title: 'AI RAG Conversations',
      description: 'In-app toasts and activity summaries for multi-turn Twin chat threads.',
      icon: '💬',
    },
    {
      key: 'jobFailures',
      title: 'Queue Job Failure Alerts',
      description: 'Immediate notification when background BullMQ worker jobs encounter errors.',
      icon: '⚠️',
    },
  ];

  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-bold text-white">Notification Preferences</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Control real-time in-app alerts and email notifications for workspace events.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-3 space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => toggleKey(item.key)}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-base mt-0.5">{item.icon}</span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-normal">{item.description}</p>
              </div>
            </div>

            <div
              className={`h-5 w-9 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                preferences[item.key] ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  preferences[item.key] ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
