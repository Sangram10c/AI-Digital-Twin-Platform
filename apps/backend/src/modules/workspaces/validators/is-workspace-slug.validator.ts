import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isWorkspaceSlug', async: false })
export class IsWorkspaceSlugConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 150;
  }

  defaultMessage(): string {
    return 'Slug must be lowercase alphanumeric with hyphens only (max 150 chars)';
  }
}

export function IsWorkspaceSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsWorkspaceSlugConstraint,
    });
  };
}
