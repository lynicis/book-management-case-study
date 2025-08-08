Feature: Create a book
  As a user
  I want to create a new book
  So that I can add it to my collection

Scenario: Successfully create a book with all required fields
  Given User at dashboard page
  When User click on create book button
  Then User should be redirected to the create book page
  And User should see the create book form
  When User fills in the following book details:
    | Field       | Value                       |
    | Title       | The Great Gatsby            |
    | Author      | F. Scott Fitzgerald         |
    | Description | A novel about the Jazz Age  |
    | Year        | 1925                        |
    | ISBN        | 978-3-16-148410-0           |
  And User clicks the submit button
  Then User should see a success message
  And User should be redirected to the book details page
  And The created book should be visible in the book list

Scenario: Cannot create a book with missing required fields
  Given User at dashboard page
  When User click on create book button
  Then User should be redirected to the create book page
  When User leaves the title field empty
  And User clicks the submit button
  Then User should see an error message for the title field
  When User fills in the title field with "The Great Gatsby"
  And User leaves the author field empty
  And User clicks the submit button
  Then User should see an error message for the author field

Scenario: Cancel book creation
  Given User at dashboard page
  When User click on create book button
  Then User should be redirected to the create book page
  When User fills in the title field with "Test Book"
  And User clicks the cancel button
  Then User should be redirected to the dashboard page
  And No book should be created

Scenario: Create a book with optional fields
  Given User at dashboard page
  When User click on create book button
  Then User should be redirected to the create book page
  When User fills in the following book details:
    | Field       | Value                       |
    | Title       | The Hobbit                  |
    | Author      | J.R.R. Tolkien             |
    | Description | A fantasy novel             |
    | Year        | 1937                        |
    | ISBN        | 978-0-261-10295-3           |
    | Genre       | Fantasy                     |
    | Pages       | 310                         |
    | Publisher   | George Allen & Unwin        |
  And User clicks the submit button
  Then User should see a success message
  And User should be redirected to the book details page
  And The book details should display all entered information
