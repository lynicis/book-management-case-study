import { Span, trace } from "@opentelemetry/api";
import ky, { KyInstance } from "ky-universal";
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
  ): Promise<{ books: GetAllBooksResponse; error?: Error }>;
  getBookById(id: string): Promise<{ book: BookDTO; error?: Error }>;
  updateBook(book: UpdateBookRequest): Promise<Error | undefined>;
  deleteBookById(id: string): Promise<Error | undefined>;
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
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw Error("API_URL is not defined");
    }

    return new BookClient(process.env.NEXT_PUBLIC_API_URL);
  }

  private recordKyException(span: Span, error: unknown) {
    span.recordException(error instanceof Error ? error : String(error));
  }

  async createBook(book: CreateBookRequest): Promise<Error | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("createBook", async (span) => {
        try {
          await this.bookApi.post("book", {
            json: book,
            headers: { "Content-Type": "application/json" },
          });

          return undefined;
        } catch (error) {
          this.recordKyException(span, error);

          return new Error("Error occurred while creating a book");
        } finally {
          span.end();
        }
      });
  }

  async getBooks(
    params?: GetAllBooksRequest,
  ): Promise<{ books: GetAllBooksResponse; error?: Error }> {
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
            error: new Error("Error occurred while fetching books"),
          };
        } finally {
          span.end();
        }
      });
  }

  async getBookById(id: string): Promise<{ book: BookDTO; error?: Error }> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("getBookById", async (span) => {
        try {
          const { book } = await this.bookApi
            .get(`book/${id}`, {
              headers: { Accept: "application/json" },
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
            error: new Error("Error occured while parsing response body"),
          };
        } finally {
          span.end();
        }
      });
  }

  async updateBook(book: UpdateBookRequest): Promise<Error | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("updateBook", async (span) => {
        try {
          await this.bookApi.put(`book/${book.id}`, {
            headers: { "Content-Type": "application/json" },
            json: book,
          });
        } catch (error) {
          this.recordKyException(span, error);

          return new Error("Error occurred while updating a book");
        } finally {
          span.end();
        }
      });
  }

  async deleteBookById(id: string): Promise<Error | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("deleteBookById", async (span) => {
        try {
          await this.bookApi.delete(`book/${id}`);
        } catch (error) {
          this.recordKyException(span, error);

          return new Error("Error occurred while deleting a book");
        } finally {
          span.end();
        }
      });
  }
}
