import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Gavel,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// Set up PDF.js worker
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

interface UploadedFile {
  id: string;
  file: File;
  status: "pending" | "processing" | "done" | "error";
}

interface AuctionEntry {
  serial: number;
  type: string;
  description: string;
  date: string;
  location: string;
  price: string;
  source: string;
}

const AUCTION_KEYWORDS = [
  "निलामी",
  "नीलामी",
  "auction",
  "बोली",
  "वाहन",
  "स्क्रैप",
  "पेड़",
  "लकड़ी",
  "सामान",
  "संपत्ति",
];

const TYPE_KEYWORDS: Record<string, string[]> = {
  "🌳 पेड़/लकड़ी": ["पेड़", "लकड़ी", "वन", "timber", "tree", "wood"],
  "🚗 वाहन": [
    "वाहन",
    "गाड़ी",
    "vehicle",
    "car",
    "truck",
    "motorcycle",
    "bike",
    "मोटर",
  ],
  "♻️ स्क्रैप": ["स्क्रैप", "scrap", "कबाड़", "lohaa", "लोहा"],
  "🏠 संपत्ति": ["संपत्ति", "भूमि", "property", "land", "जमीन", "plot", "मकान"],
  "📦 सामान": [
    "सामान",
    "निस्प्रयोजन",
    "furniture",
    "equipment",
    "goods",
    "material",
  ],
};

function detectAuctionType(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((k) => lowerText.includes(k.toLowerCase()))) {
      return type;
    }
  }
  return "🔖 अन्य";
}

function extractDate(text: string): string {
  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
  const matches = text.match(dateRegex);
  if (matches && matches.length > 0) return matches[0];

  const hindiMonths = [
    "जनवरी",
    "फरवरी",
    "मार्च",
    "अप्रैल",
    "मई",
    "जून",
    "जुलाई",
    "अगस्त",
    "सितंबर",
    "अक्तूबर",
    "अक्टूबर",
    "नवंबर",
    "दिसंबर",
  ];
  for (const month of hindiMonths) {
    const idx = text.indexOf(month);
    if (idx !== -1) {
      return text
        .substring(Math.max(0, idx - 10), idx + month.length + 10)
        .trim();
    }
  }
  return "—";
}

function extractLocation(text: string): string {
  const locKeywords = [
    "स्थान",
    "जिला",
    "थाना",
    "विभाग",
    "district",
    "location",
    "place",
    "तहसील",
  ];
  for (const kw of locKeywords) {
    const idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
      const snippet = text.substring(idx, idx + 60);
      const lines = snippet.split(/[\n,।]/);
      if (lines[0])
        return lines[0]
          .replace(kw, "")
          .replace(/:/, "")
          .trim()
          .substring(0, 50);
    }
  }
  return "—";
}

function extractPrice(text: string): string {
  const priceKeywords = [
    "₹",
    "रुपए",
    "रुपये",
    "मूल्य",
    "price",
    "amount",
    "Rs",
    "INR",
  ];
  for (const kw of priceKeywords) {
    const idx = text.toLowerCase().indexOf(kw.toLowerCase());
    if (idx !== -1) {
      const snippet = text.substring(idx, idx + 40);
      const numMatch = snippet.match(/[\d,]+(?:\.\d+)?/);
      if (numMatch) return `₹ ${numMatch[0]}`;
    }
  }
  return "—";
}

