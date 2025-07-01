
export interface Activity {
  type: string;
  user: string;
  subject: string;
  time: string;
  details?: string;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
}
