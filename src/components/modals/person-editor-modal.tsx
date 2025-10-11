import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, Briefcase, Calendar, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Person } from "@/types/gedcom";

interface PersonEditorModalProps {
  open: boolean;
  onClose: () => void;
  person?: Person;
  onSave?: (person: Person) => void;
}

export function PersonEditorModal({ open, onClose, person, onSave }: PersonEditorModalProps) {
  const [editedPerson, setEditedPerson] = useState<Person>(person || {} as Person);
  const { toast } = useToast();

  const handleSave = () => {
    if (onSave) {
      onSave(editedPerson);
    }
    toast({
      title: "Person Updated",
      description: "Changes have been saved to the family tree.",
    });
    onClose();
  };

  const updateField = (field: keyof Person, value: any) => {
    setEditedPerson(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Person Details
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Given Name</Label>
              <Input
                id="name"
                value={editedPerson.name || ""}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="First/Given Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surname">Surname</Label>
              <Input
                id="surname"
                value={editedPerson.surname || ""}
                onChange={(e) => updateField('surname', e.target.value)}
                placeholder="Last/Family Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={editedPerson.nickname || ""}
                onChange={(e) => updateField('nickname', e.target.value)}
                placeholder="Nickname or preferred name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Input
                id="sex"
                value={editedPerson.sex || ""}
                onChange={(e) => updateField('sex', e.target.value)}
                placeholder="M, F, or other"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="birth">Birth Date</Label>
                <Input
                  id="birth"
                  value={editedPerson.birth || ""}
                  onChange={(e) => updateField('birth', e.target.value)}
                  placeholder="e.g., 1 Jan 1950"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="death">Death Date</Label>
                <Input
                  id="death"
                  value={editedPerson.death || ""}
                  onChange={(e) => updateField('death', e.target.value)}
                  placeholder="e.g., 15 Dec 2020"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="birthPlace" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Birth Place
              </Label>
              <Input
                id="birthPlace"
                value={editedPerson.birthPlace || ""}
                onChange={(e) => updateField('birthPlace', e.target.value)}
                placeholder="City, State, Country"
              />
              <p className="text-xs text-muted-foreground">
                This location will appear on the Map View
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deathPlace" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Death Place
              </Label>
              <Input
                id="deathPlace"
                value={editedPerson.deathPlace || ""}
                onChange={(e) => updateField('deathPlace', e.target.value)}
                placeholder="City, State, Country"
              />
              <p className="text-xs text-muted-foreground">
                This location will appear on the Map View
              </p>
            </div>
          </TabsContent>

          <TabsContent value="other" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="occupation" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Occupation
              </Label>
              <Input
                id="occupation"
                value={editedPerson.occupation || ""}
                onChange={(e) => updateField('occupation', e.target.value)}
                placeholder="Job or profession"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maidenName">Maiden Name</Label>
              <Input
                id="maidenName"
                value={editedPerson.maidenName || ""}
                onChange={(e) => updateField('maidenName', e.target.value)}
                placeholder="Birth surname (if changed)"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground">
                Additional fields like education, military service, and custom notes will be available in future updates.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}