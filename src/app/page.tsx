import { CalorieTracker } from "@/components/planner";
import { AuthGuard } from "@/components/auth-guard";

export default function Home() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-zinc-900 flex justify-center items-start pt-4 sm:pt-8">
        <div className="w-full max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[90vh]">
          <CalorieTracker />
        </div>
      </main>
    </AuthGuard>
  );
}
