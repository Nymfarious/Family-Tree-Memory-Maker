// src/components/notes-popup.tsx
// Family Tree Memory Maker v2.2
// Colorful popup for viewing and editing person notes

import { useState, useEffect } from 'react';
import { 
  StickyNote, X, Plus, Trash2, Pin, Edit2, Check,
  Palette, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Note colors with their tailwind classes
const NOTE_COLORS = [
  { name: 'Yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-900 dark:text-yellow-100' },
  { name: 'Pink', bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-900 dark:text-pink-100' },
  { name: 'Blue', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-900 dark:text-blue-100' },
  { name: 'Green', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-300 dark:border-green-700', text: 'text-green-900 dark:text-green-100' },
  { name: 'Purple', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-100' },
  { name: 'Orange', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-900 dark:text-orange-100' },
  { name: 'Cyan', bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-900 dark:text-cyan-100' },
  { name: 'Dirk Gray', bg: 'bg-dirk-100 dark:bg-dirk-800', border: 'border-dirk-300 dark:border-dirk-600', text: 'text-dirk-900 dark:text-dirk-100' },
];

export interface PersonNote {
  id: string;
  title?: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesPopupProps {
  open: boolean;
  onClose: () => void;
  personId: string;
  personName: string;
  notes: PersonNote[];
  onNotesChange: (notes: PersonNote[]) => void;
}

export function NotesPopup({
  open,
  onClose,
  personId,
  personName,
  notes,
  onNotesChange,
}: NotesPopupProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('Yellow');
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState('Yellow');

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const getColorClasses = (colorName: string) => {
    return NOTE_COLORS.find(c => c.name === colorName) || NOTE_COLORS[0];
  };

  const handleAddNote = () => {
    if (!newContent.trim()) return;

    const newNote: PersonNote = {
      id: crypto.randomUUID(),
      title: newTitle.trim() || undefined,
      content: newContent.trim(),
      color: newColor,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onNotesChange([...notes, newNote]);
    setNewContent('');
    setNewTitle('');
    setNewColor('Yellow');
    setIsAdding(false);
  };

  const handleEditNote = (note: PersonNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditTitle(note.title || '');
    setEditColor(note.color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;

    const updated = notes.map(note => 
      note.id === editingId 
        ? { 
            ...note, 
            content: editContent.trim(),
            title: editTitle.trim() || undefined,
            color: editColor,
            updatedAt: new Date()
          }
        : note
    );

    onNotesChange(updated);
    setEditingId(null);
    setEditContent('');
    setEditTitle('');
  };

  const handleDeleteNote = (id: string) => {
    onNotesChange(notes.filter(n => n.id !== id));
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map(note =>
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    );
    onNotesChange(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-yellow-500" />
            Notes for {personName}
            <Badge variant="secondary">{notes.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {/* Add New Note Button */}
            {!isAdding && (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            )}

            {/* Add New Note Form */}
            {isAdding && (
              <Card className="border-2 border-dashed border-primary/50">
                <CardContent className="pt-4 space-y-3">
                  <Input
                    placeholder="Note title (optional)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="font-medium"
                  />
                  <Textarea
                    placeholder="Write your note here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  
                  {/* Color Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Color:</span>
                    <div className="flex gap-1">
                      {NOTE_COLORS.map((color) => (
                        <Tooltip key={color.name}>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-transform",
                                color.bg,
                                color.border,
                                newColor === color.name && "scale-110 ring-2 ring-primary ring-offset-2"
                              )}
                              onClick={() => setNewColor(color.name)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>{color.name}</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleAddNote} disabled={!newContent.trim()}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes List */}
            {sortedNotes.map((note) => {
              const colorClasses = getColorClasses(note.color);
              const isEditing = editingId === note.id;

              return (
                <Card 
                  key={note.id}
                  className={cn(
                    "relative transition-all",
                    colorClasses.bg,
                    colorClasses.border,
                    "border-2",
                    note.isPinned && "ring-2 ring-primary/50"
                  )}
                >
                  {/* Pin indicator */}
                  {note.isPinned && (
                    <div className="absolute -top-2 -right-2">
                      <Pin className="h-4 w-4 text-primary fill-primary" />
                    </div>
                  )}

                  <CardContent className="pt-3 pb-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Note title"
                          className="font-medium bg-transparent border-dashed"
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="bg-transparent border-dashed"
                          autoFocus
                        />
                        
                        {/* Color picker in edit mode */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Color:</span>
                          <div className="flex gap-1">
                            {NOTE_COLORS.map((color) => (
                              <button
                                key={color.name}
                                className={cn(
                                  "w-5 h-5 rounded-full border-2",
                                  color.bg,
                                  color.border,
                                  editColor === color.name && "scale-110 ring-2 ring-primary ring-offset-1"
                                )}
                                onClick={() => setEditColor(color.name)}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {note.title && (
                          <h4 className={cn("font-semibold text-sm mb-1", colorClasses.text)}>
                            {note.title}
                          </h4>
                        )}
                        <p className={cn("text-sm whitespace-pre-wrap", colorClasses.text)}>
                          {note.content}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
                          <span className="text-xs opacity-60">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleTogglePin(note.id)}
                                >
                                  <Pin className={cn(
                                    "h-3 w-3",
                                    note.isPinned && "fill-current"
                                  )} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {note.isPinned ? 'Unpin' : 'Pin to top'}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleEditNote(note)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit note</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteNote(note.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete note</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Empty state */}
            {notes.length === 0 && !isAdding && (
              <div className="text-center py-8">
                <StickyNote className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No notes yet.</p>
                <p className="text-sm text-muted-foreground">
                  Click "Add Note" to record memories, stories, or research notes.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default NotesPopup;
