import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Activity, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  Eye,
  Code2,
  FileCode,
  Layers,
  ArrowLeft
} from "lucide-react";

type LensType = 'quality' | 'risk' | 'performance';

// Initial nodes representing project structure
const initialNodes: Node[] = [
  // Core App Files
  { 
    id: 'app', 
    type: 'default',
    position: { x: 400, y: 50 }, 
    data: { 
      label: '📱 App.tsx',
      type: 'core',
      quality: 85,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'main', 
    position: { x: 400, y: 150 }, 
    data: { 
      label: '🚀 main.tsx',
      type: 'core',
      quality: 90,
      risk: 'low',
      performance: 95
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  
  // Pages
  { 
    id: 'index', 
    position: { x: 100, y: 250 }, 
    data: { 
      label: '🏠 Index',
      type: 'page',
      quality: 80,
      risk: 'low',
      performance: 85
    },
    style: { background: '#3b82f6', color: 'white', border: '2px solid #2563eb' }
  },
  { 
    id: 'auth', 
    position: { x: 300, y: 250 }, 
    data: { 
      label: '🔐 Auth',
      type: 'page',
      quality: 75,
      risk: 'medium',
      performance: 80
    },
    style: { background: '#eab308', color: 'white', border: '2px solid #ca8a04' }
  },
  { 
    id: 'codehealth', 
    position: { x: 500, y: 250 }, 
    data: { 
      label: '📊 CodeHealth',
      type: 'page',
      quality: 95,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  
  // Components
  { 
    id: 'family-tree-app', 
    position: { x: 100, y: 400 }, 
    data: { 
      label: '🌳 FamilyTreeApp',
      type: 'component',
      quality: 70,
      risk: 'medium',
      performance: 75
    },
    style: { background: '#f59e0b', color: 'white', border: '2px solid #d97706' }
  },
  { 
    id: 'circular-tree', 
    position: { x: 300, y: 400 }, 
    data: { 
      label: '⭕ CircularTree',
      type: 'component',
      quality: 85,
      risk: 'low',
      performance: 80
    },
    style: { background: '#3b82f6', color: 'white', border: '2px solid #2563eb' }
  },
  { 
    id: 'person-card', 
    position: { x: 500, y: 400 }, 
    data: { 
      label: '👤 PersonCard',
      type: 'component',
      quality: 90,
      risk: 'low',
      performance: 88
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  
  // Utils & Edge Functions
  { 
    id: 'gedcom-parser', 
    position: { x: 150, y: 550 }, 
    data: { 
      label: '📝 GEDCOM Parser',
      type: 'util',
      quality: 80,
      risk: 'medium',
      performance: 70
    },
    style: { background: '#8b5cf6', color: 'white', border: '2px solid #7c3aed' }
  },
  { 
    id: 'cloud-storage', 
    position: { x: 350, y: 550 }, 
    data: { 
      label: '☁️ CloudStorage',
      type: 'util',
      quality: 85,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'edge-functions', 
    position: { x: 550, y: 550 }, 
    data: { 
      label: '⚡ Edge Functions',
      type: 'backend',
      quality: 88,
      risk: 'low',
      performance: 85
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'main', target: 'app', animated: true },
  { id: 'e2-3', source: 'app', target: 'index' },
  { id: 'e2-4', source: 'app', target: 'auth' },
  { id: 'e2-5', source: 'app', target: 'codehealth' },
  { id: 'e3-6', source: 'index', target: 'family-tree-app' },
  { id: 'e6-7', source: 'family-tree-app', target: 'circular-tree' },
  { id: 'e6-8', source: 'family-tree-app', target: 'person-card' },
  { id: 'e6-9', source: 'family-tree-app', target: 'gedcom-parser' },
  { id: 'e6-10', source: 'family-tree-app', target: 'cloud-storage' },
  { id: 'e10-11', source: 'cloud-storage', target: 'edge-functions', animated: true }
];

export default function CodeHealth() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeLens, setActiveLens] = useState<LensType>('quality');
  const [analyzing, setAnalyzing] = useState(false);

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Apply color-coding based on active lens
  const applyLensColors = useCallback((lens: LensType) => {
    setNodes((nds) => 
      nds.map((node) => {
        let color = '#94a3b8'; // default gray
        
        if (lens === 'quality') {
          const quality = typeof node.data.quality === 'number' ? node.data.quality : 0;
          if (quality >= 85) color = '#10b981'; // green
          else if (quality >= 70) color = '#3b82f6'; // blue
          else if (quality >= 50) color = '#f59e0b'; // orange
          else color = '#ef4444'; // red
        } else if (lens === 'risk') {
          const risk = node.data.risk || 'unknown';
          if (risk === 'low') color = '#10b981';
          else if (risk === 'medium') color = '#eab308';
          else if (risk === 'high') color = '#ef4444';
        } else if (lens === 'performance') {
          const perf = typeof node.data.performance === 'number' ? node.data.performance : 0;
          if (perf >= 85) color = '#10b981';
          else if (perf >= 70) color = '#3b82f6';
          else if (perf >= 50) color = '#f59e0b';
          else color = '#ef4444';
        }
        
        return {
          ...node,
          style: { 
            ...node.style, 
            background: color,
            border: `2px solid ${color}`,
            color: 'white'
          }
        };
      })
    );
  }, [setNodes]);

  // Handle lens change
  const handleLensChange = (lens: LensType) => {
    setActiveLens(lens);
    applyLensColors(lens);
  };

  // Manual analyze button
  const handleAnalyze = async () => {
    setAnalyzing(true);
    toast("🔍 Analyzing codebase...");
    
    try {
      // TODO: Connect to AgentKit for real analysis
      // For now, simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("✅ Analysis complete!");
      applyLensColors(activeLens);
    } catch (error) {
      toast.error("❌ Analysis failed");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Code Health Monitor</h1>
              <Badge variant="outline" className="text-xs">Beta</Badge>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="relative"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Control Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View Lenses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeLens} onValueChange={(v) => handleLensChange(v as LensType)}>
                <TabsList className="grid w-full grid-cols-1 gap-2">
                  <TabsTrigger value="quality" className="flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Quality
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Performance
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Legend</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>Excellent (85-100)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span>Good (70-84)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                    <span>Fair (50-69)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span>Poor (&lt;50)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Component Types
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-3 w-3" />
                    <span>Core • Pages • Components</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3 w-3" />
                    <span>Utils • Backend</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagram */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Project Architecture Diagram</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '700px', width: '100%' }} className="border rounded-lg">
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
                  <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
