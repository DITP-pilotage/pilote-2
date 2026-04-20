export interface RapportFileStorage {
  save(
    userId: string,
    filename: string,
    content: Buffer | string,
  ): Promise<string>;

  read(
    userId: string,
    filename: string,
  ): Promise<{ stream: ReadableStream; contentType: string } | null>;

  deleteOlderThan(maxAgeMs: number): Promise<number>;
}
