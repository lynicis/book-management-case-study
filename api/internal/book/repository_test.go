//go:build !pact
// +build !pact

package book

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"go.opentelemetry.io/otel/sdk/trace"
)

func TestNewPgRepository(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		pgContainer := setupContainer(t)

		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err := pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		assert.NotPanics(t, func() {
			NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		})
	})

	t.Run("invalid config", func(t *testing.T) {
		assert.Panics(t, func() {
			NewPgRepository(nil, "", "", "root", "root", "test")
		})
	})

	t.Run("connection error", func(t *testing.T) {
		assert.Panics(t, func() {
			NewPgRepository(nil, "localhost", "5432", "root", "root", "test")
		})
	})
}

func TestPgRepository_CreateBook(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		now := time.Now().UTC()
		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		err = pgRepository.CreateBook(context.TODO(), &BookDTO{
			Id:              uuid.NewString(),
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "1234567890",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			CreatedAt:       &now,
		})

		assert.NoError(t, err)
	})

	t.Run("acquire connection error", func(t *testing.T) {
		pgCfg, err := pgxpool.ParseConfig("postgres://joedoe:secret@pg.example.com:5432/mydb")
		require.NoError(t, err)

		pool, err := pgxpool.NewWithConfig(context.Background(), pgCfg)
		require.NoError(t, err)

		pgRepository := &PgRepository{
			connectionPool: pool,
			traceProvider:  trace.NewTracerProvider(),
		}
		now := time.Now().UTC()
		err = pgRepository.CreateBook(context.TODO(), &BookDTO{
			Id:              uuid.NewString(),
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "1234567890",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			CreatedAt:       &now,
		})

		assert.Error(t, err)
	})

	t.Run("repository error", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		now := time.Now().UTC()
		err = pgRepository.CreateBook(context.TODO(), &BookDTO{
			Id:              uuid.NewString(),
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "1234567890",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			CreatedAt:       &now,
		})

		assert.NoError(t, err)
	})
}

func TestPgRepository_UpdateBook(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		bookId := uuid.NewString()
		now := time.Now().UTC()
		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		_, err = pgRepository.connectionPool.Exec(
			context.TODO(),
			"insert into books (id, cover_url, isbn, title, author, publication_year, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
			bookId,
			"https://img.com/cover.jpg",
			"1234567890",
			"Clean Code",
			"Robert C. Martin",
			"2008",
			&now,
		)
		require.NoError(t, err)

		err = pgRepository.UpdateBookById(context.TODO(), bookId, &BookDTO{
			Id:              bookId,
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "1234567890",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			UpdatedAt:       &now,
		})
		assert.NoError(t, err)
	})

	t.Run("acquire connection error", func(t *testing.T) {
		pgCfg, err := pgxpool.ParseConfig("postgres://joedoe:secret@pg.example.com:5432/mydb")
		require.NoError(t, err)

		pool, err := pgxpool.NewWithConfig(context.Background(), pgCfg)
		require.NoError(t, err)

		pgRepository := &PgRepository{
			connectionPool: pool,
			traceProvider:  trace.NewTracerProvider(),
		}
		now := time.Now().UTC()
		err = pgRepository.UpdateBookById(context.TODO(), uuid.NewString(), &BookDTO{
			Id:              uuid.NewString(),
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "1234567890",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			UpdatedAt:       &now,
		})

		assert.Error(t, err)
	})

	t.Run("not found", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		bookId := uuid.NewString()
		now := time.Now().UTC()
		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		err = pgRepository.UpdateBookById(context.TODO(), bookId, &BookDTO{
			Id:              bookId,
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "1234567890",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			UpdatedAt:       &now,
		})
		assert.NoError(t, err)
	})
}

func TestPgRepository_GetBookById(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		bookId := uuid.NewString()
		now := time.Now().UTC()
		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		_, err = pgRepository.connectionPool.Exec(
			context.TODO(),
			"insert into books (id, cover_url, isbn, title, author, publication_year, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
			bookId,
			"https://img.com/cover.jpg",
			"1234567890",
			"Clean Code",
			"Robert C. Martin",
			"2008",
			&now,
		)
		require.NoError(t, err)

		book, err := pgRepository.GetBookById(context.TODO(), bookId)

		assert.NoError(t, err)
		assert.NotNil(t, book)
		assert.Equal(t, bookId, book.Id)
	})

	t.Run("acquire connection error", func(t *testing.T) {
		pgCfg, err := pgxpool.ParseConfig("postgres://joedoe:secret@pg.example.com:5432/mydb")
		require.NoError(t, err)

		pool, err := pgxpool.NewWithConfig(context.Background(), pgCfg)
		require.NoError(t, err)

		pgRepository := &PgRepository{
			connectionPool: pool,
			traceProvider:  trace.NewTracerProvider(),
		}
		book, err := pgRepository.GetBookById(context.TODO(), uuid.NewString())

		assert.Error(t, err)
		assert.Nil(t, book)
	})

	t.Run("not found", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		book, err := pgRepository.GetBookById(context.TODO(), uuid.NewString())

		assert.Nil(t, book)
		assert.Error(t, err)
		assert.Equal(t, fiber.StatusNotFound, err.(*fiber.Error).Code)
	})
}

