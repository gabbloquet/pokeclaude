/**
 * Validation et sanitisation du contenu généré par l'IA
 */

const FORBIDDEN_WORDS = [
  // Contenu inapproprié (simplifié pour un jeu familial)
  'violence',
  'mort',
  'tuer',
  'sang',
  'drogue',
  'alcool',
  'sexe',
];

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_NAME_LENGTH = 20;
const MAX_DIALOGUE_LENGTH = 300;

export interface ContentValidationOptions {
  maxLength?: number;
  allowedHtml?: boolean;
  checkForbiddenWords?: boolean;
}

export interface ContentValidationResult {
  isValid: boolean;
  sanitized: string;
  warnings: string[];
}

export class ContentValidator {
  /**
   * Valide et sanitise une description
   */
  static validateDescription(
    content: string,
    options: ContentValidationOptions = {}
  ): ContentValidationResult {
    return this.validate(content, {
      maxLength: options.maxLength ?? MAX_DESCRIPTION_LENGTH,
      allowedHtml: false,
      checkForbiddenWords: true,
      ...options,
    });
  }

  /**
   * Valide et sanitise un nom
   */
  static validateName(
    content: string,
    options: ContentValidationOptions = {}
  ): ContentValidationResult {
    const result = this.validate(content, {
      maxLength: options.maxLength ?? MAX_NAME_LENGTH,
      allowedHtml: false,
      checkForbiddenWords: true,
      ...options,
    });

    // Capitaliser la première lettre
    if (result.sanitized.length > 0) {
      result.sanitized =
        result.sanitized.charAt(0).toUpperCase() + result.sanitized.slice(1);
    }

    return result;
  }

  /**
   * Valide et sanitise un dialogue
   */
  static validateDialogue(
    content: string,
    options: ContentValidationOptions = {}
  ): ContentValidationResult {
    return this.validate(content, {
      maxLength: options.maxLength ?? MAX_DIALOGUE_LENGTH,
      allowedHtml: false,
      checkForbiddenWords: true,
      ...options,
    });
  }

  /**
   * Validation générique
   */
  static validate(
    content: string,
    options: ContentValidationOptions
  ): ContentValidationResult {
    const warnings: string[] = [];
    let sanitized = content;

    // 1. Supprimer les caractères de contrôle
    sanitized = this.removeControlCharacters(sanitized);

    // 2. Supprimer le HTML si non autorisé
    if (!options.allowedHtml) {
      const beforeHtml = sanitized;
      sanitized = this.stripHtml(sanitized);
      if (beforeHtml !== sanitized) {
        warnings.push('HTML content was removed');
      }
    }

    // 3. Tronquer si trop long
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = this.truncate(sanitized, options.maxLength);
      warnings.push(`Content truncated to ${options.maxLength} characters`);
    }

    // 4. Vérifier les mots interdits
    let containsForbidden = false;
    if (options.checkForbiddenWords) {
      const forbidden = this.findForbiddenWords(sanitized);
      if (forbidden.length > 0) {
        containsForbidden = true;
        warnings.push(`Contains potentially inappropriate content`);
      }
    }

    // 5. Nettoyer les espaces multiples
    sanitized = this.normalizeWhitespace(sanitized);

    return {
      isValid: !containsForbidden && sanitized.length > 0,
      sanitized,
      warnings,
    };
  }

  /**
   * Supprime les caractères de contrôle
   */
  private static removeControlCharacters(str: string): string {
    // Garder seulement les caractères imprimables et les retours à la ligne
    // eslint-disable-next-line no-control-regex
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Supprime les balises HTML
   */
  private static stripHtml(str: string): string {
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Tronque le texte proprement (sans couper les mots)
   */
  private static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;

    // Trouver le dernier espace avant la limite
    const truncated = str.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated.substring(0, maxLength - 3) + '...';
  }

  /**
   * Trouve les mots interdits dans le texte
   */
  private static findForbiddenWords(str: string): string[] {
    const lowerStr = str.toLowerCase();
    return FORBIDDEN_WORDS.filter((word) => lowerStr.includes(word));
  }

  /**
   * Normalise les espaces (multiples → simple)
   */
  private static normalizeWhitespace(str: string): string {
    return str
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  }

  /**
   * Échappe le contenu pour l'affichage sécurisé
   */
  static escapeForDisplay(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
