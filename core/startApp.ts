import "reflect-metadata";

import { Express, Request, Response } from "express";
import { Container } from "./containers";
import { AnyClass } from "./types/object";

export const container = new Container();

interface BootstrapAppOps {
  expressApp: Express;
  controllers: AnyClass[];
  parentPath?: string;
}

enum ParamType {
  BODY = "body",
  QUERY = "query",
  PARAM = "param",
  REQ = "req",
}

function resolveParams(
  req: Request,
  _: Response,
  instance: any,
  handlerName: string,
): any[] {
  const prototype = Object.getPrototypeOf(instance);

  const meta: any[] =
    Reflect.getMetadata("params", prototype, handlerName) || [];
  const params: any[] = [];

  for (const param of meta) {
    let value: any;
    switch (param.type) {
      case ParamType.BODY:
        value = param.key ? req.body?.[param.key] : req.body;
        break;
      case ParamType.QUERY:
        value = param.key ? req.query?.[param.key] : req.query;
        break;
      case ParamType.PARAM:
        value = param.key ? req.params?.[param.key] : req.params;
        break;
      case ParamType.REQ:
        value = req;
        break;
      default:
        value = undefined;
    }
    params[param.index] = value;
  }
  return params;
}

export const bootstrapApp = ({
  expressApp,
  controllers,
  parentPath = "",
}: BootstrapAppOps): Express => {
  for (const controller of controllers) {
    const prefix = Reflect.getMetadata("controller:path", controller) || "";
    const children =
      Reflect.getMetadata("controller:children", controller) || [];

    const fullPath = `${parentPath}/${prefix}`.replace(/\/+/g, "/");
    const instance = container.resolve(controller) as Record<string, any>;
    const routes = Reflect.getMetadata("routes", controller) || [];

    for (const route of routes) {
      const method = route.method as keyof Express;
      const routeHandler = route.handler;
      const fullRoutePath = `/${fullPath}/${route.path}`.replace(/\/+/g, "/");
      (expressApp[method] as any)(
        fullRoutePath,
        async (req: Request, res: Response) => {
          try {
            const params = resolveParams(req, res, instance, routeHandler);
            const result = await instance[routeHandler](...params);
            console.log("result", result);
            res.json(result);
          } catch (err) {
            res
              .status(500)
              .json({ error: err instanceof Error ? err.message : err });
          }
        },
      );

      console.log("[Handly bootstrap] route:", {
        method,
        path: fullRoutePath,
        handler: route.handler,
      });
    }

    bootstrapApp({
      expressApp,
      controllers: children,
      parentPath: fullPath,
    });
  }
  return expressApp;
};
