import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Save } from "lucide-react";
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
    };

    onSave(newPerson);
    toast({
      title: "Person Added",
      description: `${name} ${surname} has been added to the family tree.`,
    });
    
    // Reset form
    setName("");
    setSurname("");
    setSex("");
    setBirth("");
    setBirthPlace("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setSurname("");
    setSex("");
    setBirth("");
    setBirthPlace("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quick-birth">Birth Date</Label>
              <Input
                id="quick-birth"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
                placeholder="e.g., 1950"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-birthPlace">Birth Place</Label>
              <Input
                id="quick-birthPlace"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="City, Country"
              />
            </div>
          </div>

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