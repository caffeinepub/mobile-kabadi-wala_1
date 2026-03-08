import { Toaster } from "@/components/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "./components/Header";
import { useActor } from "./hooks/useActor";
import { AdminPage } from "./pages/AdminPage";
import { SellerPage } from "./pages/SellerPage";

type Page = "sell" | "admin";

function App() {
  const [page, setPage] = useState<Page>("sell");
  const { actor, isFetching } = useActor();

  const { data: newCount = 0 } = useQuery({
    queryKey: ["newListingsCount"],
    queryFn: async () => {
      if (!actor) return 0;
      const count = await actor.getNewListingsCount();
      return Number(count);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-background font-body flex flex-col">
      <Header currentPage={page} onNavigate={setPage} newCount={newCount} />
      <main className="flex-1">
        {page === "sell" ? <SellerPage /> : <AdminPage />}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border mt-8">
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          Built with ❤️ using caffeine.ai
        </a>
      </footer>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
