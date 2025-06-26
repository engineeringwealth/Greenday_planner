export type Task = {
  id: string;
  title: string;
  details?: string;
  deadline: Date;
  completed: boolean;
};
