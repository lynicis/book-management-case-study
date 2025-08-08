package book

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	json "github.com/bytedance/sonic"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func TestHandler_NewHandler(t *testing.T) {
	h := NewHandler(nil, nil, nil)
	assert.NotNil(t, h)
}

func TestHandler_RegisterHandlers(t *testing.T) {
	h := NewHandler(fiber.New(), nil, nil)

	assert.NotPanics(t, h.RegisterHandlers)
}

func TestHandler_CreateBook(t *testing.T) {
	mockController := gomock.NewController(t)
	defer mockController.Finish()

	t.Run("happy path", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.EXPECT().CreateBook(gomock.Any(), gomock.Any()).Return(nil).Times(1)

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		marshalledReqBody, err := json.Marshal(CreateBookRequest{
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "9780132350884",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
		})
		require.NoError(t, err)

		req, err := http.NewRequest(http.MethodPost, "/book", strings.NewReader(string(marshalledReqBody)))
		require.NoError(t, err)

		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)

		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, res.StatusCode)

	})

	t.Run("invalid request body", func(t *testing.T) {
		server, validate := setupServer()
		h := NewHandler(server, validate, nil)
		h.RegisterHandlers()

		requestBody := []CreateBookRequest{
			{
				CoverUrl:        "invalid-url",
				ISBN:            "9780132350884",
				Title:           "Clean Code",
				Author:          "Robert C. Martin",
				PublicationYear: "2008",
			},
			{
				CoverUrl:        "https://img.com/cover.jpg",
				ISBN:            "invalid-isbn",
				Title:           "Clean Code",
				Author:          "Robert C. Martin",
				PublicationYear: "2008",
			},
			{
				CoverUrl:        "https://img.com/cover.jpg",
				ISBN:            "9780132350884",
				Title:           "",
				Author:          "Robert C. Martin",
				PublicationYear: "2008",
			},
			{
				CoverUrl:        "https://img.com/cover.jpg",
				ISBN:            "9780132350884",
				Title:           "Clean Code",
				Author:          "",
				PublicationYear: "2008",
			},
			{
				CoverUrl:        "https://img.com/cover.jpg",
				ISBN:            "9780132350884",
				Title:           "Clean Code",
				Author:          "Robert C. Martin",
				PublicationYear: "year",
			},
		}
		for _, reqBody := range requestBody {
			marshalledReqBody, err := json.Marshal(reqBody)
			assert.NoError(t, err)

			req, err := http.NewRequest(http.MethodPost, "/book", strings.NewReader(string(marshalledReqBody)))
			assert.NoError(t, err)

			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)

			res, err := server.Test(req, -1)

			assert.NoError(t, err)
			assert.Equal(t, http.StatusBadRequest, res.StatusCode)
		}
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.
			EXPECT().
			CreateBook(gomock.Any(), gomock.Any()).
			Return(fiber.NewError(fiber.StatusInternalServerError, "repository error"))

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		reqBody := CreateBookRequest{
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "9780132350884",
			Title:           "Clean Code",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
		}

		marshalledReqBody, err := json.Marshal(reqBody)
		assert.NoError(t, err)

		req, err := http.NewRequest(http.MethodPost, "/book", strings.NewReader(string(marshalledReqBody)))
		assert.NoError(t, err)

		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)

		assert.NoError(t, err)
		assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
	})
}

