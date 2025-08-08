Feature: Get books
  As a user
  I want to get books
  So that I can see all books

Scenario: Successfully view all books
  Given User at dashboard page
  When User navigates to the books page
  Then User should see a list of all available books
  And Each book should display the following information:
    | Title             | The title of the book        |
    | Author            | The author of the book       |
    | Publication Year  | The publication year         |

Scenario: Filter books by author
  Given User at books page
  When User selects filter by author option
  And User enters "J.K. Rowling" in the author filter field
  Then User should see only books by "J.K. Rowling"
  And The following book information should be displayed:
    | Title                                    | Author            | Publication Year |
    | Harry Potter and the Philosopher's Stone | J.K. Rowling      | 1997             |
    | Harry Potter and the Chamber of Secrets  | J.K. Rowling      | 1998             |

Scenario: Filter books by publication year
  Given User at books page
  When User selects filter by year option
  And User enters "2020" in the year filter field
  Then User should see only books published in "2020"
  And The number of displayed books should match the count of books published in 2020

Scenario: Search for a specific book by title
  Given User at books page
  When User enters "The Great Gatsby" in the search field
  And User clicks the search button
  Then User should see books with titles containing "The Great Gatsby"
  And The following book information should be displayed:
    | Title           | Author               | Publication Year |
    | The Great Gatsby | F. Scott Fitzgerald | 1925             |

Scenario: View book details
  Given User at books page
  When User clicks on a book titled "The Hobbit"
  Then User should be redirected to the book details page
  And User should see the following detailed information:
    | Title                  | The Hobbit                 |
    | Author                 | J.R.R. Tolkien             |
    | Publication Year       | 1937                       |

Scenario: No books found with search criteria
  Given User at books page
  When User enters "Nonexistent Book Title" in the search field
  And User clicks the search button
  Then User should see a message indicating no books were found
  And User should be presented with an option to clear the search

Scenario: Sort books by title
  Given User at books page
  When User clicks on the "Title" column header
  Then User should see the books sorted alphabetically by title
  When User clicks on the "Title" column header again
  Then User should see the books sorted in reverse alphabetical order by title

Scenario: Sort books by publication year
  Given User at books page
  When User clicks on the "Year" column header
  Then User should see the books sorted by publication year in ascending order
  When User clicks on the "Year" column header again
  Then User should see the books sorted by publication year in descending order

Scenario: Pagination of book list
  Given User at books page
  And There are more than 10 books in the system
  Then User should see the first 10 books
  And User should see pagination controls
  When User clicks on the next page button
  Then User should see the next set of books