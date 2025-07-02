import React from 'react';
import { Loader2, Clock, Zap, MessageCircle } from 'lucide-react';
import BeamSearchDisplay from './BeamSearchDisplay';
import EventTimeline from './EventTimeline';
import QuestionFlow from './QuestionFlow';
import ClassificationDecisionPath from './ClassificationDecisionPath';
import { StreamingState } from '@/hooks/useClassificationStream';

interface StreamingProgressProps {
  streamingState: StreamingState;
  showTechnicalDetails?: boolean;
  onAnswerQuestion?: (answer: string) => void;
}

const StreamingProgress: React.FC<StreamingProgressProps> = ({ 
  streamingState, 
  showTechnicalDetails = false,
  onAnswerQuestion
}) => {
  const { 
    isStreaming, 
    currentStage, 
    progress, 
    elapsedTime, 
    currentBeam, 
    events,
    isWaitingForAnswer,
    currentQuestion,
    classificationDecisions
  } = streamingState;

  if (!isStreaming) {
    return null;
  }

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Show normal progress view
  return (
    <div className="glass-card p-8 rounded-xl animate-scale-in">
      {/* Main progress section */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative mb-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
        </div>
        
        <h3 className="text-base font-medium mb-2 text-center">
          {currentStage}
        </h3>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{progress}% complete</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatElapsedTime(elapsedTime)}</span>
          </div>
          
          {currentBeam.length > 0 && (
            <div className="flex items-center gap-1">
              <span>•</span>
              <span>{currentBeam.length} paths active</span>
            </div>
          )}
        </div>
      </div>

      {/* Classification Decision Path */}
      <ClassificationDecisionPath 
        decisions={classificationDecisions} 
        isVisible={classificationDecisions.length > 0} 
      />

      {/* Question Flow - shown instead of beam search when needed */}
      {isWaitingForAnswer && currentQuestion ? (
        <div className="mt-4 animate-scale-in">
          <div className="glass-card p-4 rounded-lg ring-1 ring-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
              </div>
              <h4 className="text-sm font-medium text-foreground">
                Clarification Needed
              </h4>
            </div>
            
            <QuestionFlow
              question={{
                id: currentQuestion.question?.question_id || "streaming_question",
                text: currentQuestion.question?.question_text || "Please provide more information about your product",
                options: currentQuestion.question?.options || [],
                question_type: currentQuestion.question?.question_type || "multiple_choice",
              }}
              onAnswer={(questionId, answer) => {
                console.log("[StreamingProgress] Answering question:", { questionId, answer });
                onAnswerQuestion?.(answer);
              }}
              isLoading={false}
            />
          </div>
        </div>
      ) : (
        /* Beam search display - only shown when not waiting for answer */
        <BeamSearchDisplay 
          beam={currentBeam} 
          isVisible={currentBeam.length > 0} 
        />
      )}

      {/* Technical details */}
      {showTechnicalDetails && (
        <EventTimeline 
          events={events} 
          isVisible={events.length > 0} 
        />
      )}

      {/* Status message */}
      <div className="mt-4 text-center">
        <p className="text-xs text-muted-foreground">
          {isWaitingForAnswer ? 'Waiting for your response...' : 'Real-time classification in progress...'}
        </p>
      </div>
    </div>
  );
};

export default StreamingProgress;
