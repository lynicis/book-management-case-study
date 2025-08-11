import ky, { HTTPError, KyInstance } from "ky-universal";
import { Span, SpanStatusCode, trace } from "@opentelemetry/api";
import ms from "ms";

import { BookDTO } from "@/dto/book.dto";

export type GetAllBooksRequest = Partial<{
  page: number;
  pageSize: number;
  search: string;
}>;

export type CreateBookRequest = {
  coverUrl: string;
  isbn: string;
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
  createBook(book: CreateBookRequest): Promise<HTTPError | undefined>;
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

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: "API_URL is not defined",
          });
          span.end();

          throw error;
        }

        span.setStatus({
          code: SpanStatusCode.OK,
          message: "Book client created successfully",
        });
        span.end();

        return new BookClient(process.env.NEXT_PUBLIC_API_URL);
      });
  }

  private recordKyException(span: Span, error: unknown) {
    span.recordException(error instanceof Error ? error : String(error));
    span.end();
  }

  async createBook(book: CreateBookRequest): Promise<HTTPError | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("createBook", async (span) => {
        try {
          span.setAttributes({
            newBook: JSON.stringify(book),
          });
          await this.bookApi.post("book", { json: book });

          span.setStatus({
            code: SpanStatusCode.OK,
            message: "Book created successfully",
          });
          span.end();
        } catch (error) {
          this.recordKyException(span, error);

          return error as HTTPError;
        }
      });
  }

  async getBooks(
    params?: GetAllBooksRequest,
  ): Promise<{ books: GetAllBooksResponse; error?: HTTPError }> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("getBooks", async (span) => {
        span.setAttributes({
          page: params?.page,
          pageSize: params?.pageSize,
          search: params?.search,
        });

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

          span.setStatus({
            code: SpanStatusCode.OK,
            message: "Books fetched successfully",
          });
          span.end();

          return { books };
        } catch (error) {
          this.recordKyException(span, error);

          return {
            books: <GetAllBooksResponse>{},
            error: error as HTTPError,
          };
        }
      });
  }

  async getBookById(id: string): Promise<{ book: BookDTO; error?: HTTPError }> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("getBookById", async (span) => {
        try {
          span.setAttribute("bookId", id);
          const { book } = await this.bookApi
            .get(`book/${id}`, {
              next: {
                tags: ["book"],
                revalidate: ms("1h"),
              },
            })
            .json<{ book: BookDTO }>();

          span.setStatus({
            code: SpanStatusCode.OK,
            message: "Book fetched successfully",
          });
          span.end();

          return { book };
        } catch (error) {
          this.recordKyException(span, error);

          return {
            book: <BookDTO>{},
            error: error as HTTPError,
          };
        }
      });
  }

  async updateBook(book: UpdateBookRequest): Promise<HTTPError | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("updateBook", async (span) => {
        try {
          span.setAttribute("bookId", book.id);
          await this.bookApi.put(`book/${book.id}`, { json: book });

          span.setStatus({
            code: SpanStatusCode.OK,
            message: "Book updated successfully",
          });
          span.end();
        } catch (error) {
          this.recordKyException(span, error);

          return error as HTTPError;
        }
      });
  }

  async deleteBookById(id: string): Promise<HTTPError | undefined> {
    return await trace
      .getTracer("book-web-app")
      .startActiveSpan("deleteBookById", async (span) => {
        try {
          span.setAttribute("bookId", id);
          await this.bookApi.delete(`book/${id}`);

          span.setStatus({
            code: SpanStatusCode.OK,
            message: "Book deleted successfully",
          });
          span.end();
        } catch (error) {
          this.recordKyException(span, error);

          return error as HTTPError;
        }
      });
  }
}
