/**
 * Error Categorization System
 * Categorizes errors and suggests smart recovery actions
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  CALL_SETUP = 'CALL_SETUP',
  CALL_ACTIVE = 'CALL_ACTIVE',
  BALANCE = 'BALANCE',
  BROWSER = 'BROWSER',
  UNKNOWN = 'UNKNOWN',
}

export enum RecoverySuggestion {
  RETRY = 'RETRY',
  CHECK_NETWORK = 'CHECK_NETWORK',
  REQUEST_PERMISSION = 'REQUEST_PERMISSION',
  ADD_CREDITS = 'ADD_CREDITS',
  CHANGE_SETTINGS = 'CHANGE_SETTINGS',
  REPORT_ISSUE = 'REPORT_ISSUE',
  TRY_DIFFERENT_NUMBER = 'TRY_DIFFERENT_NUMBER',
  SWITCH_NETWORK = 'SWITCH_NETWORK',
  WAIT_AND_RETRY = 'WAIT_AND_RETRY',
}

export interface CategorizedError {
  category: ErrorCategory;
  title: string;
  message: string;
  suggestions: RecoverySuggestion[];
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
  details?: string;
}

/**
 * Categorize error based on message and code
 */
export function categorizeError(error: any): CategorizedError {
  const message = error?.message || error?.toString() || 'Unknown error occurred';
  const code = error?.code || '';

  // Network errors
  if (
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('offline') ||
    message.toLowerCase().includes('connection') ||
    code.includes('NETWORK') ||
    code.includes('CONN')
  ) {
    return {
      category: ErrorCategory.NETWORK,
      title: 'Connection Problem',
      message: 'We lost connection to the network. Please check your internet.',
      suggestions: [RecoverySuggestion.CHECK_NETWORK, RecoverySuggestion.RETRY, RecoverySuggestion.SWITCH_NETWORK],
      severity: 'error',
      retryable: true,
      details: message,
    };
  }

  // Permission errors
  if (
    message.toLowerCase().includes('permission') ||
    message.toLowerCase().includes('microphone') ||
    message.toLowerCase().includes('mic') ||
    message.toLowerCase().includes('denied') ||
    code.includes('PERMISSION')
  ) {
    return {
      category: ErrorCategory.PERMISSION,
      title: 'Microphone Permission Required',
      message: 'We need permission to use your microphone to make calls.',
      suggestions: [RecoverySuggestion.REQUEST_PERMISSION, RecoverySuggestion.CHANGE_SETTINGS],
      severity: 'warning',
      retryable: true,
      details: message,
    };
  }

  // Balance errors
  if (
    message.toLowerCase().includes('balance') ||
    message.toLowerCase().includes('credit') ||
    message.toLowerCase().includes('insufficient') ||
    code.includes('BALANCE')
  ) {
    return {
      category: ErrorCategory.BALANCE,
      title: 'Insufficient Balance',
      message: 'Your balance is too low to make this call.',
      suggestions: [RecoverySuggestion.ADD_CREDITS],
      severity: 'warning',
      retryable: false,
      details: message,
    };
  }

  // Call setup errors
  if (
    message.toLowerCase().includes('setup') ||
    message.toLowerCase().includes('initialize') ||
    message.toLowerCase().includes('twilio') ||
    code.includes('SETUP')
  ) {
    return {
      category: ErrorCategory.CALL_SETUP,
      title: 'Call Setup Failed',
      message: 'Failed to prepare the call. This might be a temporary issue.',
      suggestions: [RecoverySuggestion.RETRY, RecoverySuggestion.WAIT_AND_RETRY, RecoverySuggestion.REPORT_ISSUE],
      severity: 'error',
      retryable: true,
      details: message,
    };
  }

  // Call active errors
  if (
    message.toLowerCase().includes('call') ||
    message.toLowerCase().includes('disconnect') ||
    message.toLowerCase().includes('terminated') ||
    code.includes('CALL')
  ) {
    return {
      category: ErrorCategory.CALL_ACTIVE,
      title: 'Call Disconnected',
      message: 'The call was unexpectedly disconnected.',
      suggestions: [RecoverySuggestion.RETRY, RecoverySuggestion.CHECK_NETWORK, RecoverySuggestion.TRY_DIFFERENT_NUMBER],
      severity: 'error',
      retryable: true,
      details: message,
    };
  }

  // Browser compatibility
  if (
    message.toLowerCase().includes('browser') ||
    message.toLowerCase().includes('webrtc') ||
    message.toLowerCase().includes('support') ||
    code.includes('BROWSER')
  ) {
    return {
      category: ErrorCategory.BROWSER,
      title: 'Browser Not Supported',
      message: 'Your browser does not support WebRTC calling.',
      suggestions: [RecoverySuggestion.CHANGE_SETTINGS],
      severity: 'error',
      retryable: false,
      details: message,
    };
  }

  // Unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
    suggestions: [RecoverySuggestion.RETRY, RecoverySuggestion.REPORT_ISSUE],
    severity: 'error',
    retryable: true,
    details: message,
  };
}

