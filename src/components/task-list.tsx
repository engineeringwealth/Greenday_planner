"use client";

import { TaskCard } from "@/components/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@/lib/types";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, isLoading, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[76px] w-full rounded-lg" />
        <Skeleton className="h-[76px] w-full rounded-lg" />
        <Skeleton className="h-[76px] w-full rounded-lg" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-medium text-muted-foreground">No tasks scheduled for this day.</h3>
        <p className="text-sm text-muted-foreground/80 mt-1">Enjoy your free time or add a new task!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
