package book

import "time"

type CreateBookRequest struct {
	CoverUrl        string `json:"coverUrl" validate:"required,url"`
	ISBN            string `json:"isbn" validate:"required,isbn"`
	Title           string `json:"title" validate:"required,min=1"`
	Author          string `json:"author" validate:"required,min=1"`
	PublicationYear string `json:"publicationYear" validate:"required,number,min=3,max=4"`
}

type UpdateBookRequest struct {
	CreateBookRequest
	Id string `json:"id" validate:"required,uuid4"`
}

type GetBooksRequest struct {
	Page     int    `query:"page,omitempty"`
	PageSize int    `query:"pageSize,omitempty"`
	Search   string `query:"search,omitempty"`
}

type GetBooksResponse struct {
	Books     []BookDTO
	TotalPage int
}

type BookDTO struct {
	Id              string     `json:"id" db:"id"`
	CoverUrl        string     `json:"coverUrl" db:"cover_url"`
	ISBN            string     `json:"isbn" db:"isbn"`
	Title           string     `json:"title" db:"title"`
	Author          string     `json:"author" db:"author"`
	PublicationYear string     `json:"publicationYear" db:"publication_year"`
	CreatedAt       *time.Time `json:"createdAt" db:"created_at"`
	DeletedAt       *time.Time `json:"deletedAt,omitempty" db:"deleted_at"`
	UpdatedAt       *time.Time `json:"updatedAt,omitempty" db:"updated_at"`
}
