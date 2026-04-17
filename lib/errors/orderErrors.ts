/**
 * Database error codes and their user-friendly French messages
 */

export const DB_ERROR_CODES = {
  RLS_VIOLATION: '42501',
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
} as const;

export const ERROR_MESSAGES_FR = {
  [DB_ERROR_CODES.RLS_VIOLATION]:
    'Impossible de créer la commande en raison de restrictions de sécurité. ' +
    'Veuillez réessayer ou contacter le support si le problème persiste.',
  [DB_ERROR_CODES.UNIQUE_VIOLATION]:
    'Cette commande existe déjà. Veuillez réessayer.',
  [DB_ERROR_CODES.FOREIGN_KEY_VIOLATION]:
    'Données de commande invalides. Veuillez vérifier votre panier et réessayer.',
  [DB_ERROR_CODES.CHECK_VIOLATION]:
    'Données de commande invalides. Veuillez vérifier les informations saisies.',
} as const;

export const ORDER_ITEM_ERROR_MESSAGES_FR = {
  [DB_ERROR_CODES.RLS_VIOLATION]:
    'Impossible de créer les articles de la commande en raison de restrictions de sécurité. ' +
    'Veuillez réessayer ou contacter le support si le problème persiste.',
  [DB_ERROR_CODES.FOREIGN_KEY_VIOLATION]:
    'Un ou plusieurs articles de votre panier ne sont plus disponibles. Veuillez actualiser votre panier.',
} as const;

/**
 * Default error message when no specific mapping is found
 */
export const DEFAULT_ERROR_MESSAGE = 'Une erreur inconnue s\'est produite.' as const;

/**
 * Maps a database error to a user-friendly message
 */
export function getDatabaseErrorMessage(
  error: { code?: string; message?: string } | null,
  isOrderItem = false
): string {
  if (!error) {
    return DEFAULT_ERROR_MESSAGE;
  }

  const errorMap = isOrderItem ? ORDER_ITEM_ERROR_MESSAGES_FR : ERROR_MESSAGES_FR;
  
  // Type-safe error code check
  if (error.code && error.code in errorMap) {
    const errorCode = error.code as keyof typeof errorMap;
    return errorMap[errorCode];
  }

  return error.message || DEFAULT_ERROR_MESSAGE;
}

/**
 * Structured error types for order creation
 */
export class OrderCreationError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'OrderCreationError';
  }
}

export class OrderItemCreationError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'OrderItemCreationError';
  }
}
