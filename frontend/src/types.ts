export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface Label {
  id: string;
  name: string;
}

export interface SubIssue {
  id: string;
  name: string;
  content?: string | null;
  is_completed: boolean;
}

export interface Assignees {
  id: string;
  name: string;
}

export interface CommentOut {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export interface Issue {
  id: string;
  name: string; // <-- Changed from title to name
  label: Label[];
  sub_issues: SubIssue[];
  assignees: Assignees[];
  comments: CommentOut[];
  content?: string | null;
  status: 'PENDING' | 'in-progress' | 'COMPLETED'; // Matches backend models.STATUS
  priority: 'LOW' | 'MEDIUM' | 'HIGH';           // Matches backend models.PRIORITY
  created_at: string;
}