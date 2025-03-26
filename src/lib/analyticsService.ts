import { track } from '@vercel/analytics';

// Define event categories
export enum EventCategory {
  CLASSIFICATION = 'classification',
  INTERACTION = 'interaction',
  CONVERSION = 'conversion',
}

// Define classification stages
export enum ClassificationStage {
  STARTED = 'classification_started',
  ANALYZING = 'analyzing_product',
  IDENTIFYING_CHAPTER = 'identifying_chapter',
  CLASSIFYING_HEADING = 'classifying_heading',
  DETERMINING_SUBHEADING = 'determining_subheading',
  CLASSIFYING_GROUP = 'classifying_group',
  CLASSIFYING_TITLE = 'classifying_title',
  FINALIZING = 'finalizing_classification',
  QUESTION_ASKED = 'question_asked',
  ANSWER_SUBMITTED = 'answer_submitted',
  COMPLETED = 'classification_completed',
  ERROR = 'classification_error'
}

/**
 * Track an event in both Vercel Analytics and Google Analytics
 * 
 * @param eventName The name of the event to track
 * @param properties Optional properties to include with the event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Track with Vercel Analytics
  track(eventName, properties);
  
  // Track with Google Analytics (gtag)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      ...properties,
      event_category: properties?.category || 'general',
    });
    console.log(`[Analytics] Tracked event: ${eventName}`, properties);
  } else {
    console.warn('[Analytics] Google Analytics not available');
  }
};

/**
 * Track a classification stage event
 * 
 * @param stage The classification stage
 * @param properties Additional properties to include with the event
 */
export const trackClassificationStage = (stage: ClassificationStage, properties?: Record<string, any>) => {
  trackEvent(stage, {
    category: EventCategory.CLASSIFICATION,
    ...properties
  });
};

/**
 * Track when a user starts the classification process
 * 
 * @param productDescription The product description submitted by the user
 */
export const trackClassificationStart = (productDescription: string) => {
  trackClassificationStage(ClassificationStage.STARTED, {
    description_length: productDescription.length,
  });
};

/**
 * Track when a specific question is asked in the classification process
 * 
 * @param questionId The ID of the question
 * @param questionText The text of the question
 */
export const trackQuestionAsked = (questionId: string, questionText: string) => {
  trackClassificationStage(ClassificationStage.QUESTION_ASKED, {
    question_id: questionId,
    question_text: questionText.substring(0, 100), // Limit length for analytics
  });
};

/**
 * Track when a user answers a question in the classification process
 * 
 * @param questionId The ID of the question
 * @param answer The answer submitted by the user
 */
export const trackAnswerSubmitted = (questionId: string, answer: string) => {
  trackClassificationStage(ClassificationStage.ANSWER_SUBMITTED, {
    question_id: questionId,
    answer_length: answer.length,
  });
};

/**
 * Track when a classification is successfully completed
 * 
 * @param hsCode The HS code generated
 * @param confidence The confidence level of the classification
 */
export const trackClassificationCompleted = (hsCode: string, confidence?: number) => {
  trackClassificationStage(ClassificationStage.COMPLETED, {
    hs_code: hsCode,
    confidence: confidence || 'unknown',
  });
};

/**
 * Track when a classification process encounters an error
 * 
 * @param errorMessage The error message
 */
export const trackClassificationError = (errorMessage: string) => {
  trackClassificationStage(ClassificationStage.ERROR, {
    error_message: errorMessage.substring(0, 100), // Limit length for analytics
  });
};