func TestPgRepository_GetBooks(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		for i := 0; i < 3; i++ {
			_, err = pgRepository.connectionPool.Exec(
				context.TODO(),
				"insert into books (id, cover_url, isbn, title, author, publication_year, created_at) values ($1,$2,$3,$4,$5,$6,$7)",
				uuid.NewString(),
				"https://img.com/cover.jpg",
				"1234567890",
				fmt.Sprintf("Book %d", i+1),
				"Author",
				"2000",
				time.Now().UTC(),
			)
			require.NoError(t, err)
		}

		books, total, err := pgRepository.GetBooks(context.TODO(), 1, 2, "")
		assert.NoError(t, err)
		assert.NotNil(t, books)
		assert.Len(t, *books, 2)
		assert.Equal(t, 3, total)
	})

	t.Run("acquire connection error", func(t *testing.T) {
		pgCfg, err := pgxpool.ParseConfig("postgres://joedoe:secret@pg.example.com:5432/mydb")
		require.NoError(t, err)

		pool, err := pgxpool.NewWithConfig(context.Background(), pgCfg)
		require.NoError(t, err)

		pgRepository := &PgRepository{
			connectionPool: pool,
			traceProvider:  trace.NewTracerProvider(),
		}
		books, total, err := pgRepository.GetBooks(context.TODO(), 1, 5, "")
		assert.Error(t, err)
		assert.Nil(t, books)
		assert.Equal(t, 0, total)
	})

	t.Run("not found", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")
		books, total, err := pgRepository.GetBooks(context.TODO(), 1, 5, "searchdoesnotmatch")

		assert.Error(t, err)
		assert.Nil(t, books)
		assert.Equal(t, 0, total)
		assert.Equal(t, fiber.StatusNotFound, err.(*fiber.Error).Code)
	})
}

func TestPgRepository_DeleteBookById(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		pgContainer := setupContainer(t)
		pgHost, err := pgContainer.Host(context.Background())
		require.NoError(t, err)

		pgPort, err := pgContainer.MappedPort(context.Background(), "5432/tcp")
		require.NoError(t, err)

		t.Cleanup(func() {
			err = pgContainer.Restore(context.Background())
			require.NoError(t, err)
		})

		pgRepository := NewPgRepository(trace.NewTracerProvider(), pgHost, pgPort.Port(), "root", "root", "test")

		bookId := uuid.NewString()
		now := time.Now().UTC()
		_, err = pgRepository.connectionPool.Exec(
			context.TODO(),
			"insert into books (id, cover_url, isbn, title, author, publication_year, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
			bookId,
			"https://img.com/cover.jpg",
			"1234567890",
			"Clean Code",
			"Robert C. Martin",
			"2008",
			&now,
		)
		require.NoError(t, err)

		err = pgRepository.DeleteBookById(context.TODO(), bookId)

		assert.NoError(t, err)
	})

	t.Run("acquire connection error", func(t *testing.T) {
		pgCfg, err := pgxpool.ParseConfig("postgres://joedoe:secret@pg.example.com:5432/mydb")
		require.NoError(t, err)

		pool, err := pgxpool.NewWithConfig(context.Background(), pgCfg)
		require.NoError(t, err)

		pgRepository := &PgRepository{
			connectionPool: pool,
			traceProvider:  trace.NewTracerProvider(),
		}
		err = pgRepository.DeleteBookById(context.TODO(), uuid.NewString())

		assert.Error(t, err)
	})
}

func setupContainer(t *testing.T) *postgres.PostgresContainer {
	ctx := context.Background()
	postgresContainer, err := postgres.Run(
		ctx,
		"postgres:alpine",
		postgres.WithDatabase("test"),
		postgres.WithUsername("root"),
		postgres.WithPassword("root"),
		postgres.BasicWaitStrategies(),
		postgres.WithSQLDriver("pgx"),
		postgres.WithInitScripts("../../migrations/book.sql"),
	)
	require.NoError(t, err)

	t.Cleanup(func() {
		err = postgresContainer.Terminate(ctx)
		require.NoError(t, err)
	})

	err = postgresContainer.Snapshot(ctx)
	require.NoError(t, err)

	return postgresContainer
}
