import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  HardDrive,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Smartphone,
  User,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { MobileListing } from "../backend.d";
import { useActor } from "../hooks/useActor";

const ADMIN_PASSWORD = "Afifa@7862";
const AUTH_KEY = "admin_auth";

const ALL_STORAGE_OPTIONS = [
  "16GB",
  "32GB",
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
];

type StatusFilter =
  | "All"
  | "New"
  | "Reviewed"
  | "Offer Made"
  | "Purchased"
  | "Rejected";

const STATUS_FILTERS: StatusFilter[] = [
  "All",
  "New",
  "Reviewed",
  "Offer Made",
  "Purchased",
  "Rejected",
];

const STATUS_CONFIG: Record<
  string,
  { label: string; hindiLabel: string; color: string; bg: string }
> = {
  New: {
    label: "New",
    hindiLabel: "नई",
    color: "text-blue-700",
    bg: "bg-blue-100 border-blue-200",
  },
  Reviewed: {
    label: "Reviewed",
    hindiLabel: "देखी",
    color: "text-yellow-700",
    bg: "bg-yellow-100 border-yellow-200",
  },
  "Offer Made": {
    label: "Offer Made",
    hindiLabel: "ऑफर",
    color: "text-orange-700",
    bg: "bg-orange-100 border-orange-200",
  },
  Purchased: {
    label: "Purchased",
    hindiLabel: "खरीदा",
    color: "text-green-700",
    bg: "bg-green-100 border-green-200",
  },
  Rejected: {
    label: "Rejected",
    hindiLabel: "अस्वीकार",
    color: "text-red-700",
    bg: "bg-red-100 border-red-200",
  },
};

