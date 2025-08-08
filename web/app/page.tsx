"use client";

import { useCallback, useEffect, useOptimistic, useState } from "react";
import { useDisclosure } from "@heroui/modal";
import { addToast } from "@heroui/toast";
import ms from "ms";

import { BookContext } from "../components/book-context";

import BookFormModal from "@/components/book-form-modal";
import { useInterval } from "@/hooks/useInterval";
import BookTable from "@/components/book-table";
import BookClient from "@/clients/book.client";
import { BookDTO } from "@/dto/book.dto";

export type BookState = {
  books: BookDTO[];
  totalPage: number;
  currentPage: number;
};

export type BookStateAction =
  | {
      type: "SET_BOOKS";
      payload: {
        books: BookDTO[];
        totalPage: number;
        currentPage: number;
        pageSize: number;
      };
    }
  | {
      type: "ADD_BOOK";
      payload: {
        book: BookDTO;
        pageSize: number;
      };
    }
  | {
      type: "REVERT";
      id: string;
    };

export default function Dashboard() {
  const bookClient = BookClient.createFromEnv();
  const [books, setBooks] = useOptimistic<BookState, BookStateAction>(
    {
      books: [],
      totalPage: 0,
      currentPage: 0,
    },
    (state: BookState, action: BookStateAction): BookState => {
      switch (action.type) {
        case "SET_BOOKS":
          return {
            books: action.payload.books,
            totalPage: action.payload.totalPage,
            currentPage: action.payload.currentPage,
          };
        case "ADD_BOOK":
          return {
            books: [...state.books, action.payload.book],
            totalPage: Math.ceil(
              (state.books.length + 1) / action.payload.pageSize,
            ),
            currentPage: state.currentPage,
          };
        case "REVERT":
          return {
            books: state.books.filter((book) => book.id !== action.id),
            totalPage: state.totalPage,
            currentPage: state.currentPage,
          };
        default:
          return state;
      }
    },
  );
  const [errorCause, setErrorCause] = useState<
    "fetchingBooks" | "creatingBook" | undefined
  >();
  const [isFetchingBooks, setFetchingBooks] = useState<boolean>(true);
  const [isCreatingBook, setCreatingBook] = useState<boolean>(false);
  const [filterValue, setFilterValue] = useState<string | undefined>();
  const [pageSize, setPageSize] = useState<number>(5);
  const {
    isOpen: isCreateBookModalOpen,
    onOpenChange: onCreateBookModalChange,
    onOpen: onCreateBookModalOpen,
  } = useDisclosure();

  const fetchBooks = useCallback(
    async (params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      isPolling?: boolean;
    }) => {
      if (!params?.isPolling) {
        setFetchingBooks(true);
      }

      const currentPage = params?.page || books?.currentPage || 1;
      const searchValue =
        params?.search !== undefined ? params.search : filterValue;
      const rowsPerPage = params?.pageSize || pageSize || 5;

      const {
        books: { books: fetchedBooks, totalPage },
        error,
      } = await bookClient.getBooks({
        page: currentPage,
        pageSize: rowsPerPage,
        search: searchValue,
      });

      if (error) {
        if (!params?.isPolling) {
          setErrorCause("fetchingBooks");
        }

        return setFetchingBooks(false);
      }

      setBooks({
        type: "SET_BOOKS",
        payload: {
          books: fetchedBooks,
          totalPage,
          currentPage,
          pageSize: rowsPerPage,
        },
      });

      return setFetchingBooks(false);
    },
    [bookClient, books, filterValue, pageSize],
  );

  const onPaginationChange = useCallback(
    async (page: number) =>
      await fetchBooks({ page, pageSize, search: filterValue }),
    [books, filterValue, pageSize, fetchBooks],
  );

  const onNextPage = useCallback(async () => {
    if (books && books.currentPage < books.totalPage) {
      const nextPage = books.currentPage + 1;

      await fetchBooks({ page: nextPage, pageSize, search: filterValue });
    }
  }, [books, filterValue, pageSize, fetchBooks]);

  const onPreviousPage = useCallback(async () => {
    if (books && books.currentPage > 1) {
      const prevPage = books.currentPage - 1;

      await fetchBooks({ page: prevPage, pageSize, search: filterValue });
    }
  }, [books, filterValue, pageSize, fetchBooks]);

  const onRowsPerPageChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = Number(e.target.value);

      setPageSize(newPageSize);
      await fetchBooks({
        page: books?.currentPage || 1,
        pageSize: newPageSize,
        search: filterValue,
      });
    },
    [filterValue, books, fetchBooks],
  );

  const onSearchChange = useCallback(
    async (value: string) => {
      const page = books?.currentPage || 1;

      if (value) {
        await fetchBooks({
          page,
          pageSize,
          search: value,
        });
      } else {
        await fetchBooks({
          page,
          pageSize,
        });
      }
    },
    [books, pageSize, fetchBooks],
  );

  const onClear = useCallback(async () => {
    setFilterValue(undefined);
    await fetchBooks({
      page: books?.currentPage || 1,
      pageSize,
    });
  }, [books, pageSize, fetchBooks]);

  const onCreateBookFormSubmit = useCallback(
    async (book: BookDTO): Promise<void> => {
      setCreatingBook(true);
      setBooks({
        type: "ADD_BOOK",
        payload: {
          book: {
            id: self.crypto.randomUUID(),
            title: book.title,
            author: book.author,
            publicationYear: book.publicationYear,
          },
          pageSize,
        },
      });

      const error = await bookClient.createBook(book);

      if (error) {
        setBooks({
          type: "REVERT",
          id: book.id || "",
        });
        setCreatingBook(false);

        return setErrorCause("creatingBook");
      }

      await fetchBooks();

      return setCreatingBook(false);
    },
    [bookClient, fetchBooks],
  );

  useEffect(() => {
    fetchBooks();
  }, []);

  useInterval(() => {
    if (!isFetchingBooks && !isCreatingBook && !errorCause) {
      fetchBooks();
    }
  }, ms("30s"));

  useEffect(() => {
    if (errorCause) {
      addToast({
        title: "Error",
        description:
          errorCause === "fetchingBooks"
            ? "Error occurred while fetching books"
            : "Error occurred while creating book",
        severity: "danger",
      });
    }
  }, [errorCause]);

  return (
    <BookContext.Provider
      value={{
        books,
        isFetchingBooks,
        isCreatingBook,
        filterValue,
        rowsPerPage: pageSize,
        onCreateBookFormSubmit,
        fetchBooks,
        setRowsPerPage: setPageSize,
        onClear,
        onNextPage,
        onPreviousPage,
        onSearchChange,
        onPaginationChange,
        onRowsPerPageChange,
        isCreateBookModalOpen,
        onCreateBookModalChange,
        onCreateBookModalOpen,
      }}
    >
      <BookTable />
      <BookFormModal />
    </BookContext.Provider>
  );
}
