import { useState, useEffect, useMemo } from "react";
import JSZip from "jszip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileText, Archive, Infinity, Users, GitBranch } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ImportGedcomModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (content: string, filename: string, generations: number) => void;
  file: File | null;
}

interface GedcomStats {
  totalPeople: number;
  totalFamilies: number;
  maxGenerations: number;
  oldestYear: number | null;
  newestYear: number | null;
}

// Quick parse to get stats without full parsing
function getGedcomStats(content: string): GedcomStats {
  const stats: GedcomStats = {
    totalPeople: 0,
    totalFamilies: 0,
    maxGenerations: 0,
    oldestYear: null,
    newestYear: null,
  };

  // Count individuals and families
  const indiMatches = content.match(/^0 @[^@]+@ INDI$/gm);
  const famMatches = content.match(/^0 @[^@]+@ FAM$/gm);
  
  stats.totalPeople = indiMatches?.length || 0;
  stats.totalFamilies = famMatches?.length || 0;

  // Extract years from dates
  const yearMatches = content.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/g);
  if (yearMatches) {
    const years = yearMatches.map(y => parseInt(y)).filter(y => y > 1400 && y < 2100);
    if (years.length > 0) {
      stats.oldestYear = Math.min(...years);
      stats.newestYear = Math.max(...years);
    }
  }

  // Estimate generations based on year span
  // Average generation is ~25-30 years
  if (stats.oldestYear && stats.newestYear) {
    const yearSpan = stats.newestYear - stats.oldestYear;
    stats.maxGenerations = Math.max(1, Math.ceil(yearSpan / 28)); // ~28 years per generation
  } else {
    // Fallback: estimate based on family count
    // Each family roughly represents connections between generations
    stats.maxGenerations = Math.max(1, Math.ceil(Math.log2(stats.totalFamilies + 1)) + 1);
  }

  // Cap at reasonable max
  stats.maxGenerations = Math.min(stats.maxGenerations, 20);

  return stats;
}

