function createMethodDecorator(method: string) {
  return (path: string) => {
    return (target: any, propertyKey: string) => {
      const controller = target.constructor;
      const routes = Reflect.getMetadata("routes", controller) || [];
      routes.push({ method, path, handler: propertyKey });
      Reflect.defineMetadata("routes", routes, controller);
    };
  };
}

export const Get = createMethodDecorator("get");
export const Post = createMethodDecorator("post");
export const Put = createMethodDecorator("put");
export const Delete = createMethodDecorator("delete");
