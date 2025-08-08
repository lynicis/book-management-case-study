"use client";

import { createContext } from "react";

import { BookDTO } from "@/dto/book.dto";
import { BookState } from "@/app/page";

export interface BookContextType {
  books: BookState;
  isFetchingBooks: boolean;
  isCreatingBook: boolean;
  rowsPerPage: number;
  filterValue?: string;
  fetchBooks(params?: {
    page?: number;
    rowsPerPage?: number;
    filter?: string;
  }): Promise<void>;
  setRowsPerPage(value: number): void;
  isCreateBookModalOpen: boolean;
  onCreateBookModalChange: (isOpen: boolean) => void;
  onCreateBookModalOpen(): void;
  onCreateBookFormSubmit(data: BookDTO): Promise<void>;
  onClear(): Promise<void>;
  onNextPage(): Promise<void>;
  onPreviousPage(): Promise<void>;
  onSearchChange(value: string): Promise<void>;
  onPaginationChange(page: number): Promise<void>;
  onRowsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>): Promise<void>;
}

export const BookContext = createContext<BookContextType>({
  books: { books: [], currentPage: 0, totalPage: 0 },
  isFetchingBooks: true,
  isCreatingBook: false,
  rowsPerPage: 5,
  isCreateBookModalOpen: false,
  fetchBooks: () => Promise.resolve(),
  setRowsPerPage: () => {},
  onCreateBookModalOpen: () => {},
  onCreateBookFormSubmit: () => Promise.resolve(),
  onCreateBookModalChange: () => {},
  onClear: () => Promise.resolve(),
  onNextPage: () => Promise.resolve(),
  onPreviousPage: () => Promise.resolve(),
  onSearchChange: () => Promise.resolve(),
  onPaginationChange: () => Promise.resolve(),
  onRowsPerPageChange: () => Promise.resolve(),
});