/**
 * Get human-readable suggestion text
 */
export function getSuggestionText(suggestion: RecoverySuggestion): { label: string; description: string } {
  const suggestions: Record<RecoverySuggestion, { label: string; description: string }> = {
    [RecoverySuggestion.RETRY]: {
      label: 'Try Again',
      description: 'Attempt to make the call again',
    },
    [RecoverySuggestion.CHECK_NETWORK]: {
      label: 'Check Connection',
      description: 'Verify your internet connection is stable',
    },
    [RecoverySuggestion.REQUEST_PERMISSION]: {
      label: 'Enable Microphone',
      description: 'Grant microphone permission in browser settings',
    },
    [RecoverySuggestion.ADD_CREDITS]: {
      label: 'Add Credits',
      description: 'Add funds to your account to make calls',
    },
    [RecoverySuggestion.CHANGE_SETTINGS]: {
      label: 'Check Settings',
      description: 'Review your browser or device settings',
    },
    [RecoverySuggestion.REPORT_ISSUE]: {
      label: 'Report Issue',
      description: 'Contact support to report this problem',
    },
    [RecoverySuggestion.TRY_DIFFERENT_NUMBER]: {
      label: 'Try Different Number',
      description: 'Attempt calling a different number',
    },
    [RecoverySuggestion.SWITCH_NETWORK]: {
      label: 'Switch Network',
      description: 'Try switching to WiFi or mobile data',
    },
    [RecoverySuggestion.WAIT_AND_RETRY]: {
      label: 'Wait & Retry',
      description: 'Wait a moment, then try again',
    },
  };

  return suggestions[suggestion] || { label: 'Try Again', description: 'Retry the action' };
}

/**
 * Get error color based on category
 */
export function getErrorColor(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'bg-orange-50 border-orange-200 text-orange-700';
    case ErrorCategory.PERMISSION:
      return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    case ErrorCategory.CALL_SETUP:
      return 'bg-red-50 border-red-200 text-red-700';
    case ErrorCategory.CALL_ACTIVE:
      return 'bg-red-50 border-red-200 text-red-700';
    case ErrorCategory.BALANCE:
      return 'bg-purple-50 border-purple-200 text-purple-700';
    case ErrorCategory.BROWSER:
      return 'bg-red-50 border-red-200 text-red-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700';
  }
}

/**
 * Get error icon based on category
 */
export function getErrorIcon(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return '🌐';
    case ErrorCategory.PERMISSION:
      return '🎤';
    case ErrorCategory.CALL_SETUP:
      return '☎️';
    case ErrorCategory.CALL_ACTIVE:
      return '📵';
    case ErrorCategory.BALANCE:
      return '💳';
    case ErrorCategory.BROWSER:
      return '💻';
    default:
      return '⚠️';
  }
}
