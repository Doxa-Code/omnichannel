export namespace Channel {
  export type Status = "connected" | "disconnected";
  export type Type = "whatsapp" | "instagram";
  export interface Props {
    id: string;
    name: string;
    status: Status;
    createdAt: Date;
    type: Type;
    payload: any;
  }
  export interface Raw {
    id: string;
    name: string;
    status: Status;
    createdAt: Date;
    type: Type;
    payload: any;
  }
}
export class Channel {
  public id: string;
  public name: string;
  public createdAt: Date;
  public status: Channel.Status;
  public type: Channel.Type;
  public payload: any;

  constructor(props: Channel.Props) {
    this.id = props.id;
    this.name = props.name;
    this.createdAt = props.createdAt;
    this.status = props.status;
    this.type = props.type;
    this.payload = props.payload;
  }

  setName(name: string) {
    this.name = name;
  }

  connected(payload: any) {
    this.status = "connected";
    this.payload = payload;
  }

  disconnect() {
    this.status = "disconnected";
    this.payload = {};
  }

  static instance(props: Channel.Props) {
    return new Channel(props);
  }

  static create(name: string, type: Channel.Type) {
    return new Channel({
      id: crypto.randomUUID().toString(),
      name: name || "",
      createdAt: new Date(),
      status: "disconnected",
      type,
      payload: {},
    });
  }
}
