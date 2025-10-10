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
  NodeMouseHandler,
  Handle,
  Position,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CodeHealthChat } from "@/components/code-health-chat";
import { CodeHealthSidebar } from "@/components/code-health-sidebar";
import { CodeHealthPriorityPanel } from "@/components/code-health-priority-panel";
import { CodeHealthSettings } from "@/components/code-health-settings";
import { AIWorkspace } from "@/components/ai-workspace";
import { toast } from "sonner";
import { 
  Activity, 
  ArrowLeft,
  Star,
  Info
} from "lucide-react";

type LensType = 'quality' | 'risk' | 'performance';
type ComponentType = 'core' | 'page' | 'component' | 'util' | 'backend' | 'button' | 'api';
type ViewMode = 'all' | 'frontend' | 'backend' | 'hierarchy' | 'workspace';

// Expanded nodes representing ALL project components
const initialNodes: Node[] = [
  // FRONTEND (Left side)
  // Core Files
  { 
    id: 'main', 
    position: { x: 50, y: 50 }, 
    data: { 
      label: '🚀 main.tsx',
      type: 'core',
      quality: 90,
      risk: 'low',
      performance: 95
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'app', 
    type: 'default',
    position: { x: 50, y: 120 }, 
    data: { 
      label: '📱 App.tsx',
      type: 'core',
      quality: 85,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  
  // Pages
  { 
    id: 'index', 
    position: { x: 50, y: 200 }, 
    data: { 
      label: '🏠 Index Page',
      type: 'page',
      quality: 80,
      risk: 'low',
      performance: 85
    },
    style: { background: '#3b82f6', color: 'white', border: '2px solid #2563eb' }
  },
  { 
    id: 'auth', 
    position: { x: 50, y: 270 }, 
    data: { 
      label: '🔐 Auth Page',
      type: 'page',
      quality: 75,
      risk: 'medium',
      performance: 80
    },
    style: { background: '#eab308', color: 'white', border: '2px solid #ca8a04' }
  },
  { 
    id: 'codehealth', 
    position: { x: 50, y: 340 }, 
    data: { 
      label: '📊 CodeHealth Page',
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
    position: { x: 250, y: 200 }, 
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
    position: { x: 250, y: 270 }, 
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
    position: { x: 250, y: 340 }, 
    data: { 
      label: '👤 PersonCard',
      type: 'component',
      quality: 90,
      risk: 'low',
      performance: 88
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'tree-list', 
    position: { x: 250, y: 410 }, 
    data: { 
      label: '📋 TreeList',
      type: 'component',
      quality: 82,
      risk: 'low',
      performance: 85
    },
    style: { background: '#3b82f6', color: 'white', border: '2px solid #2563eb' }
  },
  { 
    id: 'code-health-chat', 
    position: { x: 250, y: 480 }, 
    data: { 
      label: '💬 CodeHealthChat',
      type: 'component',
      quality: 88,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },

  // Buttons (UI Elements)
  { 
    id: 'btn-signin', 
    position: { x: 450, y: 270 }, 
    data: { 
      label: '🔘 Sign In Button',
      type: 'button',
      quality: 85,
      risk: 'low',
      performance: 95
    },
    style: { background: '#06b6d4', color: 'white', border: '2px solid #0891b2' }
  },
  { 
    id: 'btn-analyze', 
    position: { x: 450, y: 340 }, 
    data: { 
      label: '🔘 Analyze Button',
      type: 'button',
      quality: 90,
      risk: 'low',
      performance: 92
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'btn-upload', 
    position: { x: 450, y: 410 }, 
    data: { 
      label: '🔘 Upload Button',
      type: 'button',
      quality: 78,
      risk: 'medium',
      performance: 80
    },
    style: { background: '#eab308', color: 'white', border: '2px solid #ca8a04' }
  },

  // Utils
  { 
    id: 'gedcom-parser', 
    position: { x: 450, y: 50 }, 
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
    id: 'cloud-storage-util', 
    position: { x: 450, y: 120 }, 
    data: { 
      label: '☁️ CloudStorage Utils',
      type: 'util',
      quality: 85,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'storage-util', 
    position: { x: 450, y: 190 }, 
    data: { 
      label: '💾 Storage Utils',
      type: 'util',
      quality: 88,
      risk: 'low',
      performance: 92
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },

  // BACKEND (Right side)
  // Edge Functions / APIs
  { 
    id: 'api-chat', 
    position: { x: 650, y: 50 }, 
    data: { 
      label: '⚡ Code Health Chat API',
      type: 'api',
      quality: 92,
      risk: 'low',
      performance: 88
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'api-transcribe', 
    position: { x: 650, y: 120 }, 
    data: { 
      label: '⚡ Transcribe API',
      type: 'api',
      quality: 85,
      risk: 'low',
      performance: 85
    },
    style: { background: '#3b82f6', color: 'white', border: '2px solid #2563eb' }
  },
  { 
    id: 'api-dropbox', 
    position: { x: 650, y: 190 }, 
    data: { 
      label: '⚡ Dropbox Upload API',
      type: 'api',
      quality: 80,
      risk: 'medium',
      performance: 75
    },
    style: { background: '#eab308', color: 'white', border: '2px solid #ca8a04' }
  },
  { 
    id: 'api-google', 
    position: { x: 650, y: 260 }, 
    data: { 
      label: '⚡ Google Drive API',
      type: 'api',
      quality: 82,
      risk: 'medium',
      performance: 78
    },
    style: { background: '#eab308', color: 'white', border: '2px solid #ca8a04' }
  },
  { 
    id: 'api-ai-insights', 
    position: { x: 650, y: 330 }, 
    data: { 
      label: '⚡ AI Insights API',
      type: 'api',
      quality: 88,
      risk: 'low',
      performance: 85
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },

  // Backend Services
  { 
    id: 'backend-auth', 
    position: { x: 850, y: 100 }, 
    data: { 
      label: '🔒 Auth Service',
      type: 'backend',
      quality: 90,
      risk: 'low',
      performance: 95
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'backend-db', 
    position: { x: 850, y: 180 }, 
    data: { 
      label: '🗄️ Database',
      type: 'backend',
      quality: 88,
      risk: 'low',
      performance: 85
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
  { 
    id: 'backend-storage', 
    position: { x: 850, y: 260 }, 
    data: { 
      label: '📦 File Storage',
      type: 'backend',
      quality: 85,
      risk: 'low',
      performance: 90
    },
    style: { background: '#10b981', color: 'white', border: '2px solid #059669' }
  },
];

const initialEdges: Edge[] = [
  // Core flow
  { id: 'e1', source: 'main', target: 'app', animated: true },
  { id: 'e2', source: 'app', target: 'index' },
  { id: 'e3', source: 'app', target: 'auth' },
  { id: 'e4', source: 'app', target: 'codehealth' },
  
  // Components
  { id: 'e5', source: 'index', target: 'family-tree-app' },
  { id: 'e6', source: 'family-tree-app', target: 'circular-tree' },
  { id: 'e7', source: 'family-tree-app', target: 'person-card' },
  { id: 'e8', source: 'family-tree-app', target: 'tree-list' },
  { id: 'e9', source: 'codehealth', target: 'code-health-chat' },
  
  // Buttons
  { id: 'e10', source: 'auth', target: 'btn-signin' },
  { id: 'e11', source: 'codehealth', target: 'btn-analyze' },
  { id: 'e12', source: 'family-tree-app', target: 'btn-upload' },
  
  // Utils
  { id: 'e13', source: 'family-tree-app', target: 'gedcom-parser' },
  { id: 'e14', source: 'family-tree-app', target: 'cloud-storage-util' },
  { id: 'e15', source: 'family-tree-app', target: 'storage-util' },
  
  // Backend connections
  { id: 'e16', source: 'code-health-chat', target: 'api-chat', animated: true },
  { id: 'e17', source: 'code-health-chat', target: 'api-transcribe' },
  { id: 'e18', source: 'cloud-storage-util', target: 'api-dropbox' },
  { id: 'e19', source: 'cloud-storage-util', target: 'api-google' },
  { id: 'e20', source: 'family-tree-app', target: 'api-ai-insights' },
  
  // Backend services
  { id: 'e21', source: 'api-chat', target: 'backend-auth' },
  { id: 'e22', source: 'api-transcribe', target: 'backend-auth' },
  { id: 'e23', source: 'api-dropbox', target: 'backend-storage', animated: true },
  { id: 'e24', source: 'api-google', target: 'backend-storage', animated: true },
  { id: 'e25', source: 'auth', target: 'backend-auth', animated: true },
  { id: 'e26', source: 'family-tree-app', target: 'backend-db', animated: true },
];

export default function CodeHealth() {
  const navigate = useNavigate();
  const { fitView, setCenter, getZoom } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeLens, setActiveLens] = useState<LensType>('quality');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<ComponentType[]>([
    'core', 'page', 'component', 'util', 'backend', 'button', 'api'
  ]);
  const [starredNodes, setStarredNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    label: string;
    type: string;
    quality?: number;
    risk?: string;
    performance?: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

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

  // Filter nodes based on selected types and view mode
  const filteredNodes = nodes.filter(node => {
    // Type filter
    if (!selectedTypes.includes(node.data.type as ComponentType)) return false;
    
    // View mode filter
    if (viewMode === 'frontend') {
      // Frontend includes: core, page, component, util, button
      return ['core', 'page', 'component', 'util', 'button'].includes(node.data.type);
    } else if (viewMode === 'backend') {
      // Backend includes: api, backend
      return ['api', 'backend'].includes(node.data.type);
    } else if (viewMode === 'hierarchy') {
      // Show all nodes for hierarchy view
      return true;
    }
    
    return true; // 'all' mode
  });

  const filteredEdges = edges.filter(edge => {
    const sourceNode = filteredNodes.find(n => n.id === edge.source);
    const targetNode = filteredNodes.find(n => n.id === edge.target);
    return sourceNode && targetNode;
  });

  // Apply color-coding based on active lens (5-point scale)
  const applyLensColors = useCallback((lens: LensType) => {
    setNodes((nds) => 
      nds.map((node) => {
        let color = '#94a3b8';
        
        if (lens === 'quality') {
          const quality = typeof node.data.quality === 'number' ? node.data.quality : 0;
          if (quality >= 95) color = '#10b981'; // Green - Excellent
          else if (quality >= 80) color = '#3b82f6'; // Blue - Good
          else if (quality >= 60) color = '#eab308'; // Yellow - Fair
          else if (quality >= 40) color = '#f59e0b'; // Orange - Needs Attention
          else color = '#ef4444'; // Red - Critical
        } else if (lens === 'risk') {
          const risk = node.data.risk || 'unknown';
          if (risk === 'low') color = '#10b981';
          else if (risk === 'medium') color = '#eab308';
          else if (risk === 'high') color = '#ef4444';
        } else if (lens === 'performance') {
          const perf = typeof node.data.performance === 'number' ? node.data.performance : 0;
          if (perf >= 95) color = '#10b981'; // Green - Excellent
          else if (perf >= 80) color = '#3b82f6'; // Blue - Good
          else if (perf >= 60) color = '#eab308'; // Yellow - Fair
          else if (perf >= 40) color = '#f59e0b'; // Orange - Needs Attention
          else color = '#ef4444'; // Red - Critical
        }
        
        return {
          ...node,
          data: {
            ...node.data,
            indicatorColor: color
          }
        };
      })
    );
  }, [setNodes]);

  const handleTypeToggle = (type: ComponentType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleStar = (nodeId: string) => {
    setStarredNodes(prev => 
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Get score color based on lens and value (5-point scale)
  const getScoreColor = (node: any) => {
    let score = 0;
    
    if (activeLens === 'quality') {
      score = node.data.quality || 0;
    } else if (activeLens === 'risk') {
      const risk = node.data.risk || 'unknown';
      if (risk === 'low') return 'text-green-500';
      if (risk === 'medium') return 'text-yellow-500';
      if (risk === 'high') return 'text-red-500';
      return 'text-gray-500';
    } else if (activeLens === 'performance') {
      score = node.data.performance || 0;
    }
    
    if (score >= 95) return 'text-green-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreValue = (node: any) => {
    if (activeLens === 'quality') {
      return `${node.data.quality || 0}%`;
    } else if (activeLens === 'risk') {
      return node.data.risk || 'unknown';
    } else if (activeLens === 'performance') {
      return `${node.data.performance || 0}%`;
    }
    return 'N/A';
  };

  // Layout the graph based on view mode
  useEffect(() => {
    if (filteredNodes.length > 0) {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      
      // Use top-to-bottom layout for hierarchy view, left-to-right for others
      if (viewMode === 'hierarchy') {
        dagreGraph.setGraph({ 
          rankdir: 'TB',  // Top to Bottom
          ranksep: 150,   // Vertical spacing between ranks (increased)
          nodesep: 100,   // Horizontal spacing between nodes (increased)
          align: 'UL'     // Align to upper left
        });
      } else {
        dagreGraph.setGraph({ 
          rankdir: 'LR',  // Left to Right
          ranksep: 150,   // Increased spacing
          nodesep: 80     // Increased spacing
        });
      }

      filteredNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 50 });
      });

      filteredEdges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const layoutedNodes = filteredNodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 75,
            y: nodeWithPosition.y - 25,
          },
        };
      });

      setNodes(layoutedNodes);
      setEdges(filteredEdges);
      
      // Auto-fit view when layout changes
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [filteredNodes.length, filteredEdges.length, viewMode, fitView]);

  // Handle lens change
  const handleLensChange = (lens: LensType) => {
    setActiveLens(lens);
    applyLensColors(lens);
  };

  // Real analyze function using edge function
  const handleAnalyze = async () => {
    setAnalyzing(true);
    toast("🔍 Analyzing codebase...");
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-codebase`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectPath: '/src' }),
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      
      // Update nodes with real analysis data
      if (data.components && data.components.length > 0) {
        // TODO: Transform analysis results into nodes
        toast.success(`✅ Found ${data.components.length} components!`);
      } else {
        toast.success("✅ Analysis complete!");
      }
      
      applyLensColors(activeLens);
    } catch (error) {
      toast.error("❌ Analysis failed - using default view");
      console.error(error);
      applyLensColors(activeLens);
    } finally {
      setAnalyzing(false);
    }
  };

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    // Check if clicking on star icon
    const target = event.target as HTMLElement;
    if (target.closest('.star-icon')) {
      toggleStar(node.id);
      toast(starredNodes.includes(node.id) ? '⭐ Removed from priorities' : '⭐ Added to priorities');
    } else {
      setSelectedNode({
        id: node.id,
        label: node.data.label,
        type: node.data.type,
        quality: node.data.quality,
        risk: node.data.risk,
        performance: node.data.performance
      });
      toast(`Selected: ${node.data.label}`);
    }
  }, [starredNodes]);

  // Custom node renderer with star button, corner indicator, and proper handles
  const nodeTypes = {
    default: ({ data, id }: any) => {
      const isStarred = starredNodes.includes(id);
      const currentNode = nodes.find(n => n.id === id);
      const indicatorColor = data.indicatorColor || '#94a3b8';
      
      return (
        <>
          <Handle type="target" position={Position.Left} />
          <div className="relative">
            <div className="px-3 py-2 rounded-xl bg-card text-card-foreground border-2 border-border shadow-sm flex flex-col items-center gap-1">
              {/* Corner indicator */}
              <div 
                className="absolute top-0 right-0 w-6 h-6 rounded-bl-lg rounded-tr-lg"
                style={{ backgroundColor: indicatorColor }}
              />
              <div className="text-sm font-semibold">{data.label}</div>
              {data.type && (
                <Badge variant="secondary" className="text-xs">
                  {data.type}
                </Badge>
              )}
              {currentNode && (
                <div className={`text-xs font-bold ${getScoreColor(currentNode)}`}>
                  {getScoreValue(currentNode)}
                </div>
              )}
            </div>
            <button 
              className="star-icon absolute -top-3 -right-3 bg-background rounded-full p-0.5 shadow-sm border border-border z-10"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Star 
                className={`h-4 w-4 ${isStarred ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
              />
            </button>
          </div>
          <Handle type="source" position={Position.Right} />
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-primary">Code Health Monitor</h1>
                  <p className="text-xs text-muted-foreground">Visualize & analyze your application architecture</p>
                </div>
                <Badge variant="outline" className="text-xs">Beta</Badge>
              </div>
              <CodeHealthSettings />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Instructions */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Getting Started:</strong> Click the <strong>Analyze</strong> button in the sidebar to scan your codebase. 
            Use the filters to focus on specific component types. Click the star icon on any node to add it to your priority list.
            Scores represent quality completion (95-100% = excellent, below 20% needs work).
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CodeHealthSidebar
              activeLens={activeLens}
              onLensChange={handleLensChange}
              analyzing={analyzing}
              onAnalyze={handleAnalyze}
              selectedTypes={selectedTypes}
              onTypeToggle={handleTypeToggle}
            />
          </div>

          {/* Diagram */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {viewMode === 'hierarchy' ? 'Element Tree' : 'Application Architecture'}
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={viewMode === 'all' ? 'default' : 'outline'}
                    onClick={() => setViewMode('all')}
                  >
                    Application Architecture
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
                    onClick={() => setViewMode('hierarchy')}
                  >
                    Element Tree
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'frontend' ? 'default' : 'outline'}
                    onClick={() => setViewMode('frontend')}
                  >
                    Frontend
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'backend' ? 'default' : 'outline'}
                    onClick={() => setViewMode('backend')}
                  >
                    Backend
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'workspace' ? 'default' : 'outline'}
                    onClick={() => setViewMode('workspace')}
                  >
                    AI Workspace
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'workspace' ? (
                <AIWorkspace />
              ) : (
                <div style={{ height: '700px', width: '100%' }} className="border rounded-lg bg-muted/20">
                  <ReactFlow
                    nodes={filteredNodes}
                    edges={filteredEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-right"
                  >
                    <Controls />
                    <MiniMap 
                      nodeColor={(node) => node.data.indicatorColor || '#94a3b8'}
                      maskColor="rgba(0, 0, 0, 0.8)"
                      position="bottom-left"
                      pannable={true}
                      zoomable={true}
                      onClick={(event, position) => {
                        setCenter(position.x, position.y, { zoom: getZoom(), duration: 800 });
                      }}
                      style={{
                        width: 160,
                        height: 120,
                        backgroundColor: 'hsl(var(--card))',
                        border: '2px solid hsl(var(--primary) / 0.5)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        marginLeft: '80px',
                        cursor: 'grab'
                      }}
                    />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                  </ReactFlow>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Priority Panel */}
        <CodeHealthPriorityPanel 
          starredNodes={starredNodes}
          allNodes={nodes}
        />

        {/* Chat Interface */}
        <CodeHealthChat 
          selectedNode={selectedNode}
          onClearSelection={() => setSelectedNode(null)}
        />
      </main>
    </div>
  );
}
