import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

Given("User at dashboard page", () => {
  cy.visit("/");
});

When("User click on create book button", () => {
  cy.get('[data-testid="create-book-button"]').click();
});

Then("User should be redirected to the create book page", () => {
  cy.url().should("include", "/books/create");
});

Then("User should see the create book form", () => {
  cy.get('[data-testid="create-book-form"]').should("be.visible");
});

interface BookDetails {
  title?: string;
  author?: string;
  description?: string;
  year?: string;
  isbn?: string;
  genre?: string;
  pages?: string;
  publisher?: string;
  [key: string]: string | undefined;
}

When("User fills in the following book details:", (dataTable: any) => {
  // Convert the data table to an object
  const bookDetails: BookDetails = {};

  dataTable.rawTable.slice(1).forEach((row: string[]) => {
    const [field, value] = row;

    bookDetails[field.toLowerCase()] = value;
  });

  // Fill in each field
  if (bookDetails.title) {
    cy.get('[data-testid="book-title-input"]').type(bookDetails.title);
  }
  if (bookDetails.author) {
    cy.get('[data-testid="book-author-input"]').type(bookDetails.author);
  }
  if (bookDetails.description) {
    cy.get('[data-testid="book-description-input"]').type(
      bookDetails.description,
    );
  }
  if (bookDetails.year) {
    cy.get('[data-testid="book-year-input"]').type(bookDetails.year);
  }
  if (bookDetails.isbn) {
    cy.get('[data-testid="book-isbn-input"]').type(bookDetails.isbn);
  }
  if (bookDetails.genre) {
    cy.get('[data-testid="book-genre-input"]').type(bookDetails.genre);
  }
  if (bookDetails.pages) {
    cy.get('[data-testid="book-pages-input"]').type(bookDetails.pages);
  }
  if (bookDetails.publisher) {
    cy.get('[data-testid="book-publisher-input"]').type(bookDetails.publisher);
  }
});

When("User clicks the submit button", () => {
  cy.get('[data-testid="submit-button"]').click();
});

Then("User should see a success message", () => {
  cy.get('[data-testid="success-message"]').should("be.visible");
  cy.get('[data-testid="success-message"]').should(
    "contain",
    "Book created successfully",
  );
});

Then("User should be redirected to the book details page", () => {
  cy.url().should("match", /\/books\/[\w-]+/);
});

Then("The created book should be visible in the book list", () => {
  cy.visit("/");
  cy.get('[data-testid="book-list"]').should("contain", "The Great Gatsby");
});

When("User leaves the title field empty", () => {
  cy.get('[data-testid="book-title-input"]').clear();
});

When("User leaves the author field empty", () => {
  cy.get('[data-testid="book-author-input"]').clear();
});

Then("User should see an error message for the title field", () => {
  cy.get('[data-testid="title-error"]').should("be.visible");
  cy.get('[data-testid="title-error"]').should("contain", "Title is required");
});

Then("User should see an error message for the author field", () => {
  cy.get('[data-testid="author-error"]').should("be.visible");
  cy.get('[data-testid="author-error"]').should(
    "contain",
    "Author is required",
  );
});

When("User fills in the title field with {string}", (title: string) => {
  cy.get('[data-testid="book-title-input"]').clear().type(title);
});

When("User clicks the cancel button", () => {
  cy.get('[data-testid="cancel-button"]').click();
});

Then("User should be redirected to the dashboard page", () => {
  cy.url().should("eq", `${Cypress.config().baseUrl}/`);
});

Then("No book should be created", () => {
  cy.get('[data-testid="book-list"]').should("not.contain", "Test Book");
});

Then("The book details should display all entered information", () => {
  cy.get('[data-testid="book-title"]').should("contain", "The Hobbit");
  cy.get('[data-testid="book-author"]').should("contain", "J.R.R. Tolkien");
  cy.get('[data-testid="book-description"]').should(
    "contain",
    "A fantasy novel",
  );
  cy.get('[data-testid="book-year"]').should("contain", "1937");
  cy.get('[data-testid="book-isbn"]').should("contain", "978-0-261-10295-3");
  cy.get('[data-testid="book-genre"]').should("contain", "Fantasy");
  cy.get('[data-testid="book-pages"]').should("contain", "310");
  cy.get('[data-testid="book-publisher"]').should(
    "contain",
    "George Allen & Unwin",
  );
});

// Keep existing steps
Then("the url is {word}", (url: string) => {
  cy.url().should("eq", `${Cypress.config().baseUrl}${url}`);
});

Then("I'm logged in", () => {
  cy.window().its("localStorage.email").should("eq", "abc@gmail.com");
});
