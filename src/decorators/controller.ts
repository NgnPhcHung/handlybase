interface ControllerOptions {
  path?: string;
  children?: Function[];
}
export function Controller(
  pathOrOptions: string | ControllerOptions,
): ClassDecorator {
  return (target) => {
    const opts: ControllerOptions =
      typeof pathOrOptions === "string"
        ? { path: pathOrOptions }
        : pathOrOptions;

    Reflect.defineMetadata("controller:path", opts.path || "", target);
    Reflect.defineMetadata("controller:children", opts.children || [], target);
  };
}
