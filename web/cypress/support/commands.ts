import { faker } from "@faker-js/faker";

declare global {
  namespace Cypress {
    interface Chainable {
      generateFixture(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("generateFixture", () => {
  cy.writeFile("cypress/fixtures/books.json", {
    books: Cypress._.times(20, () => {
      const { author, title } = faker.book;

      return {
        id: faker.string.uuid(),
        title: title(),
        author: author(),
        publicationYear: faker.date.anytime().getFullYear().toString(),
      };
    }),
  });
});
