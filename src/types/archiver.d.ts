declare module "archiver" {
  interface ArchiverOptions {
    zlib?: { level?: number };
    gzip?: boolean;
    forceZip64?: boolean;
    store?: boolean;
  }

  interface ZipEntryOptions {
    name?: string;
    date?: Date | string;
    mode?: number;
    prefix?: string;
    store?: boolean;
    comment?: string;
  }

  interface Archiver extends NodeJS.WritableStream {
    append(
      source: string | Buffer | Uint8Array | NodeJS.ReadableStream,
      options?: ZipEntryOptions | string
    ): this;
    finalize(): Promise<void>;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "warning", listener: (error: Error) => void): this;
  }

  export function archiver(format: string, options?: ArchiverOptions): Archiver;
  export default function archiver(format: string, options?: ArchiverOptions): Archiver;
  export = archiver;
}
