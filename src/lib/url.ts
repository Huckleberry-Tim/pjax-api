export class Url<T extends string> {
  private readonly URL: T;
  constructor(url: PartialUrl<string> & T)
  constructor(url: T)
  constructor(url: T) {
    this.URL;
    this.parser.href = url || location.href;
    this.parser.setAttribute('href', this.parser.href);
  }
  private readonly parser = document.createElement('a');
  public get href(): T {
    return <any>this.parser.href;
  }
  public get domain(): Url.Domain<T> {
    return <any>`${this.protocol}//${this.host}`;
  }
  public get protocol(): Url.Protocol<T> {
    return <any>this.parser.protocol;
  }
  public get host(): Url.Host<T> {
    return <any>this.parser.host;
  }
  public get hostname(): Url.Hostname<T> {
    return <any>this.parser.hostname;
  }
  public get port(): Url.Port<T> {
    return <any>this.parser.port;
  }
  public get path(): Url.Path<T> {
    return <any>`${this.pathname}${this.query}`;
  }
  public get dir(): Url.Dir<T> {
    return <any>this.pathname.split('/').slice(0, -1).concat('').join('/');
  }
  public get file(): Url.File<T> {
    return <any>this.pathname.split('/').pop();
  }
  public get pathname(): Url.Pathname<T> {
    return <any>`${this.parser.pathname[0] === '/' ? '' : '/'}${this.parser.pathname}`;
  }
  public get query(): Url.Query<T> {
    return <any>this.parser.search;
  }
  public get hash(): Url.Hash<T> {
    return <any>this.parser.hash;
  }
}
export namespace Url {
  export type Domain<T extends string> = PartialUrl<'domain'> & T;
  export type Protocol<T extends string> = PartialUrl<'protocol'> & T;
  export type Host<T extends string> = PartialUrl<'host'> & T;
  export type Hostname<T extends string> = PartialUrl<'hostname'> & T;
  export type Port<T extends string> = PartialUrl<'port'> & T;
  export type Path<T extends string> = PartialUrl<'path'> & T;
  export type Dir<T extends string> = PartialUrl<'dir'> & T;
  export type File<T extends string> = PartialUrl<'file'> & T;
  export type Pathname<T extends string> = PartialUrl<'pathname'> & T;
  export type Query<T extends string> = PartialUrl<'query'> & T;
  export type Hash<T extends string> = PartialUrl<'hash'> & T;
}

declare class PartialUrl<T extends string> {
  private readonly URL: T;
}
