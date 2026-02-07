/**
 * 验证器类
 */

import { ValidationError, ValidationResult, ValidationRule } from './types';

export class Validator {
  private rules: Map<string, ValidationRule[]> = new Map();
  private errors: ValidationError[] = [];

  /**
   * 添加验证规则
   */
  addRule(field: string, rule: ValidationRule): this {
    if (!this.rules.has(field)) {
      this.rules.set(field, []);
    }
    this.rules.get(field)!.push(rule);
    return this;
  }

  /**
   * 添加多个验证规则
   */
  addRules(field: string, rules: ValidationRule[]): this {
    rules.forEach(rule => this.addRule(field, rule));
    return this;
  }

  /**
   * 验证单个字段
   */
  validateField(field: string, value: any): boolean {
    const fieldRules = this.rules.get(field);
    if (!fieldRules) {
      return true;
    }

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        this.errors.push(new ValidationError(field, rule.message, value));
        return false;
      }
    }

    return true;
  }

  /**
   * 验证所有字段
   */
  validate(data: Record<string, any>): ValidationResult {
    this.errors = [];

    for (const [field, rules] of this.rules.entries()) {
      const value = data[field];
      
      for (const rule of rules) {
        if (!rule.validate(value)) {
          this.errors.push(new ValidationError(field, rule.message, value));
          break; // 该字段一个错误就够了
        }
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  /**
   * 清空验证规则
   */
  clear(): void {
    this.rules.clear();
    this.errors = [];
  }

  /**
   * 获取验证错误
   */
  getErrors(): ValidationError[] {
    return this.errors;
  }

  /**
   * 检查是否有错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * 将错误转换为简单对象
   */
  toObject(): Record<string, string> {
    const result: Record<string, string> = {};
    this.errors.forEach(error => {
      result[error.field] = error.message;
    });
    return result;
  }

  /**
   * 创建验证器的便捷方法
   */
  static create(): Validator {
    return new Validator();
  }
}

/**
 * Schema 验证器
 */
export class SchemaValidator {
  private validator: Validator;

  constructor() {
    this.validator = new Validator();
  }

  /**
   * 定义字段
   */
  field(field: string): {
    required: (message?: string) => SchemaValidator;
    email: (message?: string) => SchemaValidator;
    minLength: (min: number, message?: string) => SchemaValidator;
    maxLength: (max: number, message?: string) => SchemaValidator;
    range: (min: number, max: number, message?: string) => SchemaValidator;
    pattern: (regex: RegExp, message?: string) => SchemaValidator;
    custom: (validator: (value: any) => boolean, message: string) => SchemaValidator;
  } {
    return {
      required: (message?: string) => {
        this.validator.addRule(field, { validate: (v: any) => v !== null && v !== undefined && v !== '', message: message || `${field} is required` });
        return this;
      },
      email: (message?: string) => {
        this.validator.addRule(field, { validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: message || `${field} must be a valid email` });
        return this;
      },
      minLength: (min: number, message?: string) => {
        this.validator.addRule(field, { validate: (v: string) => v.length >= min, message: message || `${field} must be at least ${min} characters` });
        return this;
      },
      maxLength: (max: number, message?: string) => {
        this.validator.addRule(field, { validate: (v: string) => v.length <= max, message: message || `${field} must be no more than ${max} characters` });
        return this;
      },
      range: (min: number, max: number, message?: string) => {
        this.validator.addRule(field, { validate: (v: number) => v >= min && v <= max, message: message || `${field} must be between ${min} and ${max}` });
        return this;
      },
      pattern: (regex: RegExp, message?: string) => {
        this.validator.addRule(field, { validate: (v: string) => regex.test(v), message: message || `${field} has invalid format` });
        return this;
      },
      custom: (validator: (value: any) => boolean, message: string) => {
        this.validator.addRule(field, { validate: validator, message });
        return this;
      },
    };
  }

  /**
   * 验证数据
   */
  validate(data: Record<string, any>): ValidationResult {
    return this.validator.validate(data);
  }

  /**
   * 创建 Schema 验证器的便捷方法
   */
  static create(): SchemaValidator {
    return new SchemaValidator();
  }
}
