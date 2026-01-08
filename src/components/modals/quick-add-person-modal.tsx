import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Save, ChevronDown, Baby, Skull, StickyNote } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Person } from "@/types/gedcom";

interface QuickAddPersonModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (person: Person) => void;
}

export function QuickAddPersonModal({ open, onClose, onSave }: QuickAddPersonModalProps) {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [sex, setSex] = useState<string>("");
  const [birth, setBirth] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [death, setDeath] = useState("");
  const [deathPlace, setDeathPlace] = useState("");
  const [notes, setNotes] = useState("");
  const [deathOpen, setDeathOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter at least a given name for this person.",
        variant: "destructive",
      });
      return;
    }

    const newPerson: Person = {
      id: crypto.randomUUID(),
      name: name.trim(),
      surname: surname.trim() || undefined,
      sex: sex || undefined,
      birth: birth.trim() || undefined,
      birthPlace: birthPlace.trim() || undefined,
      death: death.trim() || undefined,
      deathPlace: deathPlace.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(newPerson);
    toast({
      title: "Person Added",
      description: `${name} ${surname} has been added to the family tree.`,
    });
    
    // Reset form
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName("");
    setSurname("");
    setSex("");
    setBirth("");
    setBirthPlace("");
    setDeath("");
    setDeathPlace("");
    setNotes("");
    setDeathOpen(false);
    setNotesOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Check if person is likely deceased (birth year > 120 years ago)
  const suggestDeceased = () => {
    if (!birth) return false;
    const yearMatch = birth.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    if (yearMatch) {
      const birthYear = parseInt(yearMatch[1]);
      const currentYear = new Date().getFullYear();
      return currentYear - birthYear > 120;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Quick Add Person
          </DialogTitle>
          <DialogDescription>
            Add basic info for a new person. You can add more details later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="quick-name">Given Name *</Label>
            <Input
              id="quick-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First/Given Name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-surname">Surname</Label>
            <Input
              id="quick-surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Last/Family Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-sex">Sex</Label>
            <Select value={sex} onValueChange={setSex}>
              <SelectTrigger id="quick-sex">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
                <SelectItem value="X">Other/Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Birth Info */}
          <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Baby className="h-4 w-4" />
              <Label className="font-medium">Birth Information</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quick-birth" className="text-xs text-muted-foreground">Date</Label>
                <Input
                  id="quick-birth"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  placeholder="e.g., 15 Mar 1950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-birthPlace" className="text-xs text-muted-foreground">Place</Label>
                <Input
                  id="quick-birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="City, State, Country"
                />
              </div>
            </div>
          </div>

          {/* Death Info - Collapsible */}
          <Collapsible open={deathOpen} onOpenChange={setDeathOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Skull className="h-4 w-4 text-gray-500" />
                  Death Information
                  {(death || deathPlace) && (
                    <Badge variant="secondary" className="text-[10px]">Added</Badge>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${deathOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="p-3 rounded-lg border border-gray-500/30 bg-gray-500/5 space-y-3">
                {suggestDeceased() && !death && (
                  <div className="text-xs text-muted-foreground bg-yellow-500/10 border border-yellow-500/30 p-2 rounded">
                    💡 Based on birth year, this person may be deceased. Consider adding death info if known.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="quick-death" className="text-xs text-muted-foreground">Date</Label>
                    <Input
                      id="quick-death"
                      value={death}
                      onChange={(e) => setDeath(e.target.value)}
                      placeholder="e.g., 20 Jun 2010"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-deathPlace" className="text-xs text-muted-foreground">Place</Label>
                    <Input
                      id="quick-deathPlace"
                      value={deathPlace}
                      onChange={(e) => setDeathPlace(e.target.value)}
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Notes - Collapsible */}
          <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                type="button"
              >
                <span className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-yellow-500" />
                  Notes
                  {notes && (
                    <Badge variant="secondary" className="text-[10px]">Added</Badge>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 space-y-2">
                <Label htmlFor="quick-notes" className="text-xs text-muted-foreground">Personal Notes</Label>
                <Textarea
                  id="quick-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this person..."
                  className="min-h-[80px] resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  Notes are private and only visible to you.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Tips */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">
              💡 Tip: After adding, click on the person card to edit more details, add media, or link to family members.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
