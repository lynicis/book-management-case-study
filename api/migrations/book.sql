CREATE TABLE books (
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    cover_url varchar NOT NULL,
    isbn varchar NOT NULL,
    title varchar NOT NULL,
    author varchar NOT NULL,
    publication_year varchar NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);
