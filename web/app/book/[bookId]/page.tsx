import { Card, CardBody, CardHeader } from "@heroui/card";
import { notFound } from "next/navigation";
import { Divider } from "@heroui/divider";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import NextImage from "next/image";

import BookClient from "@/clients/book.client";

type PageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function BookDetail({ params }: PageProps) {
  const { bookId } = await params;
  const bookClient = BookClient.createFromEnv();
  const { book, error } = await bookClient.getBookById(bookId);

  if (error || !book.id) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-col gap-3 p-6">
          <div className="flex gap-6 items-start w-full">
            <Image
              alt={`${book.title} cover`}
              as={NextImage}
              className="object-cover rounded-lg shadow-md"
              height={180}
              src={book.coverUrl}
              width={120}
            />
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <h1 className="text-4xl font-bold text-foreground">
                  {book.title}
                </h1>
                <Chip color="primary" size="sm" variant="flat">
                  Book Details
                </Chip>
              </div>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="p-6">
          <div className="grid gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-default-500 uppercase tracking-wider">
                Author
              </p>
              <p className="text-xl text-foreground font-medium">
                {book.author}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-default-500 uppercase tracking-wider">
                Publication Year
              </p>
              <p className="text-xl text-foreground font-medium">
                {book.publicationYear}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-default-500 uppercase tracking-wider">
                ISBN
              </p>
              <p className="text-xl text-foreground font-medium">{book.isbn}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
