import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Volume2, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface VoicesSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export function VoicesSetupModal({ open, onClose }: VoicesSetupModalProps) {
  const [aiResponseVoice, setAiResponseVoice] = useState("alloy");
  const [transcriptionVoice, setTranscriptionVoice] = useState("echo");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('voice-preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setAiResponseVoice(prefs.aiResponseVoice || "alloy");
      setTranscriptionVoice(prefs.transcriptionVoice || "echo");
    }
  }, [open]);

  const handleSave = () => {
    const preferences = {
      aiResponseVoice,
      transcriptionVoice,
    };
    localStorage.setItem('voice-preferences', JSON.stringify(preferences));
    toast({
      title: "Voice Settings Saved",
      description: "Voice preferences have been updated.",
    });
    onClose();
  };

  const handlePreview = (voice: string) => {
    toast({
      title: "Voice Preview",
      description: `Playing preview for ${voice} voice...`,
    });
  };

  const voiceOptions = [
    { value: "alloy", label: "Alloy (Neutral)" },
    { value: "echo", label: "Echo (Male)" },
    { value: "fable", label: "Fable (British Male)" },
    { value: "onyx", label: "Onyx (Deep Male)" },
    { value: "nova", label: "Nova (Female)" },
    { value: "shimmer", label: "Shimmer (Soft Female)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Voice Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="ai-voice">AI Response Voice</Label>
            <div className="flex gap-2">
              <Select value={aiResponseVoice} onValueChange={setAiResponseVoice}>
                <SelectTrigger id="ai-voice" className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => handlePreview(aiResponseVoice)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Voice used when AI reads responses aloud
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transcription-voice">Transcription Readback Voice</Label>
            <div className="flex gap-2">
              <Select value={transcriptionVoice} onValueChange={setTranscriptionVoice}>
                <SelectTrigger id="transcription-voice" className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voiceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => handlePreview(transcriptionVoice)}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Voice used to read back transcribed text
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}