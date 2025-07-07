import React, { useState } from 'react';
import { CheckCircle, TrendingUp, ChevronDown, ChevronUp, Eye, Loader2, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getHSCodeSubtree } from '@/lib/classifierService';
import CustomButton from './ui/CustomButton';

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
  originalProduct?: string;
  onRestartClassification?: (productDescription: string, forcedPath: Array<{ code: string; description: string }>) => void;
}

const ClassificationDecisionPath: React.FC<ClassificationDecisionPathProps> = ({ 
  decisions, 
  isVisible,
  originalProduct,
  onRestartClassification
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
      
      <div className="space-y-1.5">
        {decisions.map((decision, index) => (
          <DecisionItem 
            key={`${decision.code}-${decision.timestamp}`}
            decision={decision}
            isLast={index === decisions.length - 1}
            nextDecision={index < decisions.length - 1 ? decisions[index + 1] : undefined}
            previousDecisions={decisions.slice(0, index)}
            originalProduct={originalProduct}
            onRestartClassification={onRestartClassification}
          />
        ))}
      </div>
    </div>
  );
};

interface DecisionItemProps {
  decision: ClassificationDecision;
  isLast: boolean;
  nextDecision?: ClassificationDecision;
  previousDecisions: ClassificationDecision[];
  originalProduct?: string;
  onRestartClassification?: (productDescription: string, forcedPath: Array<{ code: string; description: string }>) => void;
}

// Helper function to parse the children data text into structured objects
const parseChildrenData = (data: string): Array<{ code: string; description: string; isGroup: boolean }> => {
  const lines = data.split('\n').filter(line => line.trim());
  const children: Array<{ code: string; description: string; isGroup: boolean }> = [];
  
  for (const line of lines) {
    // Skip header lines
    if (line.includes('Immediate Children:') || line.trim() === '') continue;
    
    // Check if it's a group
    const isGroup = line.startsWith('[GROUP]');
    
    if (isGroup) {
      // Parse group format: [GROUP] Description
      const description = line.replace('[GROUP]', '').trim();
      children.push({
        code: '',
        description,
        isGroup: true
      });
    } else {
      // Parse regular format: CODE - Description
      // Updated regex to handle codes with dots (e.g., 0302.85.11.00)
      const match = line.match(/^([\d.]+)\s*-\s*(.+)$/);
      if (match) {
        children.push({
          code: match[1],
          description: match[2].trim(),
          isGroup: false
        });
      }
    }
  }
  
  return children;
};

