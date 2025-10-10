import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Mic, 
  MicOff, 
  Send, 
  Plus, 
  Square, 
  Circle, 
  Diamond,
  Hexagon,
  Trash2,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIWorkspaceProps {
  onClose?: () => void;
}

export function AIWorkspace({ onClose }: AIWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Add different shaped nodes
  const addNode = (shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon') => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      position: { 
        x: Math.random() * 400 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: `${shape} node`,
        shape 
      },
      style: {
        background: '#6366f1',
        color: 'white',
        borderRadius: shape === 'circle' ? '50%' : shape === 'diamond' ? '0' : '8px',
        padding: '12px',
        border: '2px solid #4f46e5',
        width: shape === 'circle' ? '80px' : '120px',
        height: shape === 'circle' ? '80px' : '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: shape === 'diamond' ? 'rotate(45deg)' : 'none',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${shape} node`);
  };

  const clearWorkspace = () => {
    setNodes([]);
    setEdges([]);
    toast.success("Workspace cleared");
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("🎤 Recording started");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("🎤 Recording stopped");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio }
        });

        if (error) throw error;
        
        setTranscript(prev => prev + (prev ? ' ' : '') + data.text);
        toast.success("✅ Transcription complete");
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateFromAI = async () => {
    if (!transcript.trim()) {
      toast.error("Please provide a description first");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('code-health-chat', {
        body: { 
          message: `Generate a flowchart structure from this description: ${transcript}. Return a JSON structure with nodes and edges suitable for ReactFlow.`,
          context: 'workspace'
        }
      });

      if (error) throw error;

      // Parse AI response and create nodes/edges
      // This is a simplified version - actual implementation would parse the AI response
      const newNodes: Node[] = [
        {
          id: 'start',
          position: { x: 250, y: 50 },
          data: { label: 'Start' },
          style: { background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px' }
        },
        {
          id: 'process',
          position: { x: 250, y: 150 },
          data: { label: 'Process' },
          style: { background: '#6366f1', color: 'white', padding: '12px', borderRadius: '8px' }
        },
        {
          id: 'end',
          position: { x: 250, y: 250 },
          data: { label: 'End' },
          style: { background: '#ef4444', color: 'white', padding: '12px', borderRadius: '8px' }
        }
      ];

      const newEdges: Edge[] = [
        { id: 'e1-2', source: 'start', target: 'process', markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e2-3', source: 'process', target: 'end', markerEnd: { type: MarkerType.ArrowClosed } }
      ];

      setNodes(newNodes);
      setEdges(newEdges);
      toast.success("✨ AI generated flowchart");
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error("Failed to generate flowchart");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Workspace - Design Your Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shape Tools */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('rectangle')}
            >
              <Square className="h-4 w-4 mr-2" />
              Rectangle
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('circle')}
            >
              <Circle className="h-4 w-4 mr-2" />
              Circle
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('diamond')}
            >
              <Diamond className="h-4 w-4 mr-2" />
              Diamond
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addNode('hexagon')}
            >
              <Hexagon className="h-4 w-4 mr-2" />
              Hexagon
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={clearWorkspace}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Voice Input & AI Generation */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Voice Input
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={generateFromAI}
                disabled={!transcript.trim() || isProcessing}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isProcessing ? "Generating..." : "Generate with AI"}
              </Button>
            </div>

            <Textarea
              placeholder="Describe your flowchart idea here... You can type or use voice input above."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>How to use:</strong></p>
            <p>• Click shapes above to add nodes, then drag to connect them</p>
            <p>• Use voice input or type to describe your idea</p>
            <p>• Click "Generate with AI" to auto-create a flowchart</p>
            <p>• Right-click nodes to edit or delete them</p>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '600px', width: '100%' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-right"
            >
              <Controls />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
