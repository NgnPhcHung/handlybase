import "reflect-metadata";

enum ParamType {
  BODY = "body",
  QUERY = "query",
  PARAM = "param",
  REQ = "req",
}

export function createParamDecorator(type: ParamType, key?: string) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingParams: any[] =
      Reflect.getMetadata("params", target, propertyKey) || [];

    existingParams.push({
      index: parameterIndex,
      type,
      key,
    });

    Reflect.defineMetadata("params", existingParams, target, propertyKey);
  };
}

export const Body = (key?: string) => createParamDecorator(ParamType.BODY, key);
export const Query = (key?: string) =>
  createParamDecorator(ParamType.QUERY, key);
export const Req = () => createParamDecorator(ParamType.REQ);