export function ImportGedcomModal({ open, onClose, onImport, file }: ImportGedcomModalProps) {
  const [step, setStep] = useState<"rename" | "select" | "generations">("rename");
  const [filename, setFilename] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gedcomFiles, setGedcomFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [generations, setGenerations] = useState<number>(11);
  const [importAll, setImportAll] = useState<boolean>(true);
  const [isZip, setIsZip] = useState(false);

  // Calculate stats for the selected file
  const fileStats = useMemo(() => {
    const selected = gedcomFiles.find(f => f.name === selectedFile);
    if (!selected) return null;
    return getGedcomStats(selected.content);
  }, [gedcomFiles, selectedFile]);

  useEffect(() => {
    if (file && open) {
      const name = file.name.replace(/\.(ged|gedcom|zip|rar|7z)$/i, "");
      setFilename(name);
      setIsZip(file.name.match(/\.(zip|rar|7z)$/i) !== null);
      setStep("rename");
      setGedcomFiles([]);
      setSelectedFile("");
      setGenerations(11);
      setImportAll(true);
    }
  }, [file, open]);

  const handleRename = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      if (isZip) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        const gedFiles: Array<{ name: string; content: string }> = [];

        for (const [path, zipEntry] of Object.entries(contents.files)) {
          if (!zipEntry.dir && path.match(/\.(ged|gedcom)$/i)) {
            const content = await zipEntry.async("text");
            gedFiles.push({ name: path, content });
          }
        }

        if (gedFiles.length === 0) {
          throw new Error("No GEDCOM files found in the archive");
        }

        setGedcomFiles(gedFiles);
        if (gedFiles.length === 1) {
          setSelectedFile(gedFiles[0].name);
          setStep("generations");
        } else {
          setStep("select");
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setGedcomFiles([{ name: filename, content: String(reader.result || "") }]);
          setSelectedFile(filename);
          setStep("generations");
          setIsProcessing(false);
        };
        reader.readAsText(file);
        return;
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process the file. Please try again.");
      onClose();
    }

    setIsProcessing(false);
  };

  const handleSelectFile = () => {
    if (!selectedFile) return;
    setStep("generations");
  };

  const handleImport = () => {
    const selected = gedcomFiles.find(f => f.name === selectedFile);
    if (!selected) return;
    
    // Use actual generation count when importing all, not 999
    const effectiveGenerations = importAll 
      ? (fileStats?.maxGenerations || 15) + 5 // Add buffer to ensure we get everything
      : generations;
    
    onImport(selected.content, filename, effectiveGenerations);
    onClose();
  };

  const handleClose = () => {
    setStep("rename");
    setFilename("");
    setIsProcessing(false);
    setGedcomFiles([]);
    setSelectedFile("");
    setGenerations(11);
    setImportAll(true);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "rename" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isZip ? <Archive className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                {isZip ? "Import Archive" : "Import GEDCOM"}
              </DialogTitle>
              <DialogDescription>
                {isZip 
                  ? "Give this archive a name before decompressing"
                  : "Give this GEDCOM file a name before importing"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="filename">Tree Name</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter a name for this tree"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Original: <code className="bg-muted px-1 py-0.5 rounded">{file?.name}</code>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleRename} disabled={!filename || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isZip ? "Decompress" : "Next"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "select" && (
          <>
            <DialogHeader>
              <DialogTitle>Select GEDCOM File</DialogTitle>
              <DialogDescription>
                Multiple GEDCOM files found. Choose which tree to import.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <RadioGroup value={selectedFile} onValueChange={setSelectedFile}>
                {gedcomFiles.map((file) => (
                  <div key={file.name} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50">
                    <RadioGroupItem value={file.name} id={file.name} />
                    <Label htmlFor={file.name} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {file.name}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSelectFile} disabled={!selectedFile}>
                Next
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "generations" && (
          <>
            <DialogHeader>
              <DialogTitle>Import Options</DialogTitle>
              <DialogDescription>
                Choose how much of the tree to import
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* File Stats */}
              {fileStats && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{fileStats.totalPeople.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">People</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">~{fileStats.maxGenerations}</p>
                      <p className="text-xs text-muted-foreground">Generations</p>
                    </div>
                  </div>
                  {fileStats.oldestYear && fileStats.newestYear && (
                    <div className="col-span-2 text-xs text-muted-foreground text-center">
                      Year range: {fileStats.oldestYear} – {fileStats.newestYear}
                    </div>
                  )}
                </div>
              )}

              {/* Import All Toggle */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-muted/30">
                <Checkbox
                  id="import-all"
                  checked={importAll}
                  onCheckedChange={(checked) => setImportAll(!!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="import-all" className="font-medium cursor-pointer flex items-center gap-2">
                    <Infinity className="h-4 w-4" />
                    Import Entire File
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fileStats 
                      ? `All ${fileStats.totalPeople.toLocaleString()} people (~${fileStats.maxGenerations} generations)`
                      : "Imports all generations in the GEDCOM"
                    }
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="secondary">Default</Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Importing the whole file ensures you don't miss any ancestors
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Generation Selector (only if not importing all) */}
              {!importAll && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Number of Generations</Label>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {generations}
                    </Badge>
                  </div>
                  <Slider
                    value={[generations]}
                    onValueChange={(value) => setGenerations(value[0])}
                    min={3}
                    max={11}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3 (Parents, Grandparents)</span>
                    <span>11 (Max display)</span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/30 p-2 rounded">
                    ⚠️ Limiting generations may exclude some ancestors from the tree views.
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                Selected file: <code className="bg-muted px-1 py-0.5 rounded">{selectedFile}</code>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport}>
                Import {importAll 
                  ? `All${fileStats ? ` (~${fileStats.maxGenerations} gen)` : ''}` 
                  : `${generations} Generations`
                }
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
