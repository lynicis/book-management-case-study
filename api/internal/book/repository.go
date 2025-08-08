package book

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/otel/attribute"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"

	"go.uber.org/zap"
)

type Repository interface {
	CreateBook(ctx context.Context, book *BookDTO) error
	GetBooks(ctx context.Context, page int, pageSize int, search string) (*[]BookDTO, error)
	GetBookById(ctx context.Context, id string) (*BookDTO, error)
	UpdateBookById(ctx context.Context, id string, book *BookDTO) error
	DeleteBookById(ctx context.Context, id string) error
}

type PgRepository struct {
	connectionPool *pgxpool.Pool
	traceProvider  *sdktrace.TracerProvider
}

func NewPgRepository(traceProvider *sdktrace.TracerProvider, host, port, username, password, database string) *PgRepository {
	credentials := fmt.Sprintf(
		"user=%s password=%s host=%s port=%s dbname=%s sslmode=disable",
		username, password, host, port, database,
	)
	pgConfig, err := pgxpool.ParseConfig(credentials)
	if err != nil {
		zap.L().Fatal("failed to parse database config", zap.Error(err))
	}

	pgConfig.ConnConfig.Tracer = otelpgx.NewTracer(
		otelpgx.WithTracerProvider(traceProvider),
		otelpgx.WithDisableConnectionDetailsInAttributes(),
	)

	var pgConnectionPool *pgxpool.Pool
	pgConnectionPool, err = pgxpool.NewWithConfig(context.Background(), pgConfig)
	if err != nil {
		zap.L().Fatal("failed to connect database", zap.Error(err))
	}

	if err := otelpgx.RecordStats(pgConnectionPool); err != nil {
		zap.L().Fatal("unable to record database stats", zap.Error(err))
	}

	var connection *pgxpool.Conn
	connection, err = pgConnectionPool.Acquire(context.Background())
	if err != nil {
		zap.L().Fatal("failed to acquire connection", zap.Error(err))
	}
	defer connection.Release()

	err = connection.Ping(context.Background())
	if err != nil {
		zap.L().Fatal("failed to ping database", zap.Error(err))
	}

	return &PgRepository{
		connectionPool: pgConnectionPool,
		traceProvider:  traceProvider,
	}
}

func (r *PgRepository) CreateBook(ctx context.Context, book *BookDTO) error {
	ctx, span := r.traceProvider.Tracer("bookRepository").Start(ctx, "CreateBook", trace.WithAttributes(attribute.KeyValue{
		Key:   "newBook",
		Value: attribute.StringValue(fmt.Sprintf("%+v", book)),
	}))
	defer span.End()

	connection, err := r.connectionPool.Acquire(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to acquire connection")
	}
	defer connection.Release()

	if _, err = connection.Exec(
		ctx,
		"insert into books (id, cover_url, isbn, title, author, publication_year, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
		book.Id,
		book.CoverUrl,
		book.ISBN,
		book.Title,
		book.Author,
		book.PublicationYear,
		time.Now().UTC(),
	); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create book")
	}

	return nil
}

func (r *PgRepository) GetBooks(
	ctx context.Context,
	page,
	pageSize int,
	search string,
) (*[]BookDTO, error) {
	ctx, span := r.traceProvider.Tracer("bookRepository").
		Start(ctx, "GetBooks", trace.WithAttributes(attribute.KeyValue{
			Key:   "page",
			Value: attribute.IntValue(page),
		}), trace.WithAttributes(attribute.KeyValue{
			Key:   "pageSize",
			Value: attribute.IntValue(pageSize),
		}), trace.WithAttributes(attribute.KeyValue{
			Key:   "search",
			Value: attribute.StringValue(search),
		}))
	defer span.End()

	connection, err := r.connectionPool.Acquire(ctx)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "failed to acquire connection")
	}
	defer connection.Release()

	var query strings.Builder
	query.WriteString("select * from books where deleted_at is null")

	args := make([]interface{}, 0, 3)
	argIndex := 1

	if search != "" {
		query.WriteString(" and to_tsvector(id || ' ' || service_name) @@ to_tsquery($1)")
		args = append(args, search)
		argIndex++
	}

	query.WriteString(fmt.Sprintf(" limit $%d offset $%d", argIndex, argIndex+1))
	args = append(args, pageSize, (page-1)*pageSize)

	var rows pgx.Rows
	rows, err = connection.Query(ctx, query.String(), args...)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "failed to get books")
	}

	var books []BookDTO
	books, err = pgx.CollectRows(rows, pgx.RowToStructByName[BookDTO])
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "failed to collect books")
	}

	return &books, nil
}

func (r *PgRepository) GetBookById(ctx context.Context, id string) (*BookDTO, error) {
	ctx, span := r.traceProvider.Tracer("bookRepository").Start(ctx, "GetBookById", trace.WithAttributes(attribute.KeyValue{
		Key:   "bookId",
		Value: attribute.StringValue(id),
	}))
	defer span.End()

	connection, err := r.connectionPool.Acquire(ctx)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "failed to acquire connection")
	}
	defer connection.Release()

	var row pgx.Rows
	row, err = connection.Query(ctx, "select * from books where id = $1 and deleted_at is null", id)
	if err != nil {
		return nil, fiber.NewError(fiber.StatusInternalServerError, "failed to get book")
	}

	var book BookDTO
	book, err = pgx.CollectOneRow(row, pgx.RowToStructByNameLax[BookDTO])
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fiber.NewError(fiber.StatusNotFound, "book not found")
		}

		return nil, fiber.NewError(fiber.StatusInternalServerError, "failed to collect an book")
	}

	return &book, nil
}

func (r *PgRepository) UpdateBookById(ctx context.Context, id string, book *BookDTO) error {
	ctx, span := r.traceProvider.Tracer("bookRepository").
		Start(ctx,
			"UpdateBookById",
			trace.WithAttributes(attribute.KeyValue{
				Key:   "bookId",
				Value: attribute.StringValue(id),
			}),
			trace.WithAttributes(attribute.KeyValue{
				Key:   "newBook",
				Value: attribute.StringValue(fmt.Sprintf("%+v", *book)),
			}),
		)
	defer span.End()

	connection, err := r.connectionPool.Acquire(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to acquire connection")
	}
	defer connection.Release()

	if _, err = connection.Exec(
		ctx,
		"update books set title = $1, author = $2, publication_year = $3 where id = $4 and deleted_at is null",
		book.Title,
		book.Author,
		book.PublicationYear,
		id,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fiber.NewError(fiber.StatusNotFound, "book not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "failed to update book by id")
	}

	return nil
}

func (r *PgRepository) DeleteBookById(ctx context.Context, id string) error {
	ctx, span := r.traceProvider.Tracer("bookRepository").
		Start(ctx, "DeleteBookById", trace.WithAttributes(attribute.KeyValue{
			Key:   "bookId",
			Value: attribute.StringValue(id),
		}))
	defer span.End()

	connection, err := r.connectionPool.Acquire(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to acquire connection")
	}
	defer connection.Release()

	now := time.Now().UTC()
	if _, err = connection.Exec(ctx, "update books set deleted_at = $1 where id = $2 and deleted_at is null", now, id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return fiber.NewError(fiber.StatusNotFound, "book not found")
		}

		return fiber.NewError(fiber.StatusInternalServerError, "failed to delete an book")
	}

	return nil
}
