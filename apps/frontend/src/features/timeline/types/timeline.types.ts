/**
 * Timeline Feature Types
 */

export type TimelineEventType =
  'REPOSITORY_SYNC' | 'COMMIT' | 'PULL_REQUEST' | 'ISSUE' | 'AI_CONVERSATION' | 'RELEASE';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
  author: string;
  repositoryName?: string;
  url?: string;
  badgeText?: string;
}
