export function combineDecorator(
  ...decorators: MethodDecorator[]
): MethodDecorator {
  return function (target, propertyKey, descriptors) {
    for (const decorator of decorators) {
      decorator(target, propertyKey, descriptors);
    }
  };
}
