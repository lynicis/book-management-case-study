"use client";

import {
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalBody,
  Modal,
} from "@heroui/modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Form } from "@heroui/form";
import { useContext } from "react";
import validator from "validator";
import { z } from "zod";

import { BookContext } from "./book-context";

const formValidationSchema = z.object({
  coverUrl: z.url("Invalid cover image URL"),
  isbn: z.string().refine(validator.isISBN, "Invalid ISBN"),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publicationYear: z
    .string()
    .min(1, "Publication year is required")
    .max(4, "Publication year must be a 4-digit number"),
});

export default function BookFormModal() {
  const {
    isCreatingBook,
    isCreateBookModalOpen,
    onCreateBookModalChange,
    onCreateBookFormSubmit,
  } = useContext(BookContext);
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(formValidationSchema),
  });

  return (
    <Modal
      isOpen={isCreateBookModalOpen}
      placement="top-center"
      onOpenChange={onCreateBookModalChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Create New Book
            </ModalHeader>
            <Form onSubmit={handleSubmit(onCreateBookFormSubmit)}>
              <ModalBody>
                <Controller
                  control={control}
                  name="coverUrl"
                  render={({
                    field: { name, value, onChange, onBlur, ref },
                    fieldState: { invalid, error },
                  }) => (
                    <Input
                      ref={ref}
                      isRequired
                      errorMessage={error?.message}
                      isInvalid={invalid}
                      label="Cover URL"
                      name={name}
                      placeholder="Enter cover image URL"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="title"
                  render={({
                    field: { name, value, onChange, onBlur, ref },
                    fieldState: { invalid, error },
                  }) => (
                    <Input
                      ref={ref}
                      isRequired
                      errorMessage={error?.message}
                      isInvalid={invalid}
                      label="Title"
                      name={name}
                      placeholder="Enter book title"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="author"
                  render={({
                    field: { name, value, onChange, onBlur, ref },
                    fieldState: { invalid, error },
                  }) => (
                    <Input
                      ref={ref}
                      isRequired
                      errorMessage={error?.message}
                      isInvalid={invalid}
                      label="Author"
                      name={name}
                      placeholder="Enter author name"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="publicationYear"
                  render={({
                    field: { name, value, onChange, onBlur, ref },
                    fieldState: { invalid, error },
                  }) => (
                    <Input
                      ref={ref}
                      isRequired
                      errorMessage={error?.message}
                      isInvalid={invalid}
                      label="Publication Year"
                      name={name}
                      placeholder="Enter publication year"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="isbn"
                  render={({
                    field: { name, value, onChange, onBlur, ref },
                    fieldState: { invalid, error },
                  }) => (
                    <Input
                      ref={ref}
                      isRequired
                      errorMessage={error?.message}
                      isInvalid={invalid}
                      label="ISBN"
                      name={name}
                      placeholder="Enter ISBN"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                    />
                  )}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  isLoading={isCreatingBook}
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isDisabled={isCreatingBook}
                  type="submit"
                >
                  Create
                </Button>
              </ModalFooter>
            </Form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
