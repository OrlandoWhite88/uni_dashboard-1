import React, { useState } from 'react';
import { BeamPath } from '@/hooks/useClassificationStream';
import { TrendingUp, CheckCircle, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BeamSearchDisplayProps {
  beam: BeamPath[];
  isVisible: boolean;
}

const BeamSearchDisplay: React.FC<BeamSearchDisplayProps> = ({ beam, isVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || beam.length === 0) {
    return null;
  }

  // Show top 3 paths for better UI
  const topPaths = beam.slice(0, 3);
  const activePaths = beam.filter(path => path.is_active).length;
  const completePaths = beam.filter(path => path.is_complete).length;
  const topPath = beam[0];

  return (
    <div className="mt-4 animate-fade-in">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:bg-secondary/20 rounded p-2 -m-2 transition-colors">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">
                Classification Paths Being Explored
              </h3>
              <span className="text-xs text-muted-foreground">
                ({beam.length} path{beam.length !== 1 ? 's' : ''})
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            {!isExpanded && topPath && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Leading: #{topPath.position} at {Math.round(topPath.cumulative_confidence * 100)}%
                {completePaths > 0 && ` • ${completePaths} complete`}
              </p>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="space-y-2">
            {topPaths.map((path, index) => (
              <div
                key={path.path_id}
                className={`glass-card p-3 rounded-lg transition-all duration-300 ${
                  index === 0 ? 'ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        index === 0 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-secondary text-muted-foreground'
                      }`}>
                        #{path.position}
                      </span>
                      
                      {path.is_complete && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                      
                      {path.is_active && !path.is_complete && (
                        <Clock className="h-3 w-3 text-blue-500 animate-pulse" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed text-right overflow-hidden" title={path.current_path}>
                      <span className="inline-block" style={{ direction: 'rtl', textAlign: 'left', unicodeBidi: 'plaintext' }}>
                        {path.current_path.replace(/<\/?[^>]+(>|$)/g, "")}
                      </span>
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-foreground">
                      {Math.round(path.cumulative_confidence * 100)}%
                    </div>
                    <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${path.cumulative_confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {beam.length > 3 && (
            <div className="mt-2 text-center">
              <span className="text-xs text-muted-foreground">
                +{beam.length - 3} more paths being explored
              </span>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default BeamSearchDisplay;
