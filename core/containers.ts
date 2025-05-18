import "reflect-metadata";

export class Container {
  private instances = new Map();

  resolve<T>(target: new (...args: any[]) => T): T {
    const deps = Reflect.getMetadata("design:paramtypes", target) || [];
    const injections = deps.map((dep: any) => this.resolve(dep));
    const instance = new target(...injections);
    this.instances.set(target, instance);
    return instance;
  }
}