function formatTimestamp(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - ms;

  if (diff < 60_000) return "अभी / Just now";
  if (diff < 3_600_000) {
    const mins = Math.floor(diff / 60_000);
    return `${mins} मिनट पहले / ${mins} min ago`;
  }
  if (diff < 86_400_000) {
    const hrs = Math.floor(diff / 3_600_000);
    return `${hrs} घंटे पहले / ${hrs} hr ago`;
  }
  if (diff < 7 * 86_400_000) {
    const days = Math.floor(diff / 86_400_000);
    return `${days} दिन पहले / ${days} day${days > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ListingCardSkeleton() {
  return (
    <Card className="shadow-xs border-border/60">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
      </CardContent>
    </Card>
  );
}

function parsePickupDateTime(pickupDateTime?: string): {
  date: string;
  time: string;
} {
  if (!pickupDateTime) return { date: "", time: "" };
  // Expected format: "12 Mar 2026, 2:30 PM"
  try {
    const dateObj = new Date(pickupDateTime);
    if (!Number.isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const HH = String(dateObj.getHours()).padStart(2, "0");
      const MM = String(dateObj.getMinutes()).padStart(2, "0");
      return { date: `${yyyy}-${mm}-${dd}`, time: `${HH}:${MM}` };
    }
  } catch {
    // Fallback: leave empty
  }
  return { date: "", time: "" };
}

function formatPickupForDisplay(pickupDateTime: string): string {
  try {
    const d = new Date(pickupDateTime);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch {
    // Fallback to raw string
  }
  return pickupDateTime;
}

function buildPickupDateTimeString(date: string, time: string): string {
  // Combine YYYY-MM-DD + HH:MM into a parseable datetime, return readable format
  const dateObj = new Date(`${date}T${time || "00:00"}`);
  return dateObj.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ListingCard({
  listing,
  index,
  onStatusChange,
}: {
  listing: MobileListing;
  index: number;
  onStatusChange: (id: bigint, status: string) => void;
}) {
  const isNew = listing.status === "New";
  const statusConfig = STATUS_CONFIG[listing.status] || STATUS_CONFIG.New;
  const ocidIndex = index + 1;

  // Pickup date/time state
  const parsed = parsePickupDateTime(listing.pickupDateTime);
  const [pickupDate, setPickupDate] = useState(parsed.date);
  const [pickupTime, setPickupTime] = useState(parsed.time);

  const queryClient = useQueryClient();
  const { actor } = useActor();

  const pickupMutation = useMutation({
    mutationFn: async ({ date, time }: { date: string; time: string }) => {
      if (!actor) throw new Error("Actor not ready");
      const combined = buildPickupDateTimeString(date, time);
      const success = await actor.updatePickupDateTime(listing.id, combined);
      if (!success) throw new Error("Update failed");
      return combined;
    },
    onSuccess: () => {
      toast.success("पिकअप टाइम सेट हो गया / Pickup time saved");
      queryClient.invalidateQueries({ queryKey: ["allListings"] });
    },
    onError: () => {
      toast.error("पिकअप टाइम सेट नहीं हुआ / Failed to save pickup time");
    },
  });

  return (
    <Card
      className={`shadow-xs border transition-all duration-200 hover:shadow-card ${
        isNew ? "listing-new border-l-primary" : "border-border/60"
      }`}
      data-ocid={`admin.listing.item.${ocidIndex}`}
    >
      {isNew && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary font-display">
            नई लिस्टिंग / New Listing
          </span>
        </div>
      )}
      <CardContent className={`p-4 sm:p-5 space-y-3 ${isNew ? "pt-2" : ""}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-foreground leading-tight">
              {listing.brand} {listing.modelName}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(listing.submittedAt)}
              </span>
            </div>
          </div>
          <Badge
            className={`shrink-0 font-display font-semibold text-xs px-2.5 py-1 border ${statusConfig.bg} ${statusConfig.color}`}
          >
            {statusConfig.hindiLabel} / {statusConfig.label}
          </Badge>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full border border-border/50">
            <HardDrive className="w-3 h-3" />
            {listing.storage}
          </span>
          <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full border border-border/50">
            {listing.condition}
          </span>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        )}

        {/* Seller info + Status update */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-border/40">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              {listing.sellerName}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              {listing.phoneNumber}
            </div>
            {listing.address && (
              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{listing.address}</span>
              </div>
            )}
          </div>

          <Select
            value={listing.status}
            onValueChange={(v) => onStatusChange(listing.id, v)}
          >
            <SelectTrigger
              className="w-[170px] h-9 text-xs font-display font-semibold"
              data-ocid={`admin.status.select.${ocidIndex}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["New", "Reviewed", "Offer Made", "Purchased", "Rejected"].map(
                (s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-xs font-display"
                  >
                    {STATUS_CONFIG[s]?.hindiLabel} / {s}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Pickup Date & Time Section */}
        <div
          className="pt-3 border-t border-border/40 space-y-2.5"
          data-ocid={`admin.pickup.panel.${ocidIndex}`}
        >
          {/* Existing pickup display */}
          {listing.pickupDateTime && (
            <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-lg px-3 py-2">
              <CalendarCheck className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary font-display">
                  पिकअप / Pickup
                </p>
                <p className="text-sm font-bold text-foreground">
                  {formatPickupForDisplay(listing.pickupDateTime)}
                </p>
              </div>
            </div>
          )}

          {/* Edit inputs */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground font-display">
                पिकअप तारीख और समय सेट करें / Set Pickup Date & Time
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors min-w-[140px]"
                data-ocid={`admin.pickup.date.input.${ocidIndex}`}
              />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors min-w-[110px]"
                data-ocid={`admin.pickup.time.input.${ocidIndex}`}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={
                  !pickupDate || !pickupTime || pickupMutation.isPending
                }
                onClick={() =>
                  pickupMutation.mutate({ date: pickupDate, time: pickupTime })
                }
                className="h-9 font-display font-semibold text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                data-ocid={`admin.pickup.save_button.${ocidIndex}`}
              >
                {pickupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    सेव हो रहा है...
                  </>
                ) : (
                  <>
                    <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
                    पिकअप सेट करें / Set Pickup
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Storage Rates Panel ──────────────────────────────────────────────────────

function StorageRatesPanel() {
  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();

  const { data: ratesData, isLoading: ratesLoading } = useQuery({
    queryKey: ["storageRates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStorageRates();
    },
    enabled: !!actor && !actorLoading,
  });

  // Local state for each storage rate input
  const [localRates, setLocalRates] = useState<Record<string, string>>({});

  // Build a rate map from fetched data
  const rateMap: Record<string, number> = {};
  for (const r of ratesData ?? []) {
    rateMap[r.storage] = Number(r.rate);
  }

  const getDisplayRate = (storage: string): string => {
    if (localRates[storage] !== undefined) return localRates[storage];
    return String(rateMap[storage] ?? 0);
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      storage,
      rate,
    }: {
      storage: string;
      rate: number;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const success = await actor.updateStorageRate(storage, BigInt(rate));
      if (!success) throw new Error("Update failed");
      return { storage, rate };
    },
    onSuccess: ({ storage, rate }) => {
      toast.success(
        `${storage} रेट अपडेट हो गई: ₹${rate.toLocaleString("en-IN")} / Rate updated`,
      );
      queryClient.invalidateQueries({ queryKey: ["storageRates"] });
      // Clear local override after save
      setLocalRates((prev) => {
        const next = { ...prev };
        delete next[storage];
        return next;
      });
    },
    onError: (_err, { storage }) => {
      toast.error(`${storage} रेट अपडेट नहीं हुई / Failed to update rate`);
    },
  });

  if (ratesLoading || actorLoading) {
    return (
      <div className="space-y-2">
        {ALL_STORAGE_OPTIONS.map((s) => (
          <Skeleton key={s} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-ocid="admin.storage-rates.panel">
      <p className="text-xs text-muted-foreground leading-relaxed">
        प्रत्येक स्टोरेज के लिए रेट (₹ में) सेट करें। सेलर को स्टोरेज चुनने पर रेट दिखेगी।
        <br />
        <span className="text-foreground/60">
          Set rate per storage (in ₹). Sellers will see this rate when they
          select storage.
        </span>
      </p>
      <div className="grid gap-2.5 pt-1">
        {ALL_STORAGE_OPTIONS.map((storage, idx) => {
          const ocidNum = idx + 1;
          const displayVal = getDisplayRate(storage);
          const numVal = Number(displayVal);
          const isSaving =
            saveMutation.isPending &&
            saveMutation.variables?.storage === storage;

          return (
            <div
              key={storage}
              className="flex items-center gap-3 bg-muted/30 border border-border/40 rounded-lg px-3 py-2"
            >
              {/* Storage label */}
              <div className="flex items-center gap-1.5 w-16 shrink-0">
                <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-display font-semibold text-foreground">
                  {storage}
                </span>
              </div>

              {/* Rate input */}
              <div className="relative flex-1">
                <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  step={50}
                  value={displayVal}
                  onChange={(e) =>
                    setLocalRates((prev) => ({
                      ...prev,
                      [storage]: e.target.value,
                    }))
                  }
                  className="h-9 pl-7 text-sm font-semibold"
                  placeholder="0"
                  data-ocid={`admin.storage-rates.input.${ocidNum}`}
                />
              </div>

              {/* Save button */}
              <Button
                size="sm"
                disabled={isSaving || !displayVal || Number.isNaN(numVal)}
                onClick={() => saveMutation.mutate({ storage, rate: numVal })}
                className="h-9 font-display font-semibold text-xs shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
                data-ocid={`admin.storage-rates.save_button.${ocidNum}`}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1" />
                    सेव
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Admin Login Gate ────────────────────────────────────────────────────────

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Slight delay for UX feel
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, "1");
        onSuccess();
      } else {
        setError(true);
        setIsLoading(false);
        setPassword("");
      }
    }, 400);
  };

  return (
    <div className="hero-gradient min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Card className="shadow-card-hover border-border/60 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent-foreground to-primary/60 w-full" />
          <CardContent className="p-7 space-y-6">
            {/* Logo / title */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-foreground flex items-center justify-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Mobile Kabadi Wala
                </h2>
                <p className="text-sm text-primary font-semibold font-display mt-0.5">
                  एडमिन पैनल / Admin Panel
                </p>
              </div>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-4"
              data-ocid="admin.login.modal"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="admin-password"
                  className="font-display font-semibold text-sm"
                >
                  <span className="text-primary">पासवर्ड</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-foreground/80">Password</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="पासवर्ड दर्ज करें / Enter password"
                    value={password}
                    autoFocus
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(false);
                    }}
                    className={`h-11 pl-9 ${error ? "border-destructive" : ""}`}
                    data-ocid="admin.login.input"
                  />
                </div>
                {error && (
                  <p
                    className="text-destructive text-xs flex items-center gap-1.5"
                    data-ocid="admin.login.error_state"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    गलत पासवर्ड / Wrong password
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!password || isLoading}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold"
                data-ocid="admin.login.submit_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    लॉगिन हो रहा है...
                  </>
                ) : (
                  "लॉगिन / Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(AUTH_KEY) === "1",
  );
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [showStorageRates, setShowStorageRates] = useState(false);
  const queryClient = useQueryClient();
  const { actor, isFetching: actorLoading } = useActor();

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  };

  const {
    data: listings = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["allListings"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllListings();
      return [...result].sort(
        (a, b) => Number(b.submittedAt) - Number(a.submittedAt),
      );
    },
    enabled: !!actor && !actorLoading && isAuthenticated,
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: string }) => {
      if (!actor) throw new Error("Actor not ready");
      const success = await actor.updateListingStatus(id, status);
      if (!success) throw new Error("Update failed");
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["allListings"] });
      const previous = queryClient.getQueryData<MobileListing[]>([
        "allListings",
      ]);
      queryClient.setQueryData<MobileListing[]>(
        ["allListings"],
        (old) => old?.map((l) => (l.id === id ? { ...l, status } : l)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["allListings"], context.previous);
      }
      toast.error("स्टेटस अपडेट नहीं हुआ / Failed to update status");
    },
    onSuccess: ({ status }) => {
      const cfg = STATUS_CONFIG[status];
      toast.success(`स्टेटस बदला: ${cfg?.hindiLabel} / Status: ${status}`);
      queryClient.invalidateQueries({ queryKey: ["newListingsCount"] });
    },
  });

  const handleStatusChange = useCallback(
    (id: bigint, status: string) => {
      updateStatusMutation.mutate({ id, status });
    },
    [updateStatusMutation],
  );

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["newListingsCount"] });
  };

  const filteredListings =
    activeFilter === "All"
      ? listings
      : listings.filter((l) => l.status === activeFilter);

  const newCount = listings.filter((l) => l.status === "New").length;

  // Show login gate if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-6 space-y-5"
      data-ocid="admin.panel"
    >
      {/* Admin header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-xl text-foreground">
              <span className="text-primary">एडमिन पैनल</span>
              <span className="text-muted-foreground mx-1.5">/</span>
              Admin Panel
            </h2>
            {newCount > 0 && (
              <Badge
                className="bg-destructive text-destructive-foreground font-bold text-xs px-2"
                data-ocid="admin.new_count.badge"
              >
                {newCount} नई / New
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {listings.length} कुल लिस्टिंग / total listings
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Storage Rates toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStorageRates((v) => !v)}
            className="font-display font-semibold text-xs border-primary/40 text-primary hover:bg-primary/5"
            data-ocid="admin.storage-rates.toggle.button"
          >
            <IndianRupee className="mr-1.5 h-3.5 w-3.5" />
            स्टोरेज रेट / Rates
            {showStorageRates ? (
              <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching || actorLoading}
            className="font-display font-semibold"
            data-ocid="admin.refresh.button"
          >
            {isFetching ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            रिफ्रेश / Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="font-display font-semibold text-muted-foreground hover:text-destructive"
            data-ocid="admin.logout.button"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            लॉगआउट / Logout
          </Button>
        </div>
      </div>

      {/* Storage Rates Panel (collapsible) */}
      {showStorageRates && (
        <Card className="border-primary/20 shadow-xs overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 w-full" />
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  <span className="text-primary">स्टोरेज रेट</span>
                  <span className="text-muted-foreground mx-1.5">/</span>
                  Storage Rates (₹)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Daily rates managed by admin / एडमिन द्वारा रोज़ अपडेट करें
                </p>
              </div>
            </div>
            <Separator />
            <StorageRatesPanel />
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <Tabs
        value={activeFilter}
        onValueChange={(v) => setActiveFilter(v as StatusFilter)}
      >
        <TabsList className="h-auto flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg w-full">
          {STATUS_FILTERS.map((filter) => {
            const count =
              filter === "All"
                ? listings.length
                : listings.filter((l) => l.status === filter).length;
            return (
              <TabsTrigger
                key={filter}
                value={filter}
                className="font-display font-semibold text-xs sm:text-sm px-2.5 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-ocid="admin.filter.tab"
              >
                {filter === "All"
                  ? `सब / All (${count})`
                  : `${STATUS_CONFIG[filter]?.hindiLabel} / ${filter} (${count})`}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Loading state */}
      {(isLoading || actorLoading) && (
        <div className="space-y-3" data-ocid="admin.listings.loading_state">
          {[1, 2, 3].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <Card
          className="border-destructive/30 bg-destructive/5"
          data-ocid="admin.listings.error_state"
        >
          <CardContent className="p-6 flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold font-display">
                लिस्टिंग लोड नहीं हुई / Failed to load listings
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                कृपया रिफ्रेश करें / Please try refreshing
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      {!isLoading && !actorLoading && !isError && (
        <div className="space-y-3" data-ocid="admin.listings.list">
          {filteredListings.length === 0 ? (
            <Card
              className="border-dashed border-border/60"
              data-ocid="admin.listings.empty_state"
            >
              <CardContent className="p-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <LayoutDashboard className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">
                    कोई लिस्टिंग नहीं
                  </p>
                  <p className="text-muted-foreground text-sm">
                    No listings yet
                    {activeFilter !== "All" && (
                      <span> in &quot;{activeFilter}&quot;</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredListings.map((listing, idx) => (
              <ListingCard
                key={listing.id.toString()}
                listing={listing}
                index={idx}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
