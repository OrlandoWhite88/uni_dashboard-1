// src/lib/analyticsService.ts
import { track } from '@vercel/analytics';

/**
 * Tracks when a user starts a classification
 * @param productDescription The product description being classified
 */
export const trackClassificationStart = (productDescription: string) => {
  try {
    track('ClassificationStart', {
      productLength: productDescription.length
    });
    console.log('[Analytics] Tracked classification start');
  } catch (error) {
    console.error('[Analytics] Error tracking classification start:', error);
  }
};

/**
 * Tracks when a user answers a question during classification
 * @param questionText The question that was asked
 * @param answer The answer provided by the user
 */
export const trackQuestionAnswer = (questionText: string, answer: string) => {
  try {
    track('QuestionAnswer', {
      questionType: getQuestionType(questionText)
    });
    console.log('[Analytics] Tracked question answer');
  } catch (error) {
    console.error('[Analytics] Error tracking question answer:', error);
  }
};

/**
 * Tracks when a classification result is shown to the user
 * @param hsCode The HS code that was determined
 */
export const trackClassificationResult = (hsCode: string) => {
  try {
    track('ClassificationResult', {
      codeLength: hsCode.length,
      codePrefix: hsCode.substring(0, 2) // First two digits represent the chapter
    });
    console.log('[Analytics] Tracked classification result');
  } catch (error) {
    console.error('[Analytics] Error tracking classification result:', error);
  }
};

/**
 * Helper function to determine question type from question text
 */
const getQuestionType = (questionText: string): string => {
  const text = questionText.toLowerCase();
  
  if (text.includes('material') || text.includes('made of')) {
    return 'material';
  } else if (text.includes('purpose') || text.includes('used for')) {
    return 'purpose';
  } else if (text.includes('component') || text.includes('part')) {
    return 'component';
  } else {
    return 'other';
  }
};
