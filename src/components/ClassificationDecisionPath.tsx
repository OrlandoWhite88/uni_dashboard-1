import React from 'react';
import { CheckCircle, TrendingUp, ChevronDown } from 'lucide-react';

export interface ClassificationDecision {
  code: string;
  description: string;
  confidence: number;
  level: number;
  timestamp: string;
  competitors?: {
    code: string;
    description: string;
    confidence: number;
  }[];
}

interface ClassificationDecisionPathProps {
  decisions: ClassificationDecision[];
  isVisible: boolean;
}

const ClassificationDecisionPath: React.FC<ClassificationDecisionPathProps> = ({ 
  decisions, 
  isVisible 
}) => {
  if (!isVisible || decisions.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          Classification Decision Path
        </h3>
      </div>
      
      <div className="space-y-2">
        {decisions.map((decision, index) => (
          <div key={`${decision.code}-${decision.timestamp}`} className="animate-scale-in">
            {/* Decision Box */}
            <div className="glass-card p-3 rounded-lg ring-1 ring-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-bold text-primary">
                      {decision.level + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {decision.code}
                      </span>
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {decision.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {Math.round(decision.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Selected
                  </div>
                </div>
              </div>
            </div>

            {/* Competitors Leaderboard */}
            {decision.competitors && decision.competitors.length > 0 && (
              <div className="mt-3 ml-6">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Competing options at this level
                  </span>
                </div>
                <div className="space-y-1">
                  {decision.competitors.slice(0, 3).map((competitor, compIndex) => (
                    <div
                      key={competitor.code}
                      className="glass-card p-2 rounded-md bg-secondary/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                            #{compIndex + 2}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {competitor.code}
                            </span>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {competitor.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-medium text-muted-foreground">
                            {Math.round(competitor.confidence * 100)}%
                          </div>
                          <div className="w-12 h-1 bg-secondary/50 rounded-full overflow-hidden mt-0.5">
                            <div 
                              className="h-full bg-muted-foreground rounded-full transition-all duration-500"
                              style={{ width: `${competitor.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {decision.competitors.length > 3 && (
                    <div className="text-center py-1">
                      <span className="text-xs text-muted-foreground">
                        +{decision.competitors.length - 3} more options
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connector line to next decision (if not last) */}
            {index < decisions.length - 1 && (
              <div className="flex justify-center my-2">
                <div className="w-px h-4 bg-gradient-to-b from-primary/50 to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassificationDecisionPath;
