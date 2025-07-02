import React, { useState } from 'react';
import { StreamEvent } from '@/hooks/useClassificationStream';
import { ChevronDown, ChevronUp, Clock, Info, Copy } from 'lucide-react';
import CustomButton from './ui/CustomButton';

interface EventTimelineProps {
  events: StreamEvent[];
  isVisible: boolean;
}

const EventTimeline: React.FC<EventTimelineProps> = ({ events, isVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isVisible || events.length === 0) {
    return null;
  }

  const copyEventData = async (event: StreamEvent, index: number) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy event data:', error);
    }
  };

  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'classification_start':
      case 'initialization_start':
        return '🚀';
      case 'chapter_selection':
        return '📚';
      case 'path_initialization':
        return '🛤️';
      case 'iteration_start':
        return '🔄';
      case 'candidate_scoring_start':
      case 'candidate_scoring_complete':
        return '🎯';
      case 'beam_leaderboard':
        return '📊';
      case 'question_generated':
        return '❓';
      case 'classification_complete':
        return '✅';
      default:
        return '📝';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="mt-6 glass-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            Classification Events ({events.length})
          </h3>
        </div>
        
        <CustomButton
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              Hide Details <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show Details <ChevronDown className="h-3 w-3" />
            </>
          )}
        </CustomButton>
      </div>

      {isExpanded && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {events.map((event, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-3 bg-secondary/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-lg" role="img" aria-label={event.type}>
                    {getEventIcon(event.type)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {formatEventType(event.type)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(event.timestamp)}
                      </div>
                    </div>
                    
                    {/* Event-specific data display */}
                    {event.type === 'chapter_selection' && (
                      <div className="text-xs text-muted-foreground">
                        {event.data.chapters && event.data.chapters.length > 0 ? (
                          <>Top chapter: {event.data.chapters[0].chapter} - {event.data.chapters[0].description}</>
                        ) : (
                          'Chapter selection completed'
                        )}
                      </div>
                    )}
                    
                    {event.type === 'path_initialized' && (
                      <div className="text-xs text-muted-foreground">
                        {event.data.chapter ? (
                          <>Path initialized for Chapter {event.data.chapter}</>
                        ) : (
                          'Path initialized'
                        )}
                      </div>
                    )}
                    
                    {event.type === 'beam_leaderboard' && (
                      <div className="text-xs text-muted-foreground">
                        {event.data.beam && event.data.beam.length > 0 ? (
                          <>{event.data.beam.length} paths, top: {Math.round((event.data.beam[0]?.cumulative_confidence || 0) * 100)}% confidence</>
                        ) : (
                          'Beam search updated'
                        )}
                      </div>
                    )}
                    
                    {event.type === 'candidate_scoring' && (
                      <div className="text-xs text-muted-foreground">
                        {event.data.progress_percentage ? (
                          <>Progress: {Math.round(event.data.progress_percentage)}% ({event.data.scored_count}/{event.data.total_candidates})</>
                        ) : (
                          'Evaluating candidates'
                        )}
                      </div>
                    )}
                    
                    {event.type === 'question_generated' && (
                      <div className="text-xs text-muted-foreground">
                        {event.data.question?.question_text ? (
                          <>Question: {event.data.question.question_text.substring(0, 50)}...</>
                        ) : (
                          'Clarification question generated'
                        )}
                      </div>
                    )}
                    
                    {event.type === 'classification_complete' && (
                      <div className="text-xs text-muted-foreground">
                        {event.data.final_code ? (
                          <>Final code: {event.data.final_code} ({Math.round((event.data.confidence || 0) * 100)}% confidence)</>
                        ) : (
                          'Classification completed'
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <CustomButton
                  variant="ghost"
                  size="sm"
                  onClick={() => copyEventData(event, index)}
                  className="shrink-0 h-6 w-6 p-0"
                  title="Copy event data"
                >
                  {copiedIndex === index ? (
                    <span className="text-xs text-green-500">✓</span>
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </CustomButton>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!isExpanded && events.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Latest: {formatEventType(events[events.length - 1].type)} at {formatTimestamp(events[events.length - 1].timestamp)}
        </div>
      )}
    </div>
  );
};

export default EventTimeline;