func TestHandler_GetBooks(t *testing.T) {
	mockController := gomock.NewController(t)
	defer mockController.Finish()

	now := time.Now().UTC()
	books := &[]BookDTO{
		{
			Id:              uuid.NewString(),
			Title:           "Clean Code",
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "9780132350884",
			Author:          "test",
			PublicationYear: "2008",
			CreatedAt:       &now,
		}, {

			Id:              uuid.NewString(),
			Title:           "test",
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "9780132350884",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
			CreatedAt:       &now,
			UpdatedAt:       &now,
		},
	}

	t.Run("happy path", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.
			EXPECT().
			GetBooks(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
			Return(books, nil).
			Times(1)

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		queries := []map[string]string{
			{},
			{
				"page": "1",
			},
			{
				"pageSize": "2",
			},
			{
				"search": "test",
			},
		}

		reqUrl, err := url.Parse("http://0.0.0.0/books")
		assert.NoError(t, err)

		for _, query := range queries {
			queryParams := reqUrl.Query()
			for queryKey, queryValue := range query {
				queryParams.Add(queryKey, queryValue)
			}
			reqUrl.RawQuery = queryParams.Encode()

		}

		req := httptest.NewRequest(http.MethodGet, reqUrl.String(), nil)
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)

		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)
	})

	t.Run("invalid request queries", func(t *testing.T) {
		server, validate := setupServer()
		h := NewHandler(server, validate, nil)
		h.RegisterHandlers()

		queries := []map[string]string{
			{
				"page": "invalid",
			},
			{
				"pageSize": "invalid",
			},
		}

		reqUrl, err := url.Parse("http://0.0.0.0/books")
		assert.NoError(t, err)
		for _, query := range queries {
			queryParams := reqUrl.Query()

			for queryKey, queryValue := range query {
				queryParams.Add(queryKey, queryValue)
			}

			reqUrl.RawQuery = queryParams.Encode()
		}

		req := httptest.NewRequest(http.MethodGet, reqUrl.String(), nil)
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)

		assert.NoError(t, err)
		assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.
			EXPECT().
			GetBooks(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
			Return(nil, fiber.NewError(fiber.StatusInternalServerError, "repository error"))

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		req := httptest.NewRequest(http.MethodGet, "/books", nil)
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)

		assert.NoError(t, err)
		assert.Equal(t, http.StatusInternalServerError, res.StatusCode)
	})
}

func TestHandler_GetBookById(t *testing.T) {
	mockController := gomock.NewController(t)
	defer mockController.Finish()

	t.Run("happy path", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)

		id := uuid.NewString()
		now := time.Now().UTC()
		mockRepository.EXPECT().GetBookById(gomock.Any(), gomock.Any()).Return(&BookDTO{
			Id:              id,
			Title:           "",
			Author:          "",
			PublicationYear: "",
			CreatedAt:       &now,
		}, nil)

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/book/%s", id), nil)
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, res.StatusCode)
		assert.Equal(t, fiber.MIMEApplicationJSON, res.Header.Get(fiber.HeaderContentType))
	})

	t.Run("invalid book id", func(t *testing.T) {
		server, validate := setupServer()
		h := NewHandler(server, validate, nil)
		h.RegisterHandlers()

		req := httptest.NewRequest(http.MethodGet, "/book/123", nil)
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, res.StatusCode)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.EXPECT().GetBookById(gomock.Any(), gomock.Any()).Return(nil, fiber.NewError(fiber.StatusInternalServerError, "repository error"))

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/book/%s", uuid.NewString()), nil)
		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusInternalServerError, res.StatusCode)
	})
}

