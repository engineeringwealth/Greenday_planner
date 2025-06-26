"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskDialog } from "@/components/task-dialog";
import { TaskList } from "@/components/task-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Task } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as taskService from "@/services/task-service";
import { useToast } from "@/hooks/use-toast";


export function Planner() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoadingTasks(true);
      taskService.getTasks(user.uid)
        .then(setTasks)
        .catch(error => {
            console.error("Failed to fetch tasks:", error);
            toast({
                title: "Error",
                description: "Could not fetch your tasks from the database.",
                variant: "destructive"
            });
        })
        .finally(() => setIsLoadingTasks(false));
    } else {
        setTasks([]);
        setIsLoadingTasks(false);
    }
  }, [user, toast]);

  const handleAddTask = async (taskData: Omit<Task, "id" | "completed">) => {
    if (!user) return;
    try {
        const newTask = await taskService.addTask(user.uid, taskData);
        setTasks((prev) => [...prev, newTask]);
    } catch(error) {
        console.error("Failed to add task:", error);
        toast({ title: "Error", description: "Failed to add new task.", variant: "destructive" });
    }
  };

  const handleEditTask = async (taskData: Task) => {
    if (!user) return;
    try {
        await taskService.updateTask(user.uid, taskData.id, taskData);
        setTasks((prev) =>
            prev.map((t) => (t.id === taskData.id ? taskData : t))
        );
    } catch(error) {
        console.error("Failed to update task:", error);
        toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    try {
        await taskService.deleteTask(user.uid, taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (error) {
        console.error("Failed to delete task:", error);
        toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedCompleted = !task.completed;
    try {
        await taskService.updateTask(user.uid, taskId, { completed: updatedCompleted });
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, completed: updatedCompleted } : t
            )
        );
    } catch (error) {
        console.error("Failed to toggle task completion:", error);
        toast({ title: "Error", description: "Failed to update task status.", variant: "destructive" });
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };
  
  const filteredTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((task) => isSameDay(task.deadline, selectedDate)).sort((a,b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
  }, [tasks, selectedDate]);

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground/90 font-headline">
          GreenDay Planner
        </h1>
        <div className="flex items-center gap-4">
          <Button onClick={openAddDialog} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                    <AvatarFallback>{(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardContent className="p-2 sm:p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-2">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">
                Tasks for {selectedDate ? format(selectedDate, "PPP") : "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={filteredTasks}
                isLoading={isLoadingTasks}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditDialog}
                onDelete={handleDeleteTask}
              />
            </CardContent>
          </Card>
        </main>
      </div>

      <TaskDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSubmit={editingTask ? handleEditTask : handleAddTask}
        initialData={editingTask}
      />
    </div>
  );
}
