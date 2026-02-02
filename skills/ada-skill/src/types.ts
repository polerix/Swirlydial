export interface AdaJob {
  id: string;
  repo: string;
  action: 'init' | 'run' | 'status' | 'plan' | 'pr' | 'diff' | 'approve';
  role?: 'pm' | 'eng' | 'ops' | 'design' | 'ceo';
  cycles?: number;
  approval_token?: string;
  args?: string[];
}

export interface AdaReport {
  job_id: string;
  repo: string; // Add this line
  summary: string;
  patch_stats?: string;
  memory_update?: string;
  next_action?: string;
  error?: string;
}
