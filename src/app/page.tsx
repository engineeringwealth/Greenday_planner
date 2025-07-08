import { CalorieTracker } from "@/components/planner";
import { AuthGuard } from "@/components/auth-guard";

export default function Home() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-background">
        <CalorieTracker />
      </main>
    </AuthGuard>
  );
}
