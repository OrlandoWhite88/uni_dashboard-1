import React from 'react';
import { BeamPath } from '@/hooks/useClassificationStream';
import { TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface BeamSearchDisplayProps {
  beam: BeamPath[];
  isVisible: boolean;
}

const BeamSearchDisplay: React.FC<BeamSearchDisplayProps> = ({ beam, isVisible }) => {
  if (!isVisible || beam.length === 0) {
    return null;
  }

  // Show top 3 paths for better UI
  const topPaths = beam.slice(0, 3);

  return (
    <div className="mt-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          Classification Paths Being Explored
        </h3>
      </div>
      
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
    </div>
  );
};

export default BeamSearchDisplay;
