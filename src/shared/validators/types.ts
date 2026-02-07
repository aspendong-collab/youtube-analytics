/**
 * 验证错误类
 */

export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 验证规则接口
 */
export interface ValidationRule {
  validate(value: any): boolean;
  message: string;
}
