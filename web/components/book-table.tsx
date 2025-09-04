"use client";

import { useCallback, useContext, useMemo, useState } from "react";
import {
  SortDescriptor,
  TableHeader,
  TableColumn,
  TableBody,
  Selection,
  TableCell,
  TableRow,
  Table,
} from "@heroui/table";
import {
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Dropdown,
} from "@heroui/dropdown";
import { Pagination } from "@heroui/pagination";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { BookContext } from "./book-context";

import { BookDTO } from "@/dto/book.dto";
import { IconSvgProps } from "@/types";

type Column = {
  name: string;
  key: string;
  sortable: boolean;
};

export const columns = Array.from<Column>([
  { name: "ID", key: "id", sortable: true },
  { name: "TITLE", key: "title", sortable: true },
  { name: "AUTHOR", key: "author", sortable: true },
  { name: "PUBLICATION OF YEAR", key: "publicationYear", sortable: true },
  { name: "ACTIONS", key: "actions", sortable: false },
]);

export function capitalize(value: string): string {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : "";
}

export const PlusIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size || height}
      role="presentation"
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      >
        <path d="M6 12h12" />
        <path d="M12 18V6" />
      </g>
    </svg>
  );
};

export const VerticalDotsIcon = ({
  size = 24,
  width,
  height,
  ...props
}: IconSvgProps) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size || height}
      role="presentation"
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path
        d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
        fill="currentColor"
      />
    </svg>
  );
};

export const SearchIcon = (props: IconSvgProps) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 22L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

export const ChevronDownIcon = ({
  strokeWidth = 1.5,
  ...otherProps
}: IconSvgProps) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...otherProps}
    >
      <path
        d="m19.92 8.95-6.52 6.52c-.77.77-2.03.77-2.8 0L4.08 8.95"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};

export default function BookTable() {
  const {
    books,
    isFetchingBooks,
    filterValue,
    rowsPerPage,
    onClear,
    onNextPage,
    onPreviousPage,
    onSearchChange,
    onPaginationChange,
    onRowsPerPageChange,
    onCreateBookModalOpen,
  } = useContext(BookContext);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "author",
    direction: "ascending",
  });

  /** TODO: Possible refactoring
      get filtering and searching from backend
  */
  const filteredItems = useMemo(() => {
    let filteredBooks = books?.books ? [...books?.books] : [];

    if (filteredBooks && Boolean(filterValue)) {
      filteredBooks = filteredBooks.filter((book) =>
        book.title.toLowerCase().includes(filterValue?.toLowerCase() || ""),
      );
    }

    return filteredBooks;
  }, [books, filterValue]);

  const items = useMemo(() => {
    return filteredItems || [];
  }, [filteredItems]);

  const sortedItems = useMemo(() => {
    if (items) {
      return [...items].sort((prev: any, next: any) => {
        const first = prev[sortDescriptor.column as keyof BookDTO];
        const second = next[sortDescriptor.column as keyof BookDTO];

        const cmp = first < second ? -1 : first > second ? 1 : 0;

        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      });
    }
  }, [sortDescriptor, items]);

  const renderCell = useCallback((book: BookDTO, columnKey: React.Key) => {
    const cellValue = book[columnKey as keyof BookDTO];

    switch (columnKey) {
      case "title":
        return book.title;
      case "author":
        return book.author;
      case "publicationYear":
        return book.publicationYear;
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-300" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="view">View</DropdownItem>
                <DropdownItem key="edit">Edit</DropdownItem>
                <DropdownItem key="delete">Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue ?? "N/A";
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Search by title..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex">
            <Button
              color="primary"
              endContent={<PlusIcon height={20} size={20} width={20} />}
              onPress={onCreateBookModalOpen}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {books?.books?.length || 0} books
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-solid outline-transparent text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    onRowsPerPageChange,
    books?.books?.length,
    onSearchChange,
    onCreateBookModalOpen,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems?.length || 0} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          aria-label="Pagination"
          color="primary"
          isDisabled={isFetchingBooks}
          page={books?.currentPage || 1}
          total={books?.totalPage || 1}
          onChange={onPaginationChange}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={books?.totalPage === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={books?.totalPage === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [
    isFetchingBooks,
    books?.currentPage,
    selectedKeys,
    filteredItems?.length,
    books?.totalPage,
    onPreviousPage,
    onNextPage,
    onPaginationChange,
    rowsPerPage,
    filterValue,
  ]);

  return (
    <Table
      isHeaderSticky
      aria-label="Books table"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[382px]",
      }}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={setSelectedKeys}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.key}
            align={column.key === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody
        emptyContent="No books to display"
        isLoading={isFetchingBooks}
        items={sortedItems}
      >
        {(book) => (
          <TableRow key={book.id}>
            {(columnKey) => (
              <TableCell>{renderCell(book, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
