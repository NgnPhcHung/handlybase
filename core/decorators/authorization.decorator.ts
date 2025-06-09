import { Request } from "express";

export function Authorization(): ClassDecorator {
  return function (target: any) {
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      if (key === "constructor") continue;
      const originalMethod = target.prototype[key];
      if (typeof originalMethod !== "function") continue;
      console.log({ originalMethod });

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
