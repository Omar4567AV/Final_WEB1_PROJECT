export interface Student {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT';
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER';
}
