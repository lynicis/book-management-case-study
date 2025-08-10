import path from "path";

import { describe, expect, it, beforeEach } from "bun:test";
import { MatchersV3, PactV4 } from "@pact-foundation/pact";
import { faker } from "@faker-js/faker";

import BookClient from "@/clients/book.client";

describe.only("[pact]", () => {
  const consumer = new PactV4({
    dir: path.resolve(process.cwd(), "pacts"),
    consumer: "BooksWebApp",
    provider: "BooksAPI",
  });

  beforeEach(() => {
    consumer.setup();
  });

  describe("POST /book", () => {
  it("happy path", async () => {  
    const bookExample = {
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    return consumer
      .addInteraction()
      .given("I have a book")
      .uponReceiving("a request to create a book")
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
    const bookExample = {
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    return consumer
      .addInteraction()
      .given("Error occured while creating a book in server")
      .uponReceiving("a request to create a book")
      .withRequest("POST", "/book", (builder) => {
        builder.headers({ "Content-Type": "application/json" });
        builder.jsonBody(MatchersV3.like(bookExample));
      })
      .willRespondWith(500)
      .executeTest(async (mockserver) => {
        const bookClient = new BookClient(mockserver.url);
        const error = await bookClient.createBook(bookExample);

        expect(error).toBeDefined();
      });
  });
});

describe("GET /books", () => {
  it("happy path", () => {
    const bookExample = {
      id: faker.string.uuid(),
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    return consumer
      .addInteraction()
      .given("I have a list of books")
      .uponReceiving("a request for all books")
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
      .given("I couldn't get books")
      .uponReceiving("a request for all books")
      .withRequest("GET", "/books", (builder) => {
        builder.headers({ Accept: "application/json" });
      })
      .willRespondWith(404)
      .executeTest(async (mockserver) => {
        const bookClient = new BookClient(mockserver.url);
        const { books, error } = await bookClient.getBooks();

        expect(error).toBeDefined();
        expect(books).toBeEmptyObject();
      });
  });

  it("server error", () => {
    return consumer
      .addInteraction()
      .given("Error occured while fetching books in server")
      .uponReceiving("a request for all books")
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

        expect(error).toBeDefined();
        expect(books).toBeUndefined();
        expect(totalPage).toBeUndefined();
      });
  });
});

describe("GET /book/:id", () => {
  it("happy path", () => {
    const bookExample = {
      id: faker.string.uuid(),
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    return consumer
      .addInteraction()
      .given("I have a book")
      .uponReceiving("a request for a book")
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
        const { book, error } = await bookClient.getBookById(bookExample.id);

        expect(error).toBeUndefined();
        expect(book).toEqual(bookExample);
      });
  });

  it("book not found", () => {
    const bookId = faker.string.uuid();

    return consumer
      .addInteraction()
      .given("I couldn't get a book")
      .uponReceiving("a request for a book")
      .withRequest("GET", `/book/${bookId}`, (builder) =>
        builder.headers({ Accept: "application/json" }),
      )
      .willRespondWith(404)
      .executeTest(async (mockserver) => {
        const bookClient = new BookClient(mockserver.url);
        const { book, error } = await bookClient.getBookById(bookId);

        expect(error).toBeDefined();
        expect(book).toBeEmptyObject();
      });
  });

  it("server error", () => {
    const bookId = faker.string.uuid();

    return consumer
      .addInteraction()
      .given("Error occured while fetching a book in server")
      .uponReceiving("a request for a book")
      .withRequest("GET", `/book/${bookId}`, (builder) =>
        builder.headers({ Accept: "application/json" }),
      )
      .willRespondWith(500)
      .executeTest(async (mockserver) => {
        const bookClient = new BookClient(mockserver.url);
        const { book, error } = await bookClient.getBookById(bookId);

        expect(error).toBeDefined();
        expect(book).toBeEmptyObject();
      });
  });
});

describe("PUT /book/:id", () => {
  it("happy path", () => {
    const bookExample = {
      id: faker.string.uuid(),
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    consumer
      .addInteraction()
      .given("I have a book")
      .uponReceiving("a request to update a book")
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
    const bookExample = {
      id: faker.string.uuid(),
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    consumer
      .addInteraction()
      .given("I have a book")
      .uponReceiving("a request to update a book")
      .withRequest("PUT", `/book/${bookExample.id}`, (builder) => {
        builder.headers({ "Content-Type": "application/json" });
        builder.jsonBody(bookExample);
      })
      .willRespondWith(404)
      .executeTest(async (mockserver) => {
        const bookClient = new BookClient(mockserver.url);
        const error = await bookClient.updateBook(bookExample);

        expect(error).toBeDefined();
      });
  });

  it("server error", () => {
    const bookExample = {
      id: faker.string.uuid(),
      title: faker.book.title(),
      author: faker.book.author(),
      publicationYear: faker.date.anytime().getFullYear().toString(),
    };

    consumer
      .addInteraction()
      .given("Error occured while updating a book in server")
      .uponReceiving("a request to update a book")
      .withRequest("PUT", `/book/${bookExample.id}`, (builder) => {
        builder.headers({ "Content-Type": "application/json" });
        builder.jsonBody(bookExample);
      })
      .willRespondWith(500)
      .executeTest(async (mockserver) => {
        const bookClient = new BookClient(mockserver.url);
        const error = await bookClient.updateBook(bookExample);

        expect(error).toBeDefined();
      });
  });
});
})
