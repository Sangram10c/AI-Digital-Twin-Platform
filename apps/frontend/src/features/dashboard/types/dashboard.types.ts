/**
 * Dashboard Types & Interface Models
 * Strictly mapped to backend Analytics, Repositories, and Chat responses.
 */

export interface DashboardMetricItem {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'ai' | 'success' | 'warning' | 'destructive';
  icon?: string;
  href?: string;
}

export interface HealthComponentItem {
  key: string;
  name: string;
  status: 'HEALTHY' | 'OPTIMAL' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  message?: string;
  icon?: string;
}

export interface DashboardHealthData {
  overallStatus: 'HEALTHY' | 'OPTIMAL' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';
  components: HealthComponentItem[];
}
