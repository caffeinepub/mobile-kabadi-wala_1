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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Copy,
  HardDrive,
  IndianRupee,
  Loader2,
  MapPin,
  Phone,
  Search,
  Smartphone,
  Tag,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { MobileListing } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface FormData {
  brand: string;
  modelName: string;
  storage: string;
  condition: string;
  address: string;
  sellerName: string;
  phoneNumber: string;
}

const initialFormData: FormData = {
  brand: "",
  modelName: "",
  storage: "",
  condition: "",
  address: "",
  sellerName: "",
  phoneNumber: "",
};

const BRANDS = [
  "Samsung",
  "Apple",
  "Vivo",
  "Oppo",
  "Realme",
  "OnePlus",
  "Xiaomi",
  "Other",
];

const STORAGE_OPTIONS = [
  "16GB",
  "32GB",
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
];

const CONDITION_OPTIONS = [
  { value: "Good", label: "Good (अच्छा)" },
  { value: "Average", label: "Average (ठीक-ठाक)" },
  { value: "Broken Screen", label: "Broken Screen (टूटी स्क्रीन)" },
  { value: "Heavy Damage", label: "Heavy Damage (ज्यादा खराब)" },
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

function BiLabel({ hindi, english }: { hindi: string; english: string }) {
  return (
    <span className="flex items-center gap-1.5 font-display font-semibold text-sm">
      <span className="text-primary">{hindi}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground/80">{english}</span>
    </span>
  );
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
    // Fallback
  }
  return pickupDateTime;
}

// ─── Check Status Tab ────────────────────────────────────────────────────────

