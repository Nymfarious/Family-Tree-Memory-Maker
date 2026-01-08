import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeftRight, ExternalLink, Key, DollarSign, Activity, Clock, 
  TrendingUp, ChevronDown, ChevronRight, CheckCircle2, XCircle, 
  AlertCircle, Circle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ApiDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApiPlatform {
  name: string;
  icon: string;
  description: string; // NEW: Brief description
  usedBy: string[];
  pricing: 'free' | 'paid' | 'open' | 'freemium';
  status: 'working' | 'configured' | 'planned' | 'offline';
  bidirectional: boolean;
  secretLocation: 'Lovable Secrets' | 'Supabase Secrets' | 'Local Storage' | 'N/A';
  devToolUrl: string;
  apiDocsUrl: string;
  rateLimitInfo?: {
    limit: string;
    remaining: string;
    resetTime: string;
  };
  category: 'ai' | 'infrastructure' | 'maps' | 'media' | 'legacy';
}

export function ApiDashboardModal({ open, onOpenChange }: ApiDashboardModalProps) {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  // Platforms ordered: Claude first, Lovable last
  const platforms: ApiPlatform[] = [
    // === AI PROVIDERS (Claude at top!) ===
    {
      name: "Claude (Anthropic)",
      icon: "🧠",
      description: "Primary AI for historical context, analysis, and intelligent features",
      usedBy: ["Historical Context", "Family Insights", "Code Analysis", "Smart Search"],
      pricing: 'paid',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://console.anthropic.com",
      apiDocsUrl: "https://docs.anthropic.com/claude/reference",
      rateLimitInfo: {
        limit: "1000/min",
        remaining: "~950",
        resetTime: "1 min"
      },
      category: 'ai'
    },
    {
      name: "Google AI (Gemini)",
      icon: "✨",
      description: "Fallback AI provider for analysis and insights",
      usedBy: ["Family Insights (Fallback)", "Historical Analysis"],
      pricing: 'freemium',
      status: 'configured',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://console.cloud.google.com/apis/credentials",
      apiDocsUrl: "https://ai.google.dev/gemini-api/docs",
      rateLimitInfo: {
        limit: "60/min",
        remaining: "48",
        resetTime: "1 min"
      },
      category: 'ai'
    },
    {
      name: "OpenAI",
      icon: "🤖",
      description: "ChatGPT provider - Voice TTS, image generation capabilities",
      usedBy: ["Voice TTS (Planned)", "Image Generation (Planned)"],
      pricing: 'paid',
      status: 'planned',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://platform.openai.com/settings",
      apiDocsUrl: "https://platform.openai.com/docs/api-reference",
      category: 'ai'
    },
    {
      name: "Hugging Face",
      icon: "🤗",
      description: "Open-source AI models for NLP and specialized tasks",
      usedBy: ["NLP Analysis (Planned)", "Sentiment Detection"],
      pricing: 'freemium',
      status: 'planned',
      bidirectional: false,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://huggingface.co/settings/tokens",
      apiDocsUrl: "https://huggingface.co/docs/api-inference",
      category: 'ai'
    },

    // === INFRASTRUCTURE ===
    {
      name: "Supabase",
      icon: "⚡",
      description: "Backend infrastructure - Database, Auth, Storage, Edge Functions",
      usedBy: ["Database", "Authentication", "File Storage", "Edge Functions", "Real-time"],
      pricing: 'freemium',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://supabase.com/dashboard/project/fbpmdmmmastkznaggevx",
      apiDocsUrl: "https://supabase.com/docs",
      rateLimitInfo: {
        limit: "Unlimited",
        remaining: "∞",
        resetTime: "N/A"
      },
      category: 'infrastructure'
    },

    // === MAPS ===
    {
      name: "MapLibre GL JS",
      icon: "🗺️",
      description: "Open-source map rendering - No API key required!",
      usedBy: ["Ancestor Map View", "Migration Paths", "Location Visualization"],
      pricing: 'free',
      status: 'planned',
      bidirectional: false,
      secretLocation: 'N/A',
      devToolUrl: "https://maplibre.org/maplibre-gl-js/docs/",
      apiDocsUrl: "https://maplibre.org/maplibre-gl-js/docs/API/",
      category: 'maps'
    },

    // === MEDIA ===
    {
      name: "Replicate",
      icon: "🖼️",
      description: "AI image enhancement and generation models",
      usedBy: ["Photo Enhancement (Planned)", "AI Image Generation"],
      pricing: 'paid',
      status: 'planned',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://replicate.com/account/api-tokens",
      apiDocsUrl: "https://replicate.com/docs",
      category: 'media'
    },
    {
      name: "Nano Banana (Gemini Image)",
      icon: "🍌",
      description: "AI image generation via Lovable gateway",
      usedBy: ["AI Image Generation"],
      pricing: 'free',
      status: 'configured',
      bidirectional: true,
      secretLocation: 'Lovable Secrets',
      devToolUrl: "https://ai.gateway.lovable.dev",
      apiDocsUrl: "https://docs.lovable.dev/features/ai",
      rateLimitInfo: {
        limit: "10/min",
        remaining: "7",
        resetTime: "4 min"
      },
      category: 'media'
    },

    // === LEGACY (Lovable at bottom) ===
    {
      name: "Lovable AI Gateway",
      icon: "💜",
      description: "Legacy AI gateway - Being migrated to direct Claude API",
      usedBy: ["Dev Notes (Legacy)", "Fallback AI"],
      pricing: 'freemium',
      status: 'configured',
      bidirectional: true,
      secretLocation: 'Lovable Secrets',
      devToolUrl: "https://docs.lovable.dev/features/ai",
      apiDocsUrl: "https://ai.gateway.lovable.dev/docs",
      rateLimitInfo: {
        limit: "100/min",
        remaining: "87",
        resetTime: "45 sec"
      },
      category: 'legacy'
    },
  ];

  const togglePlatform = (name: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedPlatforms(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandedPlatforms(new Set());
    } else {
      setExpandedPlatforms(new Set(platforms.map(p => p.name)));
    }
    setExpandAll(!expandAll);
  };

  const getPricingBadge = (pricing: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      free: { variant: "default", label: "FREE", className: "bg-green-600" },
      paid: { variant: "destructive", label: "PAID" },
      open: { variant: "secondary", label: "OPEN SOURCE" },
      freemium: { variant: "outline", label: "FREEMIUM" }
    };
    return variants[pricing] || variants.free;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'configured':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'planned':
        return <Circle className="h-4 w-4 text-gray-400" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working': return 'Working';
      case 'configured': return 'Configured';
      case 'planned': return 'Planned';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ai': return '🤖 AI Providers';
      case 'infrastructure': return '🏗️ Infrastructure';
      case 'maps': return '🗺️ Maps';
      case 'media': return '🖼️ Media';
      case 'legacy': return '📦 Legacy';
      default: return category;
    }
  };

  // Group platforms by category
  const groupedPlatforms = platforms.reduce((acc, platform) => {
    if (!acc[platform.category]) {
      acc[platform.category] = [];
    }
    acc[platform.category].push(platform);
    return acc;
  }, {} as Record<string, ApiPlatform[]>);

  const categoryOrder = ['ai', 'infrastructure', 'maps', 'media', 'legacy'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              API Integration Dashboard
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={toggleExpandAll}>
              {expandAll ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Status: <CheckCircle2 className="inline h-3 w-3 text-green-500" /> Working • 
            <AlertCircle className="inline h-3 w-3 text-yellow-500 ml-2" /> Configured • 
            <Circle className="inline h-3 w-3 text-gray-400 ml-2" /> Planned
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {categoryOrder.map(category => {
            const categoryPlatforms = groupedPlatforms[category];
            if (!categoryPlatforms) return null;

            return (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-1">
                  {getCategoryLabel(category)}
                </h3>
                
                {categoryPlatforms.map((platform) => {
                  const isExpanded = expandedPlatforms.has(platform.name);
                  const pricingBadge = getPricingBadge(platform.pricing);

                  return (
                    <Collapsible
                      key={platform.name}
                      open={isExpanded}
                      onOpenChange={() => togglePlatform(platform.name)}
                    >
                      <div className={`rounded-lg border bg-card ${
                        platform.status === 'working' ? 'border-green-500/30' :
                        platform.status === 'configured' ? 'border-yellow-500/30' :
                        'border-border'
                      }`}>
                        {/* Compact Header */}
                        <CollapsibleTrigger asChild>
                          <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{platform.icon}</span>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{platform.name}</span>
                                  <Badge 
                                    variant={pricingBadge.variant} 
                                    className={`text-[10px] h-4 ${pricingBadge.className || ''}`}
                                  >
                                    {pricingBadge.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {platform.description}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger>
                                  {getStatusIcon(platform.status)}
                                </TooltipTrigger>
                                <TooltipContent>{getStatusLabel(platform.status)}</TooltipContent>
                              </Tooltip>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        {/* Expanded Details */}
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 space-y-3">
                            <Separator />
                            
                            {/* Used By */}
                            <div className="text-xs">
                              <span className="text-muted-foreground">Used by: </span>
                              <span>{platform.usedBy.join(", ")}</span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <Key className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Secret:</span>
                                <span>{platform.secretLocation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Flow:</span>
                                <span>{platform.bidirectional ? 'Bidirectional' : 'One-way'}</span>
                              </div>
                            </div>

                            {/* Rate Limit Info */}
                            {platform.rateLimitInfo && (
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded bg-muted/50 text-center">
                                  <p className="text-muted-foreground text-[10px]">Limit</p>
                                  <p className="font-medium">{platform.rateLimitInfo.limit}</p>
                                </div>
                                <div className="p-2 rounded bg-muted/50 text-center">
                                  <p className="text-muted-foreground text-[10px]">Remaining</p>
                                  <p className="font-medium text-green-600">{platform.rateLimitInfo.remaining}</p>
                                </div>
                                <div className="p-2 rounded bg-muted/50 text-center">
                                  <p className="text-muted-foreground text-[10px]">Resets</p>
                                  <p className="font-medium">{platform.rateLimitInfo.resetTime}</p>
                                </div>
                              </div>
                            )}

                            {/* Action Links */}
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-xs h-7"
                                onClick={() => window.open(platform.devToolUrl, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Dashboard
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-xs h-7"
                                onClick={() => window.open(platform.apiDocsUrl, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Docs
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {platforms.filter(p => p.status === 'working').length} working • 
            {platforms.filter(p => p.status === 'configured').length} configured • 
            {platforms.filter(p => p.status === 'planned').length} planned
          </span>
          <span>Last updated: Jan 2026</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
