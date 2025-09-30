import { useState, useEffect } from "react";
import JSZip from "jszip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Archive } from "lucide-react";

interface ImportGedcomModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (content: string, filename: string, generations: number) => void;
  file: File | null;
}

export function ImportGedcomModal({ open, onClose, onImport, file }: ImportGedcomModalProps) {
  const [step, setStep] = useState<"rename" | "select" | "generations">("rename");
  const [filename, setFilename] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gedcomFiles, setGedcomFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [generations, setGenerations] = useState<number>(7);
  const [isZip, setIsZip] = useState(false);

  useEffect(() => {
    if (file && open) {
      const name = file.name.replace(/\.(ged|gedcom|zip|rar|7z)$/i, "");
      setFilename(name);
      setIsZip(file.name.match(/\.(zip|rar|7z)$/i) !== null);
      setStep("rename");
      setGedcomFiles([]);
      setSelectedFile("");
      setGenerations(7);
    }
  }, [file, open]);

  const handleRename = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      if (isZip) {
        // Decompress ZIP file
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
        // Single GEDCOM file
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
    onImport(selected.content, filename, generations);
    onClose();
  };

  const handleClose = () => {
    setStep("rename");
    setFilename("");
    setIsProcessing(false);
    setGedcomFiles([]);
    setSelectedFile("");
    setGenerations(7);
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
                <Label htmlFor="filename">File Name</Label>
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
              <DialogTitle>Select Generations</DialogTitle>
              <DialogDescription>
                Choose how many consecutive generations to display (3-7)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
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
                  max={7}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>3 (Minimum)</span>
                  <span>7 (Maximum)</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                Selected file: <code className="bg-muted px-1 py-0.5 rounded">{selectedFile}</code>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport}>
                Import
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
