import { Header } from "@/components/Header";
import { HabitList } from "@/components/HabitList";
import { CreateHabit } from "@/components/CreateHabit";
import { Toaster } from "@/components/Toaster";
import { Celebration } from "@/components/Celebration";
import { SyncManager } from "@/components/SyncManager";
import { APP_VERSION } from "@/lib/version";

export default function HomePage() {
  return (
    <>
      <div className="flex min-h-[100dvh] w-full flex-col gap-8 py-8 pb-28 pl-5 pr-[8vw] md:mx-auto md:max-w-[640px] md:px-8 md:py-14">
        <Header />
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-ink-400">
              Tus hábitos
            </h2>
            <span className="font-mono text-xs text-ink-400">
              Toca el círculo para marcar
            </span>
          </div>
          <HabitList />
        </section>

        <footer className="mt-auto flex flex-col items-center gap-1 pt-8 text-center">
          <span className="text-sm font-semibold tracking-tight text-ink-500">
            Los hábitos de Genaro Escobar
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
            Hábitos · v{APP_VERSION}
          </span>
        </footer>
      </div>

      <CreateHabit />
      <Toaster />
      <Celebration />
      <SyncManager />
    </>
  );
}