function CheckStatusTab({ prefillId }: { prefillId?: bigint | null }) {
  const [trackingId, setTrackingId] = useState(
    prefillId != null ? prefillId.toString() : "",
  );
  const [searchedId, setSearchedId] = useState<bigint | null>(
    prefillId ?? null,
  );
  const [notFound, setNotFound] = useState(false);
  const { actor, isFetching: actorLoading } = useActor();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: foundListing,
    isFetching: isSearching,
    refetch,
  } = useQuery<MobileListing | null>({
    queryKey: ["trackListing", searchedId?.toString() ?? ""],
    queryFn: async () => {
      if (!actor || searchedId === null) return null;
      const result = await actor.getListingById(searchedId);
      return result;
    },
    enabled: !!actor && !actorLoading && searchedId !== null,
    refetchInterval: searchedId !== null ? 30000 : false,
  });

  // Detect not-found state after query runs
  useEffect(() => {
    if (searchedId !== null && !isSearching && foundListing === null) {
      setNotFound(true);
    } else if (foundListing !== null && foundListing !== undefined) {
      setNotFound(false);
    }
  }, [foundListing, isSearching, searchedId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = trackingId.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      toast.error("सही ID डालें / Enter a valid numeric ID");
      return;
    }
    const id = BigInt(trimmed);
    if (id === searchedId) {
      // Same ID, re-trigger fetch
      refetch();
    } else {
      setNotFound(false);
      setSearchedId(id);
    }
  };

  const statusConfig = foundListing
    ? (STATUS_CONFIG[foundListing.status] ?? STATUS_CONFIG.New)
    : null;

  return (
    <div className="space-y-5">
      {/* Search form */}
      <Card className="shadow-card border-border/60 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent-foreground to-primary/60 w-full" />
        <CardContent className="p-5 sm:p-6">
          <form
            onSubmit={handleSearch}
            className="space-y-4"
            data-ocid="tracker.form"
          >
            <div className="text-center space-y-1 pb-2">
              <h3 className="font-display font-bold text-lg text-foreground">
                <span className="text-primary">लिस्टिंग स्टेटस</span>
                <span className="text-muted-foreground mx-1.5">/</span>
                <span>Check Status</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                अपनी लिस्टिंग ID डालें और पिकअप टाइम चेक करें
                <br />
                <span className="text-foreground/60">
                  Enter your listing ID to check pickup time
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking-id">
                <BiLabel hindi="लिस्टिंग ID" english="Listing ID" />
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  id="tracking-id"
                  inputMode="numeric"
                  placeholder="जैसे: 12345 / e.g. 12345"
                  value={trackingId}
                  onChange={(e) => {
                    setTrackingId(e.target.value.replace(/\D/g, ""));
                    setNotFound(false);
                  }}
                  className="h-11 pl-9 font-mono text-base"
                  data-ocid="tracker.id.input"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!trackingId.trim() || isSearching || actorLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold"
              data-ocid="tracker.search.button"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  खोज रहे हैं... / Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  चेक करें / Check Status
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isSearching && (
        <div
          className="flex items-center justify-center gap-2 py-6 text-muted-foreground"
          data-ocid="tracker.loading_state"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-display">खोज रहे हैं...</span>
        </div>
      )}

      {/* Not found state */}
      {notFound && !isSearching && (
        <Card
          className="border-destructive/30 bg-destructive/5"
          data-ocid="tracker.error_state"
        >
          <CardContent className="p-5 text-center space-y-2">
            <p className="font-display font-bold text-destructive">
              यह ID नहीं मिली
            </p>
            <p className="text-sm text-muted-foreground">
              Listing ID not found. Please check and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Found listing */}
      {foundListing && !isSearching && (
        <Card
          className="shadow-card border-primary/20 overflow-hidden"
          data-ocid="tracker.result.card"
        >
          <div className="h-1.5 bg-primary w-full" />
          <CardContent className="p-5 sm:p-6 space-y-4">
            {/* Header with ID + status */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-muted-foreground">
                    ID #{foundListing.id.toString()}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  {foundListing.brand} {foundListing.modelName}
                </h3>
              </div>
              {statusConfig && (
                <Badge
                  className={`shrink-0 font-display font-semibold text-xs px-2.5 py-1 border ${statusConfig.bg} ${statusConfig.color}`}
                  data-ocid="tracker.result.status.badge"
                >
                  {statusConfig.hindiLabel} / {statusConfig.label}
                </Badge>
              )}
            </div>

            {/* Details chips */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full border border-border/50">
                <HardDrive className="w-3 h-3" />
                {foundListing.storage}
              </span>
              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full border border-border/50">
                {foundListing.condition}
              </span>
            </div>

            {/* Seller info */}
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold text-foreground">
                  {foundListing.sellerName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                {foundListing.phoneNumber}
              </div>
              {foundListing.address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{foundListing.address}</span>
                </div>
              )}
            </div>

            {/* Pickup date/time — main focus */}
            {foundListing.pickupDateTime ? (
              <div
                className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5"
                data-ocid="tracker.pickup.success_state"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-green-700 font-display">
                    पिकअप की तारीख और समय / Pickup Scheduled
                  </p>
                  <p className="text-base font-bold text-green-800">
                    {formatPickupForDisplay(foundListing.pickupDateTime)}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-3 bg-muted/50 border border-border/40 rounded-xl px-4 py-3.5"
                data-ocid="tracker.pickup.loading_state"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground font-display">
                    पिकअप टाइम अभी तय नहीं हुआ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pickup time not yet scheduled
                  </p>
                </div>
              </div>
            )}

            {/* Auto-refresh note */}
            <p className="text-xs text-muted-foreground/60 text-center">
              हर 30 सेकंड में ऑटो-अपडेट / Auto-updates every 30 seconds
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Seller Form ─────────────────────────────────────────────────────────────

export function SellerPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<bigint | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [activeTab, setActiveTab] = useState("sell");
  const [idCopied, setIdCopied] = useState(false);

  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();

  // Fetch storage rates
  const { data: storageRatesData } = useQuery({
    queryKey: ["storageRates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStorageRates();
    },
    enabled: !!actor && !actorLoading,
  });

  const storageRateMap: Map<string, number> = new Map(
    (storageRatesData ?? []).map((r) => [r.storage, Number(r.rate)]),
  );

  // Poll submitted listing for pickup date
  const { data: submittedListing } = useQuery({
    queryKey: ["submittedListing", submittedId?.toString() ?? ""],
    queryFn: async () => {
      if (!actor || submittedId === null) return null;
      return actor.getListingById(submittedId);
    },
    enabled: !!actor && !actorLoading && submitted && submittedId !== null,
    refetchInterval: 30000,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!actor) throw new Error("Actor not ready");

      return actor.submitListing({
        brand: data.brand,
        modelName: data.modelName,
        storage: data.storage,
        condition: data.condition,
        address: data.address,
        description: "",
        sellerName: data.sellerName,
        phoneNumber: data.phoneNumber,
      });
    },
    onSuccess: (id) => {
      setSubmittedId(id);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["newListingsCount"] });
      queryClient.invalidateQueries({ queryKey: ["allListings"] });
      toast.success("लिस्टिंग सबमिट हो गई! / Listing submitted!");
    },
    onError: () => {
      toast.error(
        "कुछ गलत हुआ। फिर कोशिश करें। / Something went wrong. Please try again.",
      );
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.brand) newErrors.brand = "ब्रांड चुनें / Select brand";
    if (!formData.modelName.trim())
      newErrors.modelName = "मॉडल नाम लिखें / Enter model name";
    if (!formData.storage) newErrors.storage = "स्टोरेज चुनें / Select storage";
    if (!formData.condition) newErrors.condition = "हालत चुनें / Select condition";
    if (!formData.address.trim())
      newErrors.address = "एड्रेस लिखें / Enter address";
    if (!formData.sellerName.trim())
      newErrors.sellerName = "नाम लिखें / Enter name";
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "फोन नंबर लिखें / Enter phone number";
    } else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = "10 अंकों का नंबर दें / Enter 10-digit number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitMutation.mutate(formData);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setSubmitted(false);
    setSubmittedId(null);
    setErrors({});
    setIdCopied(false);
  };

  const handleCopyId = () => {
    if (submittedId !== null) {
      navigator.clipboard.writeText(submittedId.toString()).then(() => {
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
      });
    }
  };

  const selectedStorageRate = formData.storage
    ? (storageRateMap.get(formData.storage) ?? 0)
    : 0;

  // Success screen after submission
  if (submitted) {
    const pickupDT = submittedListing?.pickupDateTime;

    return (
      <div className="hero-gradient min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md animate-scale-in"
          data-ocid="seller.success_state"
        >
          <Card className="shadow-card-hover border-primary/20 overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="p-8 text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-2xl text-foreground">
                  आपकी लिस्टिंग मिल गई!
                </h2>
                <p className="text-lg font-semibold text-primary">
                  Your listing has been received!
                </p>
              </div>

              {/* Listing ID — prominent display */}
              {submittedId !== null && (
                <div className="bg-primary/8 border-2 border-primary/25 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary/70 font-display uppercase tracking-wider">
                    आपकी लिस्टिंग ID / Your Listing ID
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono font-black text-3xl text-primary tracking-wider">
                      #{submittedId.toString()}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors shrink-0"
                      title="Copy ID"
                      data-ocid="seller.copy_id.button"
                    >
                      {idCopied ? (
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-display font-semibold">
                    ⚠️ यह ID सेव करें! इससे पिकअप टाइम चेक कर सकते हैं।
                    <br />
                    <span className="font-normal text-amber-600">
                      Save this ID! Use it to check your pickup time.
                    </span>
                  </p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-1.5">
                <p className="font-semibold text-foreground/80">
                  {formData.brand} {formData.modelName}
                </p>
                <p className="text-muted-foreground">
                  {formData.storage} • {formData.condition}
                </p>
                <p className="text-muted-foreground">📍 {formData.address}</p>
                <p className="text-muted-foreground">
                  📞 {formData.phoneNumber}
                </p>
              </div>

              {/* Pickup date/time display */}
              {pickupDT ? (
                <div
                  className="flex items-center gap-3 bg-primary/8 border border-primary/25 rounded-xl px-4 py-3"
                  data-ocid="seller.pickup.success_state"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-primary font-display">
                      पिकअप / Pickup
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {formatPickupForDisplay(pickupDT)}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 justify-center"
                  data-ocid="seller.pickup.success_state"
                >
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    पिकअप टाइम जल्द बताया जाएगा / Pickup time will be shared soon
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    // Switch to check tab WITHOUT resetting -- ID stays filled
                    setActiveTab("check");
                    setSubmitted(false);
                  }}
                  variant="outline"
                  className="w-full font-display font-semibold border-primary/40 text-primary hover:bg-primary/5"
                  data-ocid="seller.check_status.button"
                >
                  <Search className="mr-2 h-4 w-4" />
                  पिकअप टाइम चेक करें / Check Pickup Time
                </Button>
                <Button
                  onClick={handleReset}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold"
                  data-ocid="seller.reset.button"
                >
                  एक और लिस्टिंग करें / Submit Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-gradient min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Hero section */}
        <div className="text-center space-y-2 pt-2 pb-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold font-display mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            Mobile Kabadi Wala
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground leading-tight">
            अपना मोबाइल बेचें
          </h2>
          <p className="text-lg font-semibold text-primary">Sell Your Mobile</p>
          <p className="text-muted-foreground text-sm">
            पुराना मोबाइल बेचें, अच्छे दाम पाएं{" "}
            <span className="text-foreground/60">
              / Sell your old mobile, get the best price
            </span>
          </p>
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-11 bg-muted/60 p-1 rounded-xl grid grid-cols-2">
            <TabsTrigger
              value="sell"
              className="font-display font-semibold text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="seller.sell.tab"
            >
              <Smartphone className="w-4 h-4 mr-1.5" />
              मोबाइल बेचें / Sell
            </TabsTrigger>
            <TabsTrigger
              value="check"
              className="font-display font-semibold text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-ocid="seller.check.tab"
            >
              <Search className="w-4 h-4 mr-1.5" />
              स्टेटस चेक / Status
            </TabsTrigger>
          </TabsList>

          {/* Sell Tab Content */}
          <TabsContent value="sell" className="mt-4">
            <Card className="shadow-card border-border/60 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary via-accent-foreground to-primary/60 w-full" />
              <CardContent className="p-5 sm:p-7">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  data-ocid="seller.form"
                >
                  {/* Brand */}
                  <div className="space-y-1.5">
                    <Label htmlFor="brand">
                      <BiLabel hindi="ब्रांड" english="Brand" />
                    </Label>
                    <Select
                      value={formData.brand}
                      onValueChange={(v) => {
                        setFormData((p) => ({ ...p, brand: v }));
                        setErrors((e) => ({ ...e, brand: undefined }));
                      }}
                    >
                      <SelectTrigger
                        id="brand"
                        className={`h-11 ${errors.brand ? "border-destructive" : ""}`}
                        data-ocid="seller.brand.select"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                          <SelectValue placeholder="ब्रांड चुनें / Select brand" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {BRANDS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.brand && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="seller.brand.error_state"
                      >
                        {errors.brand}
                      </p>
                    )}
                  </div>

                  {/* Model Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="modelName">
                      <BiLabel hindi="मॉडल" english="Model Name" />
                    </Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="modelName"
                        placeholder="जैसे: Galaxy A52 / e.g. Galaxy A52"
                        value={formData.modelName}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            modelName: e.target.value,
                          }));
                          setErrors((ev) => ({ ...ev, modelName: undefined }));
                        }}
                        className={`h-11 pl-9 ${errors.modelName ? "border-destructive" : ""}`}
                        data-ocid="seller.model.input"
                      />
                    </div>
                    {errors.modelName && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="seller.model.error_state"
                      >
                        {errors.modelName}
                      </p>
                    )}
                  </div>

                  {/* Storage + Condition row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Storage */}
                    <div className="space-y-1.5">
                      <Label htmlFor="storage">
                        <BiLabel hindi="स्टोरेज" english="Storage" />
                      </Label>
                      <Select
                        value={formData.storage}
                        onValueChange={(v) => {
                          setFormData((p) => ({ ...p, storage: v }));
                          setErrors((e) => ({ ...e, storage: undefined }));
                        }}
                      >
                        <SelectTrigger
                          id="storage"
                          className={`h-11 ${errors.storage ? "border-destructive" : ""}`}
                          data-ocid="seller.storage.select"
                        >
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                            <SelectValue placeholder="चुनें / Select" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {STORAGE_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.storage && (
                        <p className="text-destructive text-xs">
                          {errors.storage}
                        </p>
                      )}
                      {/* Storage rate badge */}
                      {formData.storage && selectedStorageRate > 0 && (
                        <Badge
                          className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 font-semibold text-xs px-2.5 py-1 font-display"
                          data-ocid="seller.storage.rate_badge"
                        >
                          <IndianRupee className="w-3 h-3" />
                          {formData.storage} की रेट: ₹
                          {selectedStorageRate.toLocaleString("en-IN")} / Rate:
                          ₹{selectedStorageRate.toLocaleString("en-IN")}
                        </Badge>
                      )}
                    </div>

                    {/* Condition */}
                    <div className="space-y-1.5">
                      <Label htmlFor="condition">
                        <BiLabel hindi="हालत" english="Condition" />
                      </Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(v) => {
                          setFormData((p) => ({ ...p, condition: v }));
                          setErrors((e) => ({ ...e, condition: undefined }));
                        }}
                      >
                        <SelectTrigger
                          id="condition"
                          className={`h-11 ${errors.condition ? "border-destructive" : ""}`}
                          data-ocid="seller.condition.select"
                        >
                          <SelectValue placeholder="चुनें / Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.condition && (
                        <p className="text-destructive text-xs">
                          {errors.condition}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="address">
                      <BiLabel hindi="एड्रेस" english="Address" />
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Textarea
                        id="address"
                        placeholder="घर का पता लिखें / Enter your address"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p,
                            address: e.target.value,
                          }));
                          setErrors((ev) => ({ ...ev, address: undefined }));
                        }}
                        className={`pl-9 min-h-[80px] resize-none ${errors.address ? "border-destructive" : ""}`}
                        data-ocid="seller.address.textarea"
                      />
                    </div>
                    {errors.address && (
                      <p
                        className="text-destructive text-xs"
                        data-ocid="seller.address.error_state"
                      >
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Seller Name + Phone row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Seller Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="sellerName">
                        <BiLabel hindi="नाम" english="Seller Name" />
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="sellerName"
                          placeholder="आपका नाम / Your name"
                          value={formData.sellerName}
                          onChange={(e) => {
                            setFormData((p) => ({
                              ...p,
                              sellerName: e.target.value,
                            }));
                            setErrors((ev) => ({
                              ...ev,
                              sellerName: undefined,
                            }));
                          }}
                          className={`h-11 pl-9 ${errors.sellerName ? "border-destructive" : ""}`}
                          data-ocid="seller.name.input"
                        />
                      </div>
                      {errors.sellerName && (
                        <p className="text-destructive text-xs">
                          {errors.sellerName}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phoneNumber">
                        <BiLabel hindi="फोन नंबर" english="Phone Number" />
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phoneNumber"
                          placeholder="10 अंक / 10 digits"
                          value={formData.phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10);
                            setFormData((p) => ({ ...p, phoneNumber: val }));
                            setErrors((ev) => ({
                              ...ev,
                              phoneNumber: undefined,
                            }));
                          }}
                          inputMode="numeric"
                          maxLength={10}
                          className={`h-11 pl-9 ${errors.phoneNumber ? "border-destructive" : ""}`}
                          data-ocid="seller.phone.input"
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p
                          className="text-destructive text-xs"
                          data-ocid="seller.phone.error_state"
                        >
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending || actorLoading}
                      className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-base shadow-glow transition-all duration-200 hover:shadow-card-hover"
                      data-ocid="seller.submit_button"
                    >
                      {submitMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          सबमिट हो रहा है... / Submitting...
                        </>
                      ) : (
                        "लिस्टिंग सबमिट करें / Submit Listing"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Check Status Tab Content */}
          <TabsContent value="check" className="mt-4">
            <CheckStatusTab prefillId={submittedId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
