import { mount } from "cypress/react";
import { faker } from "@faker-js/faker";
import React from "react";

import { BookContext } from "@/components/book-context";
import BookFormModal from "@/components/book-form-modal";
import BookTable from "@/components/book-table";
import { BookDTO } from "@/dto/book.dto";

describe("Table.cy.tsx", () => {
  let pages = 0;
  let books = new Array<BookDTO>();

  beforeEach(() => {
    pages = faker.seed(3);
    const bookSeed = faker.seed(30) / pages;

    for (let i = 0; i < bookSeed; i++) {
      const { author, title } = faker.book;

      books.push({
        id: faker.string.uuid(),
        title: title(),
        author: author(),
        publicationYear: faker.date.past().getFullYear().toString(),
      });
    }
  });

  afterEach(() => {
    books = [];
  });

  it("should render the table component correctly", () => {
    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: pages },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: () => Promise.resolve(),
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: () => Promise.resolve(),
          onPreviousPage: () => Promise.resolve(),
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");
    cy.get("thead").should("exist");
    cy.get("tbody").should("exist");
    cy.get("table")
      .find("thead")
      .find("tr")
      .find("th")
      .should("have.length.at.least", 5);

    const firstBook = books[0];

    if (firstBook) {
      cy.contains(firstBook.id!).should("exist");
      cy.contains(firstBook.title!).should("exist");
    }

    cy.get("button").contains("Previous").should("exist");
    cy.get("button").contains("Next").should("exist");
  });

  it("should toggle item selection when checkbox is clicked", () => {
    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: pages },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: () => Promise.resolve(),
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: () => Promise.resolve(),
          onPreviousPage: () => Promise.resolve(),
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");

    const firstRowCheckbox = () =>
      cy.get("tbody tr").first().find('input[type="checkbox"]');

    firstRowCheckbox().should("exist");

    cy.get('[class*="text-small"]').contains("0 of").should("exist");

    firstRowCheckbox().click();

    cy.get('[class*="text-small"]').contains("1 of").should("exist");

    firstRowCheckbox().click();

    cy.get('[class*="text-small"]').contains("0 of").should("exist");
  });

  it("should toggle all items selection when header checkbox is clicked", () => {
    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: pages },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: () => Promise.resolve(),
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: () => Promise.resolve(),
          onPreviousPage: () => Promise.resolve(),
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");

    const headerCheckbox = () => cy.get("thead").find('input[type="checkbox"]');

    headerCheckbox().should("exist");
    cy.get('[class*="text-small"]').contains("0 of").should("exist");

    headerCheckbox().click();

    cy.get('[class*="text-small"]')
      .contains("All items selected")
      .should("exist");

    headerCheckbox().click();

    cy.get('[class*="text-small"]').contains("0 of").should("exist");
  });

  it("should table updated when rows per page changed", () => {
    const onRowsPerPageChangeSpy = cy.spy().as("onRowsPerPageChange");

    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: pages },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: () => Promise.resolve(),
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: () => Promise.resolve(),
          onPreviousPage: () => Promise.resolve(),
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: onRowsPerPageChangeSpy,
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");

    cy.get("label").contains("Rows per page:").should("exist");

    cy.get("select").should("exist").and("have.value", "5");

    cy.get("tbody tr").should("have.length.at.most", 5);

    cy.get("select").select("10");

    cy.get("@onRowsPerPageChange").should("have.been.calledOnce");
    cy.get("@onRowsPerPageChange").should(
      "have.been.calledWithMatch",
      Cypress.sinon.match((e: React.ChangeEvent<HTMLSelectElement>) => {
        return e.target.value === "10";
      }),
    );

    cy.get("select").select("15");

    cy.get("@onRowsPerPageChange").should("have.been.calledTwice");
    cy.get("@onRowsPerPageChange").should(
      "have.been.calledWithMatch",
      Cypress.sinon.match((e: React.ChangeEvent<HTMLSelectElement>) => {
        return e.target.value === "15";
      }),
    );
  });

  it("should display and interact with actions dropdown menu", () => {
    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: pages },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: () => Promise.resolve(),
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: () => Promise.resolve(),
          onPreviousPage: () => Promise.resolve(),
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");
    cy.get("tbody tr").should("have.length.at.least", 1);

    // Find actions button in the first row
    const firstRowActionsButton = cy
      .get("tbody tr")
      .first()
      .find("td")
      .last()
      .find("button");

    firstRowActionsButton.should("exist");

    // Menu should not exist initially
    cy.get("[role='menu']").should("not.exist");

    // Click to open menu
    firstRowActionsButton.click();

    // Menu should be visible with all options
    cy.get("[role='menu']").should("be.visible");
    cy.get("[role='menuitem']").should("have.length", 3);
    cy.get("[role='menuitem']").contains("View").should("exist");
    cy.get("[role='menuitem']").contains("Edit").should("exist");
    cy.get("[role='menuitem']").contains("Delete").should("exist");

    // Click outside to close menu
    cy.get("body").click(0, 0);
    cy.get("[role='menu']").should("not.exist");

    // Open menu again and click an option
    firstRowActionsButton.click();
    cy.get("[role='menuitem']").contains("View").click();

    // Menu should close after clicking an option
    cy.get("[role='menu']").should("not.exist");
  });

  it("should handle pagination controls based on total pages", () => {
    const onPaginationChangeSpy = cy.spy().as("onPaginationChange");
    const onNextPageSpy = cy.spy().as("onNextPage");
    const onPreviousPageSpy = cy.spy().as("onPreviousPage");

    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: 3 },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: onPaginationChangeSpy,
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: onNextPageSpy,
          onPreviousPage: onPreviousPageSpy,
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");

    cy.get("button")
      .contains("Previous")
      .should("exist")
      .and("not.be.disabled");
    cy.get("button").contains("Next").should("exist").and("not.be.disabled");

    cy.get('[aria-label="Pagination"]').should("exist");
    cy.get('[aria-label="pagination item 1 active"]').should("exist");
    cy.get('[aria-label="pagination item 2"]').should("exist");
    cy.get('[aria-label="pagination item 3"]').should("exist");

    cy.get("button").contains("Next").click();
    cy.get("@onNextPage").should("have.been.calledOnce");

    cy.get("button").contains("Previous").click();
    cy.get("@onPreviousPage").should("have.been.calledOnce");

    cy.get('[aria-label="Pagination"]').contains("2").click();
    cy.get("@onPaginationChange").should("have.been.calledWith", 2);

    mount(
      <BookContext.Provider
        value={{
          books: { books: books.slice(0, 3), currentPage: 1, totalPage: 1 },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: onPaginationChangeSpy,
          onCreateBookModalOpen: () => {},
          onClear: () => Promise.resolve(),
          onNextPage: onNextPageSpy,
          onPreviousPage: onPreviousPageSpy,
          onSearchChange: () => Promise.resolve(),
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("button").contains("Previous").should("exist").and("be.disabled");
    cy.get("button").contains("Next").should("exist").and("be.disabled");

    cy.get('[aria-label="Pagination"]').should("exist");
  });

  it("should search books when search input searched", () => {
    const onSearchChangeSpy = cy.spy().as("onSearchChange");
    const onClearSpy = cy.spy().as("onClear");

    mount(
      <BookContext.Provider
        value={{
          books: { books, currentPage: 1, totalPage: pages },
          isFetchingBooks: false,
          filterValue: "",
          rowsPerPage: 5,
          isCreateBookModalOpen: false,
          isCreatingBook: false,
          fetchBooks: () => Promise.resolve(),
          setRowsPerPage: () => {},
          onCreateBookFormSubmit: () => Promise.resolve(),
          onCreateBookModalChange: () => {},
          onPaginationChange: () => Promise.resolve(),
          onCreateBookModalOpen: () => {},
          onClear: onClearSpy,
          onNextPage: () => Promise.resolve(),
          onPreviousPage: () => Promise.resolve(),
          onSearchChange: onSearchChangeSpy,
          onRowsPerPageChange: () => Promise.resolve(),
        }}
      >
        <BookTable />
      </BookContext.Provider>,
    );

    cy.get("table").should("exist");

    const searchInput = cy.get('input[placeholder="Search by title..."]');

    searchInput.should("exist");

    const searchTerm = "test";

    searchInput.type(searchTerm);

    cy.get("@onSearchChange").should("have.been.called");
    cy.get("@onSearchChange").should("have.callCount", searchTerm.length);

    cy.get('input[placeholder="Search by title..."]')
      .parent()
      .parent()
      .find("button")
      .filter(":visible")
      .click();

    cy.get("@onClear").should("have.been.calledOnce");

    const newSearchTerm = "book";

    searchInput.type(newSearchTerm);

    cy.get("@onSearchChange").should(
      "have.callCount",
      searchTerm.length + newSearchTerm.length,
    );
  });

  it("should shown create a book modal form when add new button clicked", () => {
    const TestComponent = () => {
      const [modalOpen, setModalOpen] = React.useState(false);

      return (
        <BookContext.Provider
          value={{
            books: { books, currentPage: 1, totalPage: pages },
            isFetchingBooks: false,
            filterValue: "",
            rowsPerPage: 5,
            isCreateBookModalOpen: modalOpen,
            isCreatingBook: false,
            fetchBooks: () => Promise.resolve(),
            setRowsPerPage: () => {},
            onCreateBookFormSubmit: () => Promise.resolve(),
            onCreateBookModalChange: setModalOpen,
            onPaginationChange: () => Promise.resolve(),
            onCreateBookModalOpen: () => setModalOpen(true),
            onClear: () => Promise.resolve(),
            onNextPage: () => Promise.resolve(),
            onPreviousPage: () => Promise.resolve(),
            onSearchChange: () => Promise.resolve(),
            onRowsPerPageChange: () => Promise.resolve(),
          }}
        >
          <BookTable />
          <BookFormModal />
        </BookContext.Provider>
      );
    };

    mount(<TestComponent />);

    cy.get("table").should("exist");

    cy.get('[role="dialog"]').should("not.exist");

    cy.get("button").contains("Add New").should("exist").click();

    cy.get('[role="dialog"]').should("be.visible");

    cy.get('[role="dialog"]').within(() => {
      cy.contains("Create New Book").should("exist");

      cy.get('input[name="title"]').should("exist");
      cy.get('input[name="author"]').should("exist");
      cy.get('input[name="publicationYear"]').should("exist");

      cy.get("button").contains("Cancel").should("exist");
      cy.get("button").contains("Create").should("exist");

      cy.get("button").contains("Cancel").click();
    });

    cy.get('[role="dialog"]').should("not.exist");

    cy.get("button").contains("Add New").click();
    cy.get('[role="dialog"]').should("be.visible");

    cy.get('[role="dialog"]').within(() => {
      cy.get('button[aria-label="Close"]').should("exist").click();
    });

    cy.wait(500); // Wait for modal animation
    cy.get('[role="dialog"]').should("not.exist");
  });
});