const DecisionItem: React.FC<DecisionItemProps> = ({ decision, isLast, nextDecision, previousDecisions, originalProduct, onRestartClassification }) => {
  const [showCompetitors, setShowCompetitors] = useState(false);
  const hasCompetitors = decision.competitors && decision.competitors.length > 0;
  
  // State for showing immediate children
  const [showChildren, setShowChildren] = useState(false);
  const [childrenData, setChildrenData] = useState<string>("");
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [childrenError, setChildrenError] = useState<string>("");
  const [selectedChild, setSelectedChild] = useState<string>(nextDecision?.code || "");
  const [clickedChild, setClickedChild] = useState<string>("");
  const [confirmingRestart, setConfirmingRestart] = useState<string>("");

  const handleViewChildren = async () => {
    if (showChildren && childrenData) {
      // If already showing children, just toggle off
      setShowChildren(false);
      return;
    }

    if (!childrenData) {
      // Need to fetch children
      setLoadingChildren(true);
      setChildrenError("");
      
      try {
        // Use the code directly for API call
        const children = await getHSCodeSubtree(decision.code, false, 1);
        setChildrenData(children);
        setShowChildren(true);
      } catch (error) {
        console.error("Error fetching children:", error);
        setChildrenError(error instanceof Error ? error.message : "Failed to fetch children");
      } finally {
        setLoadingChildren(false);
      }
    } else {
      // Already have children data, just show it
      setShowChildren(true);
    }
  };

  return (
    <div className="animate-scale-in">
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
          <CustomButton
            onClick={handleViewChildren}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            disabled={loadingChildren}
          >
            {loadingChildren ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Eye size={16} />
            )}
            <span>View</span>
          </CustomButton>
        </div>
      </div>

      {/* Children Display */}
      {showChildren && (
        <div className="mt-2 ml-6 animate-fade-in">
          {childrenError ? (
            <div className="text-sm text-red-600 p-3 bg-secondary/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {childrenError}
            </div>
          ) : childrenData ? (
            <div className="space-y-2">
              {parseChildrenData(childrenData).length > 0 ? (
                <>
                  <div className="text-sm font-medium text-muted-foreground">Immediate Children:</div>
                  <div className="space-y-1.5">
                    {parseChildrenData(childrenData).map((child, index) => {
                  // For groups, create a unique identifier using parent code + description
                  const codeForSelection = child.isGroup 
                    ? `${decision.code}:GROUP:${child.description}` 
                    : child.code;
                  const isSelected = codeForSelection && selectedChild === codeForSelection;
                  return (
                    <div
                      key={`${child.code}-${index}`}
                      className={`glass-card rounded-lg ring-1 transition-all cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? 'ring-primary bg-primary/10' 
                          : 'ring-primary/20 bg-primary/5 hover:bg-primary/10'
                      }`}
                      onClick={() => {
                        // Use the same unique identifier as used for selection
                        const codeToUse = codeForSelection;
                        
                        if (codeToUse) {
                          // RESTART FUNCTIONALITY DISABLED - Just update selection
                          setSelectedChild(codeToUse);
                          
                          /* RESTART CODE KEPT FOR FUTURE USE:
                          if (clickedChild === codeToUse) {
                            // Second click - show confirming state then trigger restart
                            setConfirmingRestart(codeToUse);
                            setTimeout(() => {
                              // Build the forced path up to this point
                              const forcedPath = [
                                ...previousDecisions.map(d => ({
                                  code: d.code,
                                  description: d.description
                                })),
                                {
                                  code: decision.code,
                                  description: decision.description
                                }
                              ];
                              
                              // Add the new selection
                              if (!child.isGroup) {
                                forcedPath.push({
                                  code: child.code,
                                  description: child.description
                                });
                              }
                              
                              // Call the restart function if available
                              if (onRestartClassification && originalProduct) {
                                onRestartClassification(originalProduct, forcedPath);
                              } else {
                                console.error('Cannot restart classification: missing product description or restart handler');
                              }
                              
                              setConfirmingRestart("");
                              setClickedChild("");
                            }, 1500); // 1.5 second delay to show confirmation
                          } else {
                            // First click - show message
                            setClickedChild(codeToUse);
                            setSelectedChild(codeToUse);
                            setConfirmingRestart("");
                          }
                          */
                        }
                      }}
                    >
                      <div className="relative w-full p-3">
                        <div className={`flex items-start gap-2 transition-opacity ${
                          clickedChild === codeForSelection && selectedChild === codeForSelection && codeForSelection !== nextDecision?.code
                            ? 'opacity-0'
                            : 'opacity-100'
                        }`}>
                          {/* Blue circle indicator - show for both regular items and groups */}
                          {(child.code || child.isGroup) && (
                            <div className={`w-4 h-4 rounded-full border-2 transition-all flex-shrink-0 ${
                              isSelected 
                                ? 'bg-primary border-primary' 
                                : 'border-primary/40 hover:border-primary'
                            }`} />
                          )}
                          
                          {child.code && (
                            <span className="text-sm font-bold text-primary shrink-0 min-w-[3rem]">
                              {child.code}
                            </span>
                          )}
                          {child.isGroup && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              GROUP
                            </span>
                          )}
                          <span className="text-sm text-foreground leading-relaxed">
                            {child.description}
                          </span>
                        </div>
                        
                        {/* Restart message overlay - DISABLED
                        {clickedChild === codeForSelection && selectedChild === codeForSelection && codeForSelection !== nextDecision?.code && (
                          <div className={`absolute inset-0 flex items-center justify-center rounded-lg animate-fade-in transition-colors ${
                            confirmingRestart === codeForSelection 
                              ? 'bg-primary text-white' 
                              : 'bg-white/95 dark:bg-gray-900/95'
                          }`}>
                            <p className={`text-sm font-medium text-center px-4 ${
                              confirmingRestart === codeForSelection ? 'text-white' : 'text-primary'
                            }`}>
                              {confirmingRestart === codeForSelection ? (
                                <>
                                  <CheckCircle className="h-5 w-5 mx-auto mb-1" />
                                  Restarting...
                                </>
                              ) : (
                                <>
                                  Restart classification with this selection
                                  <span className="block text-xs text-muted-foreground mt-1">
                                    Click again to confirm
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        )}
                        */}
                      </div>
                    </div>
                  );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-secondary/30 rounded-lg text-center">
                  No further subdivisions available for this code
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 bg-secondary/30 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading children...</span>
            </div>
          )}
        </div>
      )}

      {/* Competitors Section - Collapsible */}
      {hasCompetitors && (
        <div className="mt-2 ml-6">
          <Collapsible open={showCompetitors} onOpenChange={setShowCompetitors}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-secondary/20 rounded p-1 -m-1 transition-colors">
                {showCompetitors ? (
                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {decision.competitors!.length} competing option{decision.competitors!.length !== 1 ? 's' : ''} at this level
                  {!showCompetitors && ' (click to view)'}
                </span>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-2">
              <div className="space-y-1">
                {decision.competitors!.slice(0, 3).map((competitor, compIndex) => (
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
                {decision.competitors!.length > 3 && (
                  <div className="text-center py-1">
                    <span className="text-xs text-muted-foreground">
                      +{decision.competitors!.length - 3} more options
                    </span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Connector line to next decision (if not last) */}
      {!isLast && (
        <div className="flex justify-center my-1.5">
          <div className="w-px h-3 bg-gradient-to-b from-primary/50 to-transparent" />
        </div>
      )}
    </div>
  );
};

export default ClassificationDecisionPath;