func TestHandler_UpdateBookById(t *testing.T) {
	mockController := gomock.NewController(t)
	defer mockController.Finish()

	t.Run("happy path", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.
			EXPECT().
			UpdateBookById(gomock.Any(), gomock.Any(), gomock.Any()).
			Return(nil).
			Times(3)

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		requestBody := []CreateBookRequest{
			{
				CoverUrl:        "https://img.com/cover-1.jpg",
				Title:           "Clean Code",
				ISBN:            "9780132350884",
				Author:          "Robert C. Martin",
				PublicationYear: "2008",
			}, {
				CoverUrl:        "https://img.com/cover-2.jpg",
				Title:           "Refactoring",
				ISBN:            "9780132350884",
				Author:          "Martin Fowler",
				PublicationYear: "2008",
			}, {
				CoverUrl:        "https://img.com/cover-3.jpg",
				Title:           "Test-Driven Development",
				ISBN:            "9780132350884",
				Author:          "Kent Beck",
				PublicationYear: "2008",
			},
		}

		for _, body := range requestBody {
			marshalledReqBody, err := json.Marshal(body)
			assert.NoError(t, err)

			req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/book/%s", uuid.NewString()), strings.NewReader(string(marshalledReqBody)))
			assert.NoError(t, err)

			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
			req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

			res, err := server.Test(req, -1)
			assert.NoError(t, err)
			assert.Equal(t, fiber.StatusNoContent, res.StatusCode)
		}
	})

	t.Run("invalid request body", func(t *testing.T) {
		server, validate := setupServer()
		h := NewHandler(server, validate, nil)
		h.RegisterHandlers()

		requestBody := []CreateBookRequest{
			{},
			{
				CoverUrl:        "invalid-url",
				Title:           "Clean Code",
				ISBN:            "9780132350884",
				Author:          "Robert C. Martin",
				PublicationYear: "2008",
			}, {
				CoverUrl:        "https://img.com/cover-2.jpg",
				Title:           "",
				ISBN:            "9780132350884",
				Author:          "Martin Fowler",
				PublicationYear: "2008",
			}, {
				CoverUrl:        "https://img.com/cover-3.jpg",
				Title:           "Test-Driven Development",
				ISBN:            "invalid-isbn",
				Author:          "",
				PublicationYear: "2008",
			}, {
				CoverUrl:        "https://img.com/cover-3.jpg",
				Title:           "Test-Driven Development",
				ISBN:            "9780132350884",
				Author:          "",
				PublicationYear: "2008",
			}, {
				CoverUrl:        "https://img.com/cover-3.jpg",
				Title:           "Test-Driven Development",
				ISBN:            "9780132350884",
				Author:          "Martin Fowler",
				PublicationYear: "invalid-pub-year",
			},
		}

		for _, body := range requestBody {
			marshalledReqBody, err := json.Marshal(body)
			assert.NoError(t, err)

			req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/book/%s", uuid.NewString()), strings.NewReader(string(marshalledReqBody)))
			assert.NoError(t, err)

			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
			req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

			res, err := server.Test(req, -1)
			assert.NoError(t, err)
			assert.Equal(t, fiber.StatusBadRequest, res.StatusCode)
		}
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.EXPECT().UpdateBookById(gomock.Any(), gomock.Any(), gomock.Any()).Return(fiber.NewError(fiber.StatusInternalServerError, "repository error"))

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		requestBody := CreateBookRequest{
			Title:           "Clean Code",
			CoverUrl:        "https://img.com/cover.jpg",
			ISBN:            "9780132350884",
			Author:          "Robert C. Martin",
			PublicationYear: "2008",
		}

		marshalledReqBody, err := json.Marshal(requestBody)
		assert.NoError(t, err)

		req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("/book/%s", uuid.NewString()), strings.NewReader(string(marshalledReqBody)))
		assert.NoError(t, err)

		req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusInternalServerError, res.StatusCode)
	})
}

func TestHandler_DeleteBookById(t *testing.T) {
	mockController := gomock.NewController(t)
	defer mockController.Finish()

	t.Run("happy path", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.EXPECT().DeleteBookById(gomock.Any(), gomock.Any()).Return(nil)

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/book/%s", uuid.NewString()), nil)
		assert.NoError(t, err)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusNoContent, res.StatusCode)
	})

	t.Run("invalid request body", func(t *testing.T) {
		server, validate := setupServer()
		h := NewHandler(server, validate, nil)
		h.RegisterHandlers()

		req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/book/%s", "invalid-id"), nil)
		assert.NoError(t, err)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, res.StatusCode)

	})

	t.Run("repository error", func(t *testing.T) {
		mockRepository := NewMockRepository(mockController)
		mockRepository.EXPECT().DeleteBookById(gomock.Any(), gomock.Any()).Return(fiber.NewError(fiber.StatusInternalServerError, "repository error"))

		server, validate := setupServer()
		h := NewHandler(server, validate, mockRepository)
		h.RegisterHandlers()

		req, err := http.NewRequest(http.MethodDelete, fmt.Sprintf("/book/%s", uuid.NewString()), nil)
		assert.NoError(t, err)

		res, err := server.Test(req, -1)
		assert.NoError(t, err)
		assert.Equal(t, fiber.StatusInternalServerError, res.StatusCode)
	})
}

func setupServer() (*fiber.App, *validator.Validate) {
	server := fiber.New(fiber.Config{
		JSONDecoder:           json.Unmarshal,
		JSONEncoder:           json.Marshal,
		DisableStartupMessage: true,
	})

	return server, validator.New()
}
