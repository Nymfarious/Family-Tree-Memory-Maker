import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Eye, Code2, AlertTriangle, Zap, RefreshCw, FileCode, Layers } from "lucide-react";

type LensType = 'quality' | 'risk' | 'performance';
type ComponentType = 'core' | 'page' | 'component' | 'util' | 'backend' | 'button' | 'api';

interface CodeHealthSidebarProps {
  activeLens: LensType;
  onLensChange: (lens: LensType) => void;
  analyzing: boolean;
  onAnalyze: () => void;
  selectedTypes: ComponentType[];
  onTypeToggle: (type: ComponentType) => void;
}

export function CodeHealthSidebar({
  activeLens,
  onLensChange,
  analyzing,
  onAnalyze,
  selectedTypes,
  onTypeToggle
}: CodeHealthSidebarProps) {
  const componentTypes: { value: ComponentType; label: string }[] = [
    { value: 'core', label: 'Core Files' },
    { value: 'page', label: 'Pages' },
    { value: 'component', label: 'Components' },
    { value: 'button', label: 'Buttons' },
    { value: 'util', label: 'Utils' },
    { value: 'backend', label: 'Backend' },
    { value: 'api', label: 'APIs' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="h-5 w-5" />
          View & Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analyze Button */}
        <div>
          <Button 
            onClick={onAnalyze} 
            disabled={analyzing}
            className="w-full"
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>

        {/* View Lenses */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Lens
          </h3>
          <div className="grid gap-2">
            <Button
              variant={activeLens === 'quality' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLensChange('quality')}
              className="justify-start"
            >
              <Code2 className="h-3 w-3 mr-2" />
              Quality
            </Button>
            <Button
              variant={activeLens === 'risk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLensChange('risk')}
              className="justify-start"
            >
              <AlertTriangle className="h-3 w-3 mr-2" />
              Risk
            </Button>
            <Button
              variant={activeLens === 'performance' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onLensChange('performance')}
              className="justify-start"
            >
              <Zap className="h-3 w-3 mr-2" />
              Performance
            </Button>
          </div>
          <div className="text-xs text-muted-foreground pt-2 space-y-1">
            <p><strong>Quality:</strong> Code maintainability, testing, and best practices</p>
            <p><strong>Risk:</strong> Security vulnerabilities and stability issues</p>
            <p><strong>Performance:</strong> Speed, efficiency, and resource usage</p>
          </div>
        </div>

        {/* Component Type Filters */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Component Types
          </h3>
          <div className="space-y-2">
            {componentTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={() => onTypeToggle(type.value)}
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-semibold">Score Legend</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span>Excellent (95-100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span>Good (80-94%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span>Fair (60-79%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <span>Needs Attention (40-59%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span>Critical (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Connection Types Legend */}
        <div className="space-y-3 pt-3 border-t">
          <h3 className="text-sm font-semibold">Connection Types</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="32" y2="1" stroke="currentColor" strokeWidth="2" className="text-primary" />
              </svg>
              <span>Direct dependency</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="32" y2="1" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" />
              </svg>
              <span>Data flow (dashed)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="32" y2="1" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6,3" />
              </svg>
              <span>API call (dotted)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="32" y2="1" stroke="#8b5cf6" strokeWidth="2.5" />
              </svg>
              <span>Event handler</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="32" height="2" className="flex-shrink-0">
                <line x1="0" y1="1" x2="32" y2="1" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2,2" />
              </svg>
              <span>State management</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 text-base">★</span>
              <span>Starred (click star on node)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
