// ═══════════════════════════════════════════════════════════════════════════
// WISHLIST SECTION UPDATE for dev-tools.tsx
// Replace lines ~1021-1067 with this content
// ═══════════════════════════════════════════════════════════════════════════

          {/* Wishlist Section */}
          <Collapsible defaultOpen className="space-y-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                Dev Wishlist
              </h3>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              
              {/* ✓ COMPLETED */}
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 space-y-2">
                <Label className="text-xs font-semibold text-green-500 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Completed
                </Label>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-api-dashboard" checked disabled />
                  <Label htmlFor="wish-api-dashboard" className="text-xs leading-relaxed cursor-pointer line-through">
                    API Integration Dashboard - Monitor all API platforms
                  </Label>
                </div>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-claude" checked disabled />
                  <Label htmlFor="wish-claude" className="text-xs leading-relaxed cursor-pointer line-through">
                    Claude API Integration - Primary AI provider via Supabase
                  </Label>
                </div>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-11gen" checked disabled />
                  <Label htmlFor="wish-11gen" className="text-xs leading-relaxed cursor-pointer line-through">
                    11 Generation Support - Extended circular tree views
                  </Label>
                </div>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-compact" checked disabled />
                  <Label htmlFor="wish-compact" className="text-xs leading-relaxed cursor-pointer line-through">
                    Compact Card View - Streamlined person cards
                  </Label>
                </div>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-fan" checked disabled />
                  <Label htmlFor="wish-fan" className="text-xs leading-relaxed cursor-pointer line-through">
                    Circular Fan Views - Full/half/quarter options
                  </Label>
                </div>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-location-cleanup" checked disabled />
                  <Label htmlFor="wish-location-cleanup" className="text-xs leading-relaxed cursor-pointer line-through">
                    Location Cleanup Utility - Normalize place names
                  </Label>
                </div>
                <div className="flex items-start gap-2 opacity-60">
                  <Checkbox id="wish-us-int" checked disabled />
                  <Label htmlFor="wish-us-int" className="text-xs leading-relaxed cursor-pointer line-through">
                    US/International Location Badges - Visual country indicators
                  </Label>
                </div>
              </div>

              {/* ⏳ IN PROGRESS */}
              <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 space-y-2">
                <Label className="text-xs font-semibold text-yellow-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> In Progress
                </Label>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-all-locations" />
                  <Label htmlFor="wish-all-locations" className="text-xs leading-relaxed cursor-pointer">
                    Expandable Location Cards - Inline people list with timeline
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-maplibre" />
                  <Label htmlFor="wish-maplibre" className="text-xs leading-relaxed cursor-pointer">
                    MapLibre Integration - Free map tiles replacement
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-notes" />
                  <Label htmlFor="wish-notes" className="text-xs leading-relaxed cursor-pointer">
                    Colorful Notes Popup - Pin notes to people with colors
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-root-person" />
                  <Label htmlFor="wish-root-person" className="text-xs leading-relaxed cursor-pointer">
                    Default Root Person Setting - Trace lineages to home base
                  </Label>
                </div>
              </div>

              {/* 📋 PLANNED */}
              <div className="p-3 rounded-lg border border-border bg-card/50 space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ListTodo className="h-3 w-3" /> Planned
                </Label>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-realtime-logs" />
                  <Label htmlFor="wish-realtime-logs" className="text-xs leading-relaxed cursor-pointer">
                    Real-time API Call Logs - Live request/response tracking
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-cost-tracking" />
                  <Label htmlFor="wish-cost-tracking" className="text-xs leading-relaxed cursor-pointer">
                    Cost Analytics - API spending with budget alerts
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-media-import" />
                  <Label htmlFor="wish-media-import" className="text-xs leading-relaxed cursor-pointer">
                    Media Import - Import photos from Ancestry-tools
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-media-attach" />
                  <Label htmlFor="wish-media-attach" className="text-xs leading-relaxed cursor-pointer">
                    Media Attachment - Attach photos to person cards
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-find-person" />
                  <Label htmlFor="wish-find-person" className="text-xs leading-relaxed cursor-pointer">
                    Global Find Person - Search across all views
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-sort-surname" />
                  <Label htmlFor="wish-sort-surname" className="text-xs leading-relaxed cursor-pointer">
                    Sort by Surname - Alphabetical sorting in all views
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-supabase-schema" />
                  <Label htmlFor="wish-supabase-schema" className="text-xs leading-relaxed cursor-pointer">
                    Supabase Database Schema - Cloud sync for trees
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-webhook-tester" />
                  <Label htmlFor="wish-webhook-tester" className="text-xs leading-relaxed cursor-pointer">
                    Webhook Testing Suite - Debug integrations
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="wish-performance" />
                  <Label htmlFor="wish-performance" className="text-xs leading-relaxed cursor-pointer">
                    Performance Profiler - Supabase analytics integration
                  </Label>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic px-3">
                Check items you'd like prioritized. These features help monitor and optimize your API integrations.
              </p>
            </CollapsibleContent>
          </Collapsible>

// ═══════════════════════════════════════════════════════════════════════════
// NOTE: Make sure these icons are imported at the top of dev-tools.tsx:
// import { CheckCircle, Clock, ListTodo } from "lucide-react";
// ═══════════════════════════════════════════════════════════════════════════
