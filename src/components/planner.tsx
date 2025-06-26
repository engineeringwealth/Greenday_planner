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

const initialTasks: Task[] = [
  { id: "1", title: "Morning yoga session", details: "30 minutes of vinyasa flow.", deadline: new Date(), completed: true },
  { id: "2", title: "Team meeting", details: "Discuss Q3 project goals.", deadline: new Date(), completed: false },
  { id: "3", title: "Design new landing page", details: "Focus on UX and mobile responsiveness.", deadline: new Date(), completed: false },
];


export function Planner() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const getStorageKey = useMemo(() => {
    return user ? `tasks-${user.uid}` : null;
  }, [user]);


  useEffect(() => {
    if (!getStorageKey) return;

    try {
      const storedTasks = localStorage.getItem(getStorageKey);
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks, (key, value) => {
          if (key === 'deadline') return new Date(value);
          return value;
        });
        setTasks(parsedTasks);
      } else {
        setTasks(initialTasks);
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage", error);
      setTasks(initialTasks);
    }
  }, [getStorageKey]);

  useEffect(() => {
    if (!getStorageKey) return;
    try {
      localStorage.setItem(getStorageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error("Failed to save tasks to localStorage", error);
    }
  }, [tasks, getStorageKey]);

  const handleAddTask = (taskData: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleEditTask = (taskData: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskData.id ? taskData : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    );
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
