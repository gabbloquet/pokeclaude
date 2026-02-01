/**
 * Validation des réponses JSON de l'IA
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: (string | number)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Validateur JSON simple (sans dépendance externe)
 */
export class JSONValidator {
  /**
   * Valide un objet contre un schéma
   */
  static validate<T>(data: unknown, schema: JSONSchema): ValidationResult<T> {
    const errors: string[] = [];

    const isValid = this.validateValue(data, schema, '', errors);

    if (isValid) {
      return { success: true, data: data as T };
    }

    return { success: false, errors };
  }

  /**
   * Parse et valide du JSON
   */
  static parseAndValidate<T>(
    jsonString: string,
    schema: JSONSchema
  ): ValidationResult<T> {
    try {
      // Essayer d'extraire le JSON d'un bloc markdown
      const extracted = this.extractJSON(jsonString);
      const data = JSON.parse(extracted);
      return this.validate<T>(data, schema);
    } catch (error) {
      return {
        success: false,
        errors: [`Invalid JSON: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Extrait le JSON d'une chaîne (gère les blocs markdown)
   */
  static extractJSON(input: string): string {
    // Essayer d'extraire d'un bloc markdown ```json
    const markdownMatch = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      return markdownMatch[1].trim();
    }

    // Essayer de trouver un objet ou tableau JSON
    const jsonMatch = input.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    return input.trim();
  }

  private static validateValue(
    value: unknown,
    schema: JSONSchema,
    path: string,
    errors: string[]
  ): boolean {
    const actualType = this.getType(value);

    // Vérifier le type
    if (schema.type !== actualType) {
      errors.push(`${path || 'root'}: expected ${schema.type}, got ${actualType}`);
      return false;
    }

    // Validation spécifique par type
    switch (schema.type) {
      case 'object':
        return this.validateObject(value as Record<string, unknown>, schema, path, errors);
      case 'array':
        return this.validateArray(value as unknown[], schema, path, errors);
      case 'string':
        return this.validateString(value as string, schema, path, errors);
      case 'number':
        return this.validateNumber(value as number, schema, path, errors);
      default:
        return true;
    }
  }

  private static validateObject(
    obj: Record<string, unknown>,
    schema: JSONSchema,
    path: string,
    errors: string[]
  ): boolean {
    let valid = true;

    // Vérifier les champs requis
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in obj)) {
          errors.push(`${path || 'root'}: missing required field '${field}'`);
          valid = false;
        }
      }
    }

    // Valider les propriétés
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const propPath = path ? `${path}.${key}` : key;
          if (!this.validateValue(obj[key], propSchema, propPath, errors)) {
            valid = false;
          }
        }
      }
    }

    return valid;
  }

  private static validateArray(
    arr: unknown[],
    schema: JSONSchema,
    path: string,
    errors: string[]
  ): boolean {
    if (!schema.items) return true;

    let valid = true;

    for (let i = 0; i < arr.length; i++) {
      const itemPath = `${path || 'root'}[${i}]`;
      if (!this.validateValue(arr[i], schema.items, itemPath, errors)) {
        valid = false;
      }
    }

    return valid;
  }

  private static validateString(
    str: string,
    schema: JSONSchema,
    path: string,
    errors: string[]
  ): boolean {
    let valid = true;

    if (schema.minLength !== undefined && str.length < schema.minLength) {
      errors.push(`${path || 'root'}: string too short (min ${schema.minLength})`);
      valid = false;
    }

    if (schema.maxLength !== undefined && str.length > schema.maxLength) {
      errors.push(`${path || 'root'}: string too long (max ${schema.maxLength})`);
      valid = false;
    }

    if (schema.enum && !schema.enum.includes(str)) {
      errors.push(`${path || 'root'}: must be one of [${schema.enum.join(', ')}]`);
      valid = false;
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(str)) {
        errors.push(`${path || 'root'}: does not match pattern ${schema.pattern}`);
        valid = false;
      }
    }

    return valid;
  }

  private static validateNumber(
    num: number,
    schema: JSONSchema,
    path: string,
    errors: string[]
  ): boolean {
    let valid = true;

    if (schema.minimum !== undefined && num < schema.minimum) {
      errors.push(`${path || 'root'}: number too small (min ${schema.minimum})`);
      valid = false;
    }

    if (schema.maximum !== undefined && num > schema.maximum) {
      errors.push(`${path || 'root'}: number too large (max ${schema.maximum})`);
      valid = false;
    }

    if (schema.enum && !schema.enum.includes(num)) {
      errors.push(`${path || 'root'}: must be one of [${schema.enum.join(', ')}]`);
      valid = false;
    }

    return valid;
  }

  private static getType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}
