'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  isSearching: boolean;
  onClear: () => void;
}

export function SearchInput({ value, onChange, onSubmit, isSearching, onClear }: SearchInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          placeholder="Search functions, classes, AST symbols, commit diffs, or architecture..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-slate-900 border-slate-800 text-white text-xs h-10 pl-9 pr-8 focus:border-blue-500 rounded-xl"
          leftIcon={
            <svg
              className="h-4 w-4 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          }
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      <Button
        type="submit"
        variant="ai"
        size="sm"
        disabled={!value.trim() || isSearching}
        className="text-xs h-10 px-4 rounded-xl"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </Button>
    </form>
  );
}