function parseAuctionsFromText(text: string, filename: string): AuctionEntry[] {
  const entries: AuctionEntry[] = [];
  const chunks = text.split(/\n{2,}|।\s*\n/);

  for (const chunk of chunks) {
    const hasKeyword = AUCTION_KEYWORDS.some((kw) =>
      chunk.toLowerCase().includes(kw.toLowerCase()),
    );
    if (!hasKeyword || chunk.trim().length < 20) continue;

    entries.push({
      serial: 0,
      type: detectAuctionType(chunk),
      description: chunk.replace(/\s+/g, " ").trim().substring(0, 200),
      date: extractDate(chunk),
      location: extractLocation(chunk),
      price: extractPrice(chunk),
      source: filename,
    });
  }

  if (
    entries.length === 0 &&
    AUCTION_KEYWORDS.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))
  ) {
    entries.push({
      serial: 0,
      type: detectAuctionType(text),
      description: text.replace(/\s+/g, " ").trim().substring(0, 200),
      date: extractDate(text),
      location: extractLocation(text),
      price: extractPrice(text),
      source: filename,
    });
  }

  return entries;
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += `${pageText}\n\n`;
  }
  return fullText;
}

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [auctions, setAuctions] = useState<AuctionEntry[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(newFiles: FileList | File[]) {
    const pdfs = Array.from(newFiles).filter(
      (f) => f.type === "application/pdf",
    );
    if (pdfs.length === 0) {
      toast.error("केवल PDF फ़ाइलें स्वीकार की जाती हैं");
      return;
    }
    const entries: UploadedFile[] = pdfs.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...entries]);
    toast.success(`${pdfs.length} फ़ाइल${pdfs.length > 1 ? "ें" : ""} जोड़ी गई`);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function clearAll() {
    setFiles([]);
    setAuctions([]);
  }

  async function extractAuctions() {
    if (files.length === 0) {
      toast.error("पहले PDF फ़ाइलें अपलोड करें");
      return;
    }
    setIsExtracting(true);
    setAuctions([]);
    const allEntries: AuctionEntry[] = [];

    for (const fileEntry of files) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id ? { ...f, status: "processing" } : f,
        ),
      );
      try {
        const text = await extractTextFromPDF(fileEntry.file);
        const entries = parseAuctionsFromText(text, fileEntry.file.name);
        allEntries.push(...entries);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id ? { ...f, status: "done" } : f,
          ),
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id ? { ...f, status: "error" } : f,
          ),
        );
        toast.error(`${fileEntry.file.name} पढ़ने में त्रुटि`);
      }
    }

    const numbered = allEntries.map((e, i) => ({ ...e, serial: i + 1 }));
    setAuctions(numbered);
    setIsExtracting(false);

    if (numbered.length > 0) {
      toast.success(`${numbered.length} निलामियाँ मिलीं!`);
    } else {
      toast.info("कोई निलामी नहीं मिली");
    }
  }

  async function downloadPDF() {
    if (auctions.length === 0) return;
    setIsGeneratingPDF(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74);
      doc.text("सार्वजनिक निलामी सूची", 148, 18, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const now = new Date();
      doc.text(
        `तैयारी की तारीख: ${now.toLocaleDateString("hi-IN")} ${now.toLocaleTimeString("hi-IN")}`,
        148,
        26,
        { align: "center" },
      );

      autoTable(doc, {
        startY: 32,
        head: [
          [
            "क्र.सं.",
            "निलामी का प्रकार",
            "विवरण",
            "तारीख",
            "स्थान/विभाग",
            "न्यूनतम मूल्य",
            "स्रोत फ़ाइल",
          ],
        ],
        body: auctions.map((a) => [
          a.serial,
          a.type,
          a.description,
          a.date,
          a.location,
          a.price,
          a.source,
        ]),
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [240, 250, 244] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 28 },
          2: { cellWidth: 70 },
          3: { cellWidth: 25 },
          4: { cellWidth: 35 },
          5: { cellWidth: 28 },
          6: { cellWidth: 40 },
        },
        margin: { left: 10, right: 10 },
      });

      doc.save("sarvajanik-nilami-suchi.pdf");
      toast.success("PDF डाउनलोड हो गई!");
    } catch {
      toast.error("PDF बनाने में त्रुटि");
    }
    setIsGeneratingPDF(false);
  }

  const statusIcon = (status: UploadedFile["status"]) => {
    if (status === "processing")
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    if (status === "done")
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "error")
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  const statusLabel = (status: UploadedFile["status"]) => {
    if (status === "processing") return "processing";
    if (status === "done") return "done";
    if (status === "error") return "error";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Header */}
      <header className="bg-foreground text-primary-foreground shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Gavel className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-primary-foreground leading-tight">
              सार्वजनिक निलामी निकालने वाला
            </h1>
            <p className="text-xs text-primary-foreground/60">
              PDF से निलामी जानकारी स्वचालित रूप से निकालें
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Upload Section */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              PDF फ़ाइलें अपलोड करें
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              data-ocid="upload.dropzone"
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && fileInputRef.current?.click()
              }
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    PDF फ़ाइलें यहाँ खींचें और छोड़ें
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    या नीचे बटन दबाएं
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="upload.upload_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  फ़ाइलें चुनें
                </Button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {files.length} फ़ाइल{files.length > 1 ? "ें" : ""} चुनी गई
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-ocid="upload.delete_button"
                      onClick={clearAll}
                      className="text-destructive hover:text-destructive h-7 px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      सभी हटाएं
                    </Button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {files.map((f, i) => (
                      <motion.div
                        key={f.id}
                        data-ocid={`upload.item.${i + 1}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                      >
                        {statusIcon(f.status)}
                        <span className="flex-1 text-sm truncate">
                          {f.file.name}
                        </span>
                        <Badge
                          variant={
                            f.status === "error" ? "destructive" : "secondary"
                          }
                          className="text-xs capitalize"
                        >
                          {statusLabel(f.status)}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Extract Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            data-ocid="extract.primary_button"
            disabled={files.length === 0 || isExtracting}
            onClick={extractAuctions}
            className="px-10 py-6 text-base font-semibold shadow-glow"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                निकाल रहा है...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                निलामी निकालें
              </>
            )}
          </Button>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {(auctions.length > 0 ||
            (files.some((f) => f.status === "done") && !isExtracting)) && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base font-display flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      {auctions.length > 0 ? (
                        <span>
                          <span className="text-primary font-bold">
                            {auctions.length}
                          </span>{" "}
                          निलामियाँ मिलीं
                        </span>
                      ) : (
                        "कोई निलामी नहीं मिली"
                      )}
                    </CardTitle>
                    {auctions.length > 0 && (
                      <Button
                        data-ocid="results.download_button"
                        onClick={downloadPDF}
                        disabled={isGeneratingPDF}
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        {isGeneratingPDF ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        PDF डाउनलोड करें
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {auctions.length > 0 ? (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-sm"
                        data-ocid="results.table"
                      >
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            {[
                              "क्र.सं.",
                              "निलामी का प्रकार",
                              "विवरण",
                              "तारीख",
                              "स्थान/विभाग",
                              "न्यूनतम मूल्य",
                              "स्रोत फ़ाइल",
                            ].map((h) => (
                              <th
                                key={h}
                                className="text-left px-4 py-3 font-semibold text-xs text-muted-foreground whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {auctions.map((auction) => (
                            <motion.tr
                              key={`${auction.source}-${auction.serial}`}
                              data-ocid={`results.row.${auction.serial}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: auction.serial * 0.04 }}
                              className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${
                                auction.serial % 2 === 0 ? "" : "bg-muted/20"
                              }`}
                            >
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                {auction.serial}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <Badge variant="secondary" className="text-xs">
                                  {auction.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 max-w-xs">
                                <p className="text-xs leading-relaxed line-clamp-3">
                                  {auction.description}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-xs whitespace-nowrap">
                                {auction.date}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {auction.location}
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-green-700 whitespace-nowrap">
                                {auction.price}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                  {auction.source}
                                </p>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div
                      data-ocid="results.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      <Gavel className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">कोई निलामी नहीं मिली</p>
                      <p className="text-sm mt-1">
                        PDF में निलामी संबंधी शब्द नहीं मिले। दूसरी फ़ाइल आज़माएं।
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        {files.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              {
                icon: "📄",
                title: "PDF अपलोड करें",
                desc: "सरकारी निलामी नोटिस, अखबार की PDFs या कोई भी सरकारी दस्तावेज़",
              },
              {
                icon: "🔍",
                title: "निकालें",
                desc: "निलामी निकालें बटन दबाएं — app स्वचालित रूप से सभी निलामियाँ ढूंढेगा",
              },
              {
                icon: "⬇️",
                title: "PDF डाउनलोड करें",
                desc: "निकाली गई सूची को PDF format में save करें और share करें",
              },
            ].map((step) => (
              <Card key={step.title} className="shadow-card border-border/60">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <h3 className="font-display font-semibold text-sm mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-5 text-center text-xs text-muted-foreground border-t border-border">
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
