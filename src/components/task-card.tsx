"use client";

import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onToggleComplete, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card className="transition-all hover:shadow-md bg-card/80">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="flex-none pt-1">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="w-5 h-5"
            aria-label={`Mark ${task.title} as complete`}
          />
        </div>
        <div className="flex-grow">
          <label
            htmlFor={`task-${task.id}`}
            className={`font-medium text-base transition-all duration-300 ${
              task.completed ? "line-through text-muted-foreground" : "text-card-foreground"
            }`}
          >
            {task.title}
          </label>
          {task.details && (
            <p className={`text-sm mt-1 transition-all duration-300 ${
              task.completed ? "line-through text-muted-foreground/80" : "text-muted-foreground"
            }`}>
              {task.details}
            </p>
          )}
        </div>
        <div className="flex-none flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Task</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete Task</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
