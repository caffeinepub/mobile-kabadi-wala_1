import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

type Page = "sell" | "admin";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  newCount: number;
}

export function Header({ currentPage, onNavigate, newCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Smartphone className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-base sm:text-lg leading-tight text-foreground truncate">
              Mobile Kabadi Wala
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              पुराना मोबाइल, नया मौका
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1.5">
          <Button
            variant={currentPage === "sell" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("sell")}
            className={`font-display font-semibold text-sm px-3 sm:px-4 ${
              currentPage === "sell"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="nav.sell.link"
          >
            <span className="hidden sm:inline">बेचें / </span>Sell
          </Button>
          <Button
            variant={currentPage === "admin" ? "default" : "ghost"}
            size="sm"
            onClick={() => onNavigate("admin")}
            className={`font-display font-semibold text-sm px-3 sm:px-4 relative ${
              currentPage === "admin"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid="nav.admin.link"
          >
            <span className="hidden sm:inline">एडमिन / </span>Admin
            {newCount > 0 && (
              <Badge
                className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-xs font-bold bg-destructive text-destructive-foreground border-0 rounded-full"
                data-ocid="admin.new_count.badge"
              >
                {newCount > 99 ? "99+" : newCount}
              </Badge>
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
