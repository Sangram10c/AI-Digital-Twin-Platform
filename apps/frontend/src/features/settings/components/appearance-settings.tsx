'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AppearanceSettingsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

export function AppearanceSettings({ theme, onThemeChange }: AppearanceSettingsProps) {
  const themes = [
    {
      id: 'dark',
      name: 'Midnight Dark',
      desc: 'Optimized dark theme with high contrast syntax & subtle glass layers.',
      badge: 'Active & Default',
      icon: '🌙',
    },
    {
      id: 'system',
      name: 'System Default',
      desc: 'Synchronizes automatically with your operating system color scheme.',
      badge: 'Auto',
      icon: '💻',
    },
  ];

  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="text-base font-bold text-white">Appearance & Theme</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Customize interface density, editor syntax colors, and workspace visual theme.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((t) => {
          const isSelected = theme === t.id;
          return (
            <div
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-colors space-y-2 ${
                isSelected
                  ? 'border-blue-500/60 bg-blue-950/20'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{t.icon}</span>
                  <span className="text-xs font-bold text-white">{t.name}</span>
                </div>
                <Badge
                  variant={isSelected ? 'ai' : 'outline'}
                  size="sm"
                  className="text-[9px] font-mono"
                >
                  {t.badge}
                </Badge>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{t.desc}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
