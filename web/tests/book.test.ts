import path from "path";

import { describe, expect, it, beforeEach } from "bun:test";
import { MatchersV3, PactV4 } from "@pact-foundation/pact";
import { HTTPError } from "ky-universal";

import BookClient, {
  CreateBookRequest,
  UpdateBookRequest,
} from "@/clients/book.client";

describe.only("[pact]", () => {
  let consumer: PactV4;

  beforeEach(() => {
    consumer = new PactV4({
      dir: path.resolve(process.cwd(), "pacts"),
      consumer: "BookWebApp",
      provider: "BookAPI",
    });
    consumer.setup();
  });

  describe("POST /book", () => {
    const bookExample: CreateBookRequest = {
      coverUrl: "https://picsum.photos/seed/5CsJk20lGp/3533/3856",
      isbn: "978-0-928061-84-0",
      title: "I, Claudius",
      author: "Philip Roth",
      publicationYear: "2025",
    };

    it("happy path", async () => {
      return consumer
        .addInteraction()
        .given("A book for create")
        .uponReceiving("A request to create a book")
        .withRequest("POST", "/book", (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(bookExample);
        })
        .willRespondWith(201)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.createBook(bookExample);

          expect(error).toBeUndefined();
        });
    });

    it("server error", () => {
      return consumer
        .addInteraction()
        .given("A book for create while server in error state")
        .uponReceiving("Error occurred while creating a book")
        .withRequest("POST", "/book", (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(MatchersV3.like(bookExample));
        })
        .willRespondWith(500)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.createBook(bookExample);

          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(500);
        });
    });
  });

  describe("GET /books", () => {
    const bookExample = {
      id: "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59",
      coverUrl: "https://picsum.photos/seed/5CsJk20lGp/3533/3856",
      isbn: "978-0-928061-84-0",
      title: "I, Claudius",
      author: "Philip Roth",
      publicationYear: "2025",
      createdAt: "2025-08-11T07:16:43.000Z",
    };

    it("happy path", () => {
      return consumer
        .addInteraction()
        .given("A list of books")
        .uponReceiving("A request for all books")
        .withRequest("GET", "/books", (builder) => {
          builder.headers({ Accept: "application/json" });
        })
        .willRespondWith(200, (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(
            MatchersV3.like({
              books: MatchersV3.eachLike(bookExample),
              totalPage: MatchersV3.like(1),
            }),
          );
        })
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const {
            books: { books, totalPage },
            error,
          } = await bookClient.getBooks();

          expect(error).toBeUndefined();
          expect(books[0]).toEqual(bookExample);
          expect(totalPage).toEqual(1);
        });
    });

    it("books not found", () => {
      return consumer
        .addInteraction()
        .given("No books found")
        .uponReceiving("A request for books but not found")
        .withRequest("GET", "/books", (builder) => {
          builder.headers({ Accept: "application/json" });
        })
        .willRespondWith(404)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const { books, error } = await bookClient.getBooks();

          expect(books).toBeEmptyObject();
          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(404);
        });
    });

    it("server error", () => {
      return consumer
        .addInteraction()
        .given("A list of books while server in error state")
        .uponReceiving("Error occurred while getting all books")
        .withRequest("GET", "/books", (builder) => {
          builder.headers({ Accept: "application/json" });
        })
        .willRespondWith(500)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const {
            books: { books, totalPage },
            error,
          } = await bookClient.getBooks();

          expect(books).toBeUndefined();
          expect(totalPage).toBeUndefined();
          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(500);
        });
    });
  });

  describe("GET /book/:id", () => {
    const bookExample = {
      id: "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59",
      coverUrl: "https://picsum.photos/seed/5CsJk20lGp/3533/3856",
      isbn: "978-0-928061-84-0",
      title: "I, Claudius",
      author: "Philip Roth",
      publicationYear: "2025",
      createdAt: "2025-08-11T07:16:43.000Z",
    };

    it("happy path", () => {
      return consumer
        .addInteraction()
        .given("A book with id for get book detail")
        .uponReceiving("A request for a book")
        .withRequest("GET", `/book/${bookExample.id}`, (builder) =>
          builder.headers({ Accept: "application/json" }),
        )
        .willRespondWith(200, (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(
            MatchersV3.like({
              book: MatchersV3.like(bookExample),
            }),
          );
        })
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const { book, error } = await bookClient.getBookById(bookExample.id!);

          expect(error).toBeUndefined();
          expect(book).toEqual(bookExample);
        });
    });

    it("book not found", () => {
      const bookId = "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59";

      return consumer
        .addInteraction()
        .given("Not existed book with id for get book detail")
        .uponReceiving("Book not found")
        .withRequest("GET", `/book/${bookId}`, (builder) =>
          builder.headers({ Accept: "application/json" }),
        )
        .willRespondWith(404)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const { book, error } = await bookClient.getBookById(bookId);

          expect(book).toBeEmptyObject();
          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(404);
        });
    });

    it("server error", () => {
      const bookId = "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59";

      return consumer
        .addInteraction()
        .given("A book with id while server in error state")
        .uponReceiving("Error occurred while getting the book")
        .withRequest("GET", `/book/${bookId}`, (builder) =>
          builder.headers({ Accept: "application/json" }),
        )
        .willRespondWith(500)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const { book, error } = await bookClient.getBookById(bookId);

          expect(book).toBeEmptyObject();
          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(500);
        });
    });
  });

  describe("PUT /book/:id", () => {
    const bookExample: UpdateBookRequest = {
      id: "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59",
      coverUrl: "https://picsum.photos/seed/5CsJk20lGp/3533/3856",
      isbn: "978-0-928061-84-0",
      title: "I, Claudius",
      author: "Philip Roth",
      publicationYear: "2025",
    };

    it("happy path", () => {
      consumer
        .addInteraction()
        .given("A book with id and fields for update")
        .uponReceiving("A request to update a book")
        .withRequest("PUT", `/book/${bookExample.id}`, (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(bookExample);
        })
        .willRespondWith(204)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.updateBook(bookExample);

          expect(error).toBeUndefined();
        });
    });

    it("book not found", () => {
      consumer
        .addInteraction()
        .given("Not existed book with id and fields for update")
        .uponReceiving("Book not found for update")
        .withRequest("PUT", `/book/${bookExample.id}`, (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(bookExample);
        })
        .willRespondWith(404)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.updateBook(bookExample);

          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(404);
        });
    });

    it("server error", () => {
      consumer
        .addInteraction()
        .given("A book with id and fields but while server in error state")
        .uponReceiving("Error occurred while updating a book")
        .withRequest("PUT", `/book/${bookExample.id}`, (builder) => {
          builder.headers({ "Content-Type": "application/json" });
          builder.jsonBody(bookExample);
        })
        .willRespondWith(500)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.updateBook(bookExample);

          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(500);
        });
    });
  });

  describe("DELETE /book/:id", () => {
    const bookId = "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59";

    it("happy path", () => {
      return consumer
        .addInteraction()
        .given("A book with id for delete")
        .uponReceiving("A request to delete a book")
        .withRequest("DELETE", `/book/${bookId}`)
        .willRespondWith(204)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.deleteBookById(bookId);

          expect(error).toBeUndefined();
        });
    });

    it("book not found", () => {
      return consumer
        .addInteraction()
        .given("Not existed book with id for delete")
        .uponReceiving("Book not found for delete")
        .withRequest("DELETE", `/book/${bookId}`)
        .willRespondWith(404)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.deleteBookById(bookId);

          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(404);
        });
    });

    it("server error", () => {
      return consumer
        .addInteraction()
        .given("A book with id while server in error state for delete")
        .uponReceiving("Error occurred while deleting a book")
        .withRequest("DELETE", `/book/${bookId}`)
        .willRespondWith(500)
        .executeTest(async (mockserver) => {
          const bookClient = new BookClient(mockserver.url);
          const error = await bookClient.deleteBookById(bookId);

          expect(error).toBeDefined();
          expect(error).toBeInstanceOf(HTTPError);
          expect(error?.response?.status).toBe(500);
        });
    });
  });
});
