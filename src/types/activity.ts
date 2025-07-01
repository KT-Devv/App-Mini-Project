
export interface Activity {
  type: string;
  user: string;
  subject: string;
  time: string;
  details?: string;
  status: string;
  avatar: string;
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
}
