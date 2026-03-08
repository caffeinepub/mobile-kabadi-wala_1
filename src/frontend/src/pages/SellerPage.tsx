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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  HardDrive,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Smartphone,
  Tag,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
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

const STORAGE_OPTIONS = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB"];

const CONDITION_OPTIONS = [
  { value: "Good", label: "Good (अच्छा)" },
  { value: "Average", label: "Average (ठीक-ठाक)" },
  { value: "Broken Screen", label: "Broken Screen (टूटी स्क्रीन)" },
  { value: "Heavy Damage", label: "Heavy Damage (ज्यादा खराब)" },
];

function BiLabel({ hindi, english }: { hindi: string; english: string }) {
  return (
    <span className="flex items-center gap-1.5 font-display font-semibold text-sm">
      <span className="text-primary">{hindi}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-foreground/80">{english}</span>
    </span>
  );
}

function PhotoUploadField({
  label,
  labelEnglish,
  previewUrl,
  uploadProgress,
  onFileChange,
  onClear,
  inputRef,
  dataOcid,
}: {
  label: string;
  labelEnglish: string;
  previewUrl: string | null;
  uploadProgress: number | null;
  onFileChange: (file: File) => void;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  dataOcid: string;
}) {
  return (
    <div className="space-y-2">
      <Label>
        <span className="flex items-center gap-2 font-display font-semibold text-sm">
          <Camera className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary">{label}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground/80">{labelEnglish}</span>
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">
            वैकल्पिक / Optional
          </span>
        </span>
      </Label>

      {previewUrl ? (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={labelEnglish}
            className="w-32 h-32 object-cover rounded-xl border-2 border-primary/30 shadow-sm"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {uploadProgress !== null && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>अपलोड हो रहा है / Uploading... {uploadProgress}%</span>
              </div>
              <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-3 border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 w-full text-left transition-all duration-200 hover:bg-primary/5 group"
          data-ocid={dataOcid}
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
            <ImageIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              फोटो चुनें / Choose Photo
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP सपोर्टेड
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChange(file);
        }}
      />
    </div>
  );
}

export function SellerPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );

  // Photo state
  const [mobilePhotoFile, setMobilePhotoFile] = useState<File | null>(null);
  const [mobilePhotoPreview, setMobilePhotoPreview] = useState<string | null>(
    null,
  );
  const [mobileUploadProgress, setMobileUploadProgress] = useState<
    number | null
  >(null);

  const [motherboardPhotoFile, setMotherboardPhotoFile] = useState<File | null>(
    null,
  );
  const [motherboardPhotoPreview, setMotherboardPhotoPreview] = useState<
    string | null
  >(null);
  const [motherboardUploadProgress, setMotherboardUploadProgress] = useState<
    number | null
  >(null);

  const mobilePhotoRef = useRef<HTMLInputElement>(null);
  const motherboardPhotoRef = useRef<HTMLInputElement>(null);

  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();

  const handleMobilePhotoChange = (file: File) => {
    setMobilePhotoFile(file);
    const url = URL.createObjectURL(file);
    setMobilePhotoPreview(url);
    setMobileUploadProgress(null);
  };

  const handleMotherboardPhotoChange = (file: File) => {
    setMotherboardPhotoFile(file);
    const url = URL.createObjectURL(file);
    setMotherboardPhotoPreview(url);
    setMotherboardUploadProgress(null);
  };

  const clearMobilePhoto = () => {
    if (mobilePhotoPreview) URL.revokeObjectURL(mobilePhotoPreview);
    setMobilePhotoFile(null);
    setMobilePhotoPreview(null);
    setMobileUploadProgress(null);
    if (mobilePhotoRef.current) mobilePhotoRef.current.value = "";
  };

  const clearMotherboardPhoto = () => {
    if (motherboardPhotoPreview) URL.revokeObjectURL(motherboardPhotoPreview);
    setMotherboardPhotoFile(null);
    setMotherboardPhotoPreview(null);
    setMotherboardUploadProgress(null);
    if (motherboardPhotoRef.current) motherboardPhotoRef.current.value = "";
  };

  const fileToUint8Array = (file: File): Promise<Uint8Array<ArrayBuffer>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buf = e.target?.result as ArrayBuffer;
        resolve(new Uint8Array(buf));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!actor) throw new Error("Actor not ready");

      let mobilePhotoBlobId: string | undefined;
      let motherboardPhotoBlobId: string | undefined;

      // Upload mobile photo if provided
      if (mobilePhotoFile) {
        setMobileUploadProgress(10);
        const bytes = await fileToUint8Array(mobilePhotoFile);
        setMobileUploadProgress(40);
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
          setMobileUploadProgress(40 + Math.round(pct * 0.55)),
        );
        setMobileUploadProgress(70);
        mobilePhotoBlobId = blob.getDirectURL();
        setMobileUploadProgress(100);
      }

      // Upload motherboard photo if provided
      if (motherboardPhotoFile) {
        setMotherboardUploadProgress(10);
        const bytes = await fileToUint8Array(motherboardPhotoFile);
        setMotherboardUploadProgress(40);
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
          setMotherboardUploadProgress(40 + Math.round(pct * 0.55)),
        );
        setMotherboardUploadProgress(70);
        motherboardPhotoBlobId = blob.getDirectURL();
        setMotherboardUploadProgress(100);
      }

      return actor.submitListing({
        brand: data.brand,
        modelName: data.modelName,
        storage: data.storage,
        condition: data.condition,
        address: data.address,
        description: "",
        sellerName: data.sellerName,
        phoneNumber: data.phoneNumber,
        ...(mobilePhotoBlobId !== undefined && { mobilePhotoBlobId }),
        ...(motherboardPhotoBlobId !== undefined && { motherboardPhotoBlobId }),
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["newListingsCount"] });
      queryClient.invalidateQueries({ queryKey: ["allListings"] });
      toast.success("लिस्टिंग सबमिट हो गई! / Listing submitted!");
    },
    onError: () => {
      setMobileUploadProgress(null);
      setMotherboardUploadProgress(null);
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
    setErrors({});
    clearMobilePhoto();
    clearMotherboardPhoto();
  };

  if (submitted) {
    return (
      <div className="hero-gradient min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md animate-scale-in"
          data-ocid="seller.success_state"
        >
          <Card className="shadow-card-hover border-primary/20 overflow-hidden">
            <div className="h-2 bg-primary w-full" />
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="font-display font-bold text-2xl text-foreground">
                  आपकी लिस्टिंग मिल गई!
                </h2>
                <p className="text-lg font-semibold text-primary">
                  Your listing has been received!
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                  हम जल्द ही आपसे संपर्क करेंगे।
                  <br />
                  <span className="text-foreground/70">
                    We will contact you soon.
                  </span>
                </p>
              </div>
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
              <Button
                onClick={handleReset}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-semibold"
                data-ocid="seller.reset.button"
              >
                एक और लिस्टिंग करें / Submit Another
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-gradient min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero section */}
        <div className="text-center space-y-2 pt-2 pb-4">
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

        {/* Form card */}
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
                      setFormData((p) => ({ ...p, modelName: e.target.value }));
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
                    <p className="text-destructive text-xs">{errors.storage}</p>
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
                      setFormData((p) => ({ ...p, address: e.target.value }));
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

              {/* Photo uploads */}
              <div className="space-y-4 rounded-xl bg-muted/30 border border-border/40 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  फोटो अपलोड (वैकल्पिक) / Photo Upload (Optional)
                </p>

                {/* Mobile Photo */}
                <PhotoUploadField
                  label="मोबाइल फोटो"
                  labelEnglish="Mobile Photo"
                  previewUrl={mobilePhotoPreview}
                  uploadProgress={mobileUploadProgress}
                  onFileChange={handleMobilePhotoChange}
                  onClear={clearMobilePhoto}
                  inputRef={mobilePhotoRef}
                  dataOcid="seller.mobile-photo.upload_button"
                />

                {/* Motherboard Photo */}
                <PhotoUploadField
                  label="मदरबोर्ड फोटो"
                  labelEnglish="Motherboard Photo"
                  previewUrl={motherboardPhotoPreview}
                  uploadProgress={motherboardUploadProgress}
                  onFileChange={handleMotherboardPhotoChange}
                  onClear={clearMotherboardPhoto}
                  inputRef={motherboardPhotoRef}
                  dataOcid="seller.motherboard-photo.upload_button"
                />
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
                        setErrors((ev) => ({ ...ev, sellerName: undefined }));
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
                        setErrors((ev) => ({ ...ev, phoneNumber: undefined }));
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
      </div>
    </div>
  );
}
