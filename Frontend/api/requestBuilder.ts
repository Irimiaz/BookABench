export class RequestBuilder<T = any> {
  private entity: string;
  private params: Record<string, any> = {};
  private lastData: any;
  private sendFn: <U>(
    entity: string,
    params: Record<string, any>
  ) => Promise<U>;

  constructor(
    entity: string,
    sendFn: <U>(entity: string, params: Record<string, any>) => Promise<U>
  ) {
    this.entity = entity;
    this.sendFn = sendFn;
  }

  // change the entity mid-stream
  setEntity<NewT>(entityName: string): RequestBuilder<NewT> {
    this.entity = entityName;
    return this as unknown as RequestBuilder<NewT>;
  }

  // add a param—static or via callback(prevData)
  addParam<K extends string, V>(key: K, value: V | ((prev: any) => V)): this {
    if (typeof value === "function") {
      if (this.lastData === undefined) {
        throw new Error("Cannot compute param: no previous data available");
      }
      this.params[key as string] = (value as Function)(this.lastData);
    } else {
      this.params[key] = value;
    }
    return this;
  }

  // fire the request, stash the response
  async send(): Promise<T> {
    const data = await this.sendFn<T>(this.entity, this.params);
    this.lastData = data;
    return data;
  }

  // wipe builder state (params + lastData)
  resetParams(): this {
    this.params = {};
    this.lastData = undefined;
    return this;
  }
}
