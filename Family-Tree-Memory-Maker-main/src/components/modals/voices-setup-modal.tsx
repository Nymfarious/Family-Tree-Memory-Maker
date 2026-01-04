import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, Play, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface VoicesSetupModalProps {
  open: boolean;
  onClose: () => void;
}

export function VoicesSetupModal({ open, onClose }: VoicesSetupModalProps) {
  const [aiResponseVoice, setAiResponseVoice] = useState("alloy");
  const [transcriptionVoice, setTranscriptionVoice] = useState("echo");
  const [aiResponseVolume, setAiResponseVolume] = useState(0.8);
  const [transcriptionVolume, setTranscriptionVolume] = useState(0.8);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const { toast } = useToast();
  const sampleText = "The quick brown fox jumps over the lazy dog";

  useEffect(() => {
    const saved = localStorage.getItem('voice-preferences');
    if (saved) {
      const prefs = JSON.parse(saved);
      setAiResponseVoice(prefs.aiResponseVoice || "alloy");
      setTranscriptionVoice(prefs.transcriptionVoice || "echo");
      setAiResponseVolume(prefs.aiResponseVolume || 0.8);
      setTranscriptionVolume(prefs.transcriptionVolume || 0.8);
    }
  }, [open]);

  const handleSave = () => {
    const preferences = {
      aiResponseVoice,
      transcriptionVoice,
      aiResponseVolume,
      transcriptionVolume,
    };
    localStorage.setItem('voice-preferences', JSON.stringify(preferences));
    toast({
      title: "Voice Settings Saved",
      description: "Voice preferences have been updated.",
    });
    onClose();
  };

  const handlePreview = async (voice: string, volume: number) => {
    setPlayingVoice(voice);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            text: sampleText,
            voice: voice,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate voice preview');
      }

      const data = await response.json();
      const audioData = atob(data.audioContent);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.volume = volume;

      audio.onended = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Preview Error",
          description: "Unable to play voice preview.",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      setPlayingVoice(null);
      toast({
        title: "Preview Error",
        description: error instanceof Error ? error.message : "Voice preview failed. Make sure OpenAI API key is configured.",
        variant: "destructive",
      });
    }
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
                onClick={() => handlePreview(aiResponseVoice, aiResponseVolume)}
                disabled={playingVoice === aiResponseVoice}
              >
                {playingVoice === aiResponseVoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ai-volume" className="text-xs text-muted-foreground">Volume</Label>
              <Slider
                id="ai-volume"
                value={[aiResponseVolume]}
                onValueChange={([value]) => setAiResponseVolume(value)}
                max={1}
                step={0.1}
                className="w-full"
              />
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
                onClick={() => handlePreview(transcriptionVoice, transcriptionVolume)}
                disabled={playingVoice === transcriptionVoice}
              >
                {playingVoice === transcriptionVoice ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="space-y-1">
              <Label htmlFor="transcription-volume" className="text-xs text-muted-foreground">Volume</Label>
              <Slider
                id="transcription-volume"
                value={[transcriptionVolume]}
                onValueChange={([value]) => setTranscriptionVolume(value)}
                max={1}
                step={0.1}
                className="w-full"
              />
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