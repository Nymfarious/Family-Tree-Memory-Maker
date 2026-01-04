import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftRight, ExternalLink, Key, DollarSign, Activity, Clock, TrendingUp } from "lucide-react";

interface ApiDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ApiPlatform {
  name: string;
  icon: string;
  usedBy: string[];
  pricing: 'free' | 'paid' | 'open' | 'freemium';
  status: 'working' | 'partial' | 'offline';
  bidirectional: boolean;
  secretLocation: 'Lovable Secrets' | 'Supabase Secrets' | 'Local Storage';
  devToolUrl: string;
  apiDocsUrl: string;
  rateLimitInfo?: {
    limit: string;
    remaining: string;
    resetTime: string;
  };
}

export function ApiDashboardModal({ open, onOpenChange }: ApiDashboardModalProps) {
  const platforms: ApiPlatform[] = [
    {
      name: "Lovable AI",
      icon: "✨",
      usedBy: ["Dev Notes Summarizer", "Code Health Analysis"],
      pricing: 'freemium',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Lovable Secrets',
      devToolUrl: "https://docs.lovable.dev/features/ai",
      apiDocsUrl: "https://ai.gateway.lovable.dev/docs",
      rateLimitInfo: {
        limit: "100/min",
        remaining: "87",
        resetTime: "45 sec"
      }
    },
    {
      name: "OpenAI",
      icon: "🤖",
      usedBy: ["Voice TTS", "Image Generation", "Historical Context"],
      pricing: 'paid',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://platform.openai.com/settings",
      apiDocsUrl: "https://platform.openai.com/docs/api-reference",
      rateLimitInfo: {
        limit: "500/min",
        remaining: "423",
        resetTime: "2 min"
      }
    },
    {
      name: "Google AI (Gemini)",
      icon: "🧠",
      usedBy: ["Family Insights", "Historical Analysis"],
      pricing: 'freemium',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://console.cloud.google.com/apis/credentials",
      apiDocsUrl: "https://ai.google.dev/gemini-api/docs",
      rateLimitInfo: {
        limit: "60/min",
        remaining: "48",
        resetTime: "1 min"
      }
    },
    {
      name: "Hugging Face",
      icon: "🤗",
      usedBy: ["NLP Analysis", "Sentiment Detection"],
      pricing: 'freemium',
      status: 'partial',
      bidirectional: false,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://huggingface.co/settings/tokens",
      apiDocsUrl: "https://huggingface.co/docs/api-inference",
      rateLimitInfo: {
        limit: "30/min",
        remaining: "12",
        resetTime: "3 min"
      }
    },
    {
      name: "Replicate",
      icon: "🖼️",
      usedBy: ["Image Enhancement", "Image Generation"],
      pricing: 'paid',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://replicate.com/account/api-tokens",
      apiDocsUrl: "https://replicate.com/docs",
      rateLimitInfo: {
        limit: "50/min",
        remaining: "38",
        resetTime: "1 min"
      }
    },
    {
      name: "Supabase",
      icon: "⚡",
      usedBy: ["Database", "Auth", "Storage", "Edge Functions"],
      pricing: 'freemium',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Supabase Secrets',
      devToolUrl: "https://supabase.com/dashboard",
      apiDocsUrl: "https://supabase.com/docs",
      rateLimitInfo: {
        limit: "Unlimited",
        remaining: "∞",
        resetTime: "N/A"
      }
    },
    {
      name: "Nano Banana (Gemini Image)",
      icon: "🍌",
      usedBy: ["AI Image Generation"],
      pricing: 'free',
      status: 'working',
      bidirectional: true,
      secretLocation: 'Lovable Secrets',
      devToolUrl: "https://ai.gateway.lovable.dev",
      apiDocsUrl: "https://docs.lovable.dev/features/ai",
      rateLimitInfo: {
        limit: "10/min",
        remaining: "7",
        resetTime: "4 min"
      }
    },
  ];

  const getPricingBadge = (pricing: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      free: { variant: "default", label: "FREE" },
      paid: { variant: "destructive", label: "PAID" },
      open: { variant: "secondary", label: "OPEN" },
      freemium: { variant: "outline", label: "FREEMIUM" }
    };
    return variants[pricing] || variants.free;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            API Integration Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {platforms.map((platform) => (
            <div key={platform.name} className="p-4 rounded-lg border border-border bg-card space-y-3">
              {/* Platform Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {platform.name}
                      <Badge {...getPricingBadge(platform.pricing)} className="text-xs">
                        {getPricingBadge(platform.pricing).label}
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Used by: {platform.usedBy.join(", ")}
                    </p>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <ArrowLeftRight 
                    className={`h-5 w-5 ${
                      platform.status === 'working' && platform.bidirectional 
                        ? 'text-green-500' 
                        : platform.status === 'partial' || !platform.bidirectional
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                    style={{
                      transform: platform.bidirectional ? 'none' : 'rotate(180deg)'
                    }}
                  />
                  <div className={`h-3 w-3 rounded-full ${
                    platform.status === 'working' ? 'bg-green-500' : 
                    platform.status === 'partial' ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`} />
                </div>
              </div>

              <Separator />

              {/* Platform Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Key className="h-3 w-3" />
                    <span className="font-medium">Secret Location:</span>
                  </div>
                  <p className="pl-5">{platform.secretLocation}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-3 w-3" />
                    <span className="font-medium">Status:</span>
                  </div>
                  <p className="pl-5 capitalize">{platform.status}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span className="font-medium">Pricing Model:</span>
                  </div>
                  <p className="pl-5 capitalize">{platform.pricing}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ArrowLeftRight className="h-3 w-3" />
                    <span className="font-medium">Data Flow:</span>
                  </div>
                  <p className="pl-5">{platform.bidirectional ? 'Bidirectional' : 'One-way'}</p>
                </div>
              </div>

              {/* Rate Limit Info */}
              {platform.rateLimitInfo && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Rate Limit Monitoring
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground mb-1">Limit</p>
                        <p className="font-semibold">{platform.rateLimitInfo.limit}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground mb-1">Remaining</p>
                        <p className="font-semibold text-green-600">{platform.rateLimitInfo.remaining}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Resets In
                        </p>
                        <p className="font-semibold">{platform.rateLimitInfo.resetTime}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Action Links */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => window.open(platform.devToolUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Dev Tools
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 text-xs"
                  onClick={() => window.open(platform.apiDocsUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  API Docs
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
