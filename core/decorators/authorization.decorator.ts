import { Request } from "express";

export function _Authorization(): ClassDecorator {
  return function (target: any) {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      if (key === "constructor") continue;
      const originalMethod = target.prototype[key];
      if (typeof originalMethod !== "function") continue;

      target.prototype[key] = function (...args: any[]) {
        const req: Request | undefined = args.find(
          (a) => a && a.headers && typeof a.headers === "object",
        );
        if (req) {
          console.log("Headers:", req.headers);
        }
        return originalMethod.apply(this, args);
      };
    }
  };
}

export function Authorize(arg?: any) {
  return function (target: any, key?: string, descriptor?: PropertyDescriptor) {
    console.log({ arg });

    if (key && descriptor) {
      //function decorator
      console.log(target);

      return;
    } else if (typeof target === "function") {
      // class decorator
      for (const key of Object.getOwnPropertyNames(target.prototype)) {
        if (key === "constructor") continue;
        const originalMethod = target.prototype[key];
        if (typeof originalMethod !== "function") continue;

        target.prototype[key] = function (...args: any[]) {
          const req: Request | undefined = args.find(
            (a) => a && a.headers && typeof a.headers === "object",
          );
          if (req) {
            console.log("Headers:", req.headers);
          }
          return originalMethod.apply(this, args);
        };
      }
    } else {
      throw "Only accept class and function decorator";
    }
  };
}
