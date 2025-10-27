export interface ConnectionStrategy<T = any, R = any> {
  name: string;
  connect(input: T): Promise<R>;
}
