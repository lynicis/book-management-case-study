import ky, { HTTPError, KyInstance } from "ky-universal";
import { Span, trace } from "@opentelemetry/api";
import ms from "ms";

import { BookDTO } from "@/dto/book.dto";

export type GetAllBooksRequest = Partial<{
  page: number;
  pageSize: number;
  search: string;
}>;

export type CreateBookRequest = {
  title: string;
  author: string;
  publicationYear: string;
};

export type UpdateBookRequest = CreateBookRequest & { id: string };

export type GetAllBooksResponse = {
  books: BookDTO[];
  totalPage: number;
};

export interface IBookClient {
  createBook(book: CreateBookRequest): Promise<Error | undefined>;
  getBooks(
    params?: GetAllBooksRequest,
  ): Promise<{ books: GetAllBooksResponse; error?: HTTPError }>;
  getBookById(id: string): Promise<{ book: BookDTO; error?: HTTPError }>;
  updateBook(book: UpdateBookRequest): Promise<HTTPError | undefined>;
  deleteBookById(id: string): Promise<HTTPError | undefined>;
}

export default class BookClient implements IBookClient {
  private bookApi: KyInstance;

  constructor(apiUrl: string) {
    this.bookApi = ky.create({
      prefixUrl: apiUrl,
      retry: {
        limit: 3,
      },
    });
  }

  static createFromEnv(): BookClient {
    return trace
      .getTracer("book-web-app")
      .startActiveSpan("createBookClient", (span) => {
        if (!process.env.NEXT_PUBLIC_API_URL) {
          const error = new Error("API_URL is not defined");

          span.recordException(error);
          span.end();
          throw error;
        }

        span.end();

        return new BookClient(process.env.NEXT_PUBLIC_API_URL);
      });
  }

  private recordKyException(span: Span, error: unknown) {
    span.recordException(error instanceof Error ? error : String(error));
  }

  async createBook(book: CreateBookRequest): Promise<Error | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("createBook", async (span) => {
        try {
          await this.bookApi.post("book", { json: book });
        } catch (error) {
          this.recordKyException(span, error);

          return error as HTTPError;
        } finally {
          span.end();
        }
      });
  }

  async getBooks(
    params?: GetAllBooksRequest,
  ): Promise<{ books: GetAllBooksResponse; error?: HTTPError }> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("getBooks", async (span) => {
        const searchParams = new URLSearchParams();

        if (params?.page || params?.pageSize) {
          searchParams.set("page", params?.page?.toString() || "1");
          searchParams.set("pageSize", params?.pageSize?.toString() || "5");
        }

        if (params?.search) {
          searchParams.set("search", params?.search);
        }

        try {
          const books = await this.bookApi
            .get("books", {
              searchParams: searchParams,
              next: {
                tags: ["books"],
                revalidate: ms("1h"),
              },
            })
            .json<GetAllBooksResponse>();

          return { books };
        } catch (error) {
          this.recordKyException(span, error);

          return {
            books: <GetAllBooksResponse>{},
            error: error as HTTPError,
          };
        } finally {
          span.end();
        }
      });
  }

  async getBookById(id: string): Promise<{ book: BookDTO; error?: HTTPError }> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("getBookById", async (span) => {
        try {
          const { book } = await this.bookApi
            .get(`book/${id}`, {
              next: {
                tags: ["book"],
                revalidate: ms("1h"),
              },
            })
            .json<{ book: BookDTO }>();

          return { book };
        } catch (error) {
          this.recordKyException(span, error);

          return {
            book: <BookDTO>{},
            error: error as HTTPError,
          };
        } finally {
          span.end();
        }
      });
  }

  async updateBook(book: UpdateBookRequest): Promise<HTTPError | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("updateBook", async (span) => {
        try {
          await this.bookApi.put(`book/${book.id}`, { json: book });
        } catch (error) {
          this.recordKyException(span, error);

          return error as HTTPError;
        } finally {
          span.end();
        }
      });
  }

  async deleteBookById(id: string): Promise<HTTPError | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("deleteBookById", async (span) => {
        try {
          await this.bookApi.delete(`book/${id}`);
        } catch (error) {
          this.recordKyException(span, error);

          return error as HTTPError;
        } finally {
          span.end();
        }
      });
  }
}
