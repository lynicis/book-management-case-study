"use client";

import { createContext } from "react";

import { CreateBookFormSubmit } from "./book-form-modal";

import { BookState } from "@/app/page";

export type BookContextState = {
  books: BookState;
  isFetchingBooks: boolean;
  isCreatingBook: boolean;
  rowsPerPage: number;
  filterValue?: string;
  isCreateBookModalOpen: boolean;
};

export interface BookContextAction {
  setRowsPerPage(value: number): void;
  onCreateBookModalChange: (isOpen: boolean) => void;
  onCreateBookModalOpen(): void;
  onCreateBookFormSubmit(data: CreateBookFormSubmit): Promise<void>;
  onClear(): Promise<void>;
  onNextPage(): Promise<void>;
  onPreviousPage(): Promise<void>;
  onSearchChange(value: string): Promise<void>;
  onPaginationChange(page: number): Promise<void>;
  onRowsPerPageChange(e: React.ChangeEvent<HTMLSelectElement>): Promise<void>;
}

export type BookContextType = BookContextState & BookContextAction;

export const BookContext = createContext<BookContextType>({
  books: { books: [], currentPage: 0, totalPage: 0 },
  isFetchingBooks: true,
  isCreatingBook: false,
  rowsPerPage: 5,
  isCreateBookModalOpen: false,
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
