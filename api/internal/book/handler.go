package book

import (
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	server     *fiber.App
	validator  *validator.Validate
	repository Repository
}

func NewHandler(
	server *fiber.App,
	validator *validator.Validate,
	repository Repository,
) *Handler {
	return &Handler{
		server:     server,
		validator:  validator,
		repository: repository,
	}
}

func (h *Handler) RegisterHandlers() {
	h.server.Post("/book", h.CreateBook)
	h.server.Get("/books", h.GetBooks)
	h.server.Get("/book/:id", h.GetBookById)
	h.server.Put("/book/:id", h.UpdateBookById)
	h.server.Delete("/book/:id", h.DeleteBookById)
}

func (h *Handler) CreateBook(ctx *fiber.Ctx) error {
	var reqBody CreateBookRequest
	if err := ctx.BodyParser(&reqBody); err != nil {
		return err
	}

	if err := h.validator.StructCtx(ctx.Context(), &reqBody); err != nil {
		return fiber.ErrBadRequest
	}

	now := time.Now().UTC()
	if err := h.repository.CreateBook(ctx.Context(), &BookDTO{
		Id:              uuid.NewString(),
		CoverUrl:        reqBody.CoverUrl,
		ISBN:            reqBody.ISBN,
		Title:           reqBody.Title,
		Author:          reqBody.Author,
		PublicationYear: reqBody.PublicationYear,
		CreatedAt:       &now,
	}); err != nil {
		return err
	}

	return ctx.SendStatus(fiber.StatusCreated)
}

func (h *Handler) GetBooks(ctx *fiber.Ctx) error {
	var queries GetBooksRequest
	if err := ctx.QueryParser(&queries); err != nil {
		return err
	}

	if err := h.validator.StructCtx(ctx.Context(), &queries); err != nil {
		return fiber.ErrBadRequest
	}

	if queries.Page == 0 {
		queries.Page = 1
	}

	if queries.PageSize == 0 {
		queries.PageSize = 5
	}

	books, total, err := h.repository.GetBooks(
		ctx.Context(),
		queries.Page,
		queries.PageSize,
		queries.Search,
	)
	if err != nil {
		return err
	}

	return ctx.JSON(fiber.Map{
		"books":     books,
		"totalPage": total / queries.PageSize,
	})
}

func (h *Handler) GetBookById(ctx *fiber.Ctx) error {
	bookId := ctx.Params("id")
	if err := h.validator.VarCtx(ctx.Context(), bookId, "required,uuid4"); err != nil {
		return fiber.ErrBadRequest
	}

	book, err := h.repository.GetBookById(ctx.Context(), bookId)
	if err != nil {
		return err
	}

	return ctx.JSON(fiber.Map{
		"book": book,
	})
}

func (h *Handler) UpdateBookById(ctx *fiber.Ctx) error {
	var reqBody CreateBookRequest
	if err := ctx.BodyParser(&reqBody); err != nil {
		return err
	}

	bookId := ctx.Params("id")
	if err := h.validator.StructCtx(ctx.Context(), &UpdateBookRequest{
		CreateBookRequest: reqBody,
		Id:                bookId,
	}); err != nil {
		return fiber.ErrBadRequest
	}

	now := time.Now().UTC()
	if err := h.repository.UpdateBookById(ctx.Context(), bookId, &BookDTO{
		Id:              bookId,
		CoverUrl:        reqBody.CoverUrl,
		ISBN:            reqBody.ISBN,
		Title:           reqBody.Title,
		Author:          reqBody.Author,
		PublicationYear: reqBody.PublicationYear,
		UpdatedAt:       &now,
	}); err != nil {
		return err
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handler) DeleteBookById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := h.validator.VarCtx(ctx.Context(), id, "required,uuid4"); err != nil {
		return fiber.ErrBadRequest
	}

	if err := h.repository.DeleteBookById(ctx.Context(), id); err != nil {
		return err
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}
