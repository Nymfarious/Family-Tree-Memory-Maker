import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, Sparkles, AlertCircle, CheckCircle } from "lucide-react";

interface PriorityItem {
  id: string;
  label: string;
  type: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  isStarred?: boolean;
}

interface CodeHealthPriorityPanelProps {
  starredNodes: string[];
  allNodes: any[];
}

export function CodeHealthPriorityPanel({ starredNodes, allNodes }: CodeHealthPriorityPanelProps) {
  const [activeTab, setActiveTab] = useState<'starred' | 'ai'>('starred');

  // Mock AI-suggested priorities based on scores
  const aiSuggestions: PriorityItem[] = allNodes
    .filter(node => {
      const quality = node.data.quality || 0;
      const performance = node.data.performance || 0;
      const risk = node.data.risk;
      return quality < 75 || performance < 75 || risk === 'medium' || risk === 'high';
    })
    .map(node => ({
      id: node.id,
      label: node.data.label,
      type: node.data.type,
      reason: generateReason(node),
      priority: determinePriority(node),
    }))
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 10);

  const starredItems: PriorityItem[] = allNodes
    .filter(node => starredNodes.includes(node.id))
    .map(node => ({
      id: node.id,
      label: node.data.label,
      type: node.data.type,
      reason: 'Manually prioritized by developer',
      priority: 'high',
      isStarred: true,
    }));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Priority List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'starred' | 'ai')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="starred" className="flex items-center gap-2">
              <Star className="h-3 w-3" />
              My Priorities ({starredItems.length})
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              AI Suggested ({aiSuggestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="starred" className="mt-4">
            <ScrollArea className="h-[300px]">
              {starredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No starred components yet</p>
                  <p className="text-xs mt-1">Click the star icon on any component to add it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {starredItems.map((item) => (
                    <PriorityItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <ScrollArea className="h-[300px]">
              {aiSuggestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-500" />
                  <p className="text-sm">Everything looks great!</p>
                  <p className="text-xs mt-1">No immediate priorities detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiSuggestions.map((item) => (
                    <PriorityItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PriorityItemCard({ item }: { item: PriorityItem }) {
  return (
    <div className="p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'}>
            {item.priority}
          </Badge>
          <span className="font-medium text-sm">{item.label}</span>
        </div>
        {item.isStarred && <Star className="h-4 w-4 fill-primary text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground mb-2">{item.reason}</p>
      <Badge variant="outline" className="text-xs">
        {item.type}
      </Badge>
    </div>
  );
}

function generateReason(node: any): string {
  const quality = node.data.quality || 0;
  const performance = node.data.performance || 0;
  const risk = node.data.risk;

  if (risk === 'high') {
    return 'High security risk - needs immediate review and testing';
  }
  if (risk === 'medium') {
    return 'Moderate risk level - consider refactoring to improve reliability';
  }
  if (quality < 50) {
    return 'Low code quality score - refactoring recommended to improve maintainability';
  }
  if (performance < 50) {
    return 'Poor performance metrics - optimization needed for better user experience';
  }
  if (quality < 75) {
    return 'Code quality could be improved - review for best practices and patterns';
  }
  if (performance < 75) {
    return 'Performance optimization opportunity - consider caching or lazy loading';
  }
  return 'Suggested for review based on overall metrics';
}

function determinePriority(node: any): 'high' | 'medium' | 'low' {
  const quality = node.data.quality || 0;
  const performance = node.data.performance || 0;
  const risk = node.data.risk;

  if (risk === 'high' || quality < 50 || performance < 50) {
    return 'high';
  }
  if (risk === 'medium' || quality < 70 || performance < 70) {
    return 'medium';
  }
  return 'low';
}
