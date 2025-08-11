//go:build pact
// +build pact

package book

import (
	"fmt"
	"net"
	"testing"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/pact-foundation/pact-go/v2/models"
	"github.com/pact-foundation/pact-go/v2/provider"
	"github.com/pact-foundation/pact-go/v2/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func Test_PactProvider(t *testing.T) {
	handler := &Handler{
		server: fiber.New(fiber.Config{
			DisableStartupMessage: true,
		}),
		validator: validator.New(),
	}
	handler.RegisterHandlers()

	port, _ := utils.GetFreePort()

	go func() {
		err := handler.server.Listen(fmt.Sprintf("127.0.0.1:%d", port))
		require.NoError(t, err)
	}()
	t.Cleanup(func() {
		_ = handler.server.Shutdown()
	})

	require.Eventually(t, func() bool {
		conn, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", port), 100*time.Millisecond)
		if err != nil {
			return false
		}
		_ = conn.Close()
		return true
	}, 5*time.Second, 50*time.Millisecond)

	createdAt, _ := time.Parse(time.RFC3339, "2006-01-02T15:04:05Z")
	mockController := gomock.NewController(t)
	mockRepository := NewMockRepository(mockController)
	handler.repository = mockRepository
	stateHandlers := models.StateHandlers{
		"A book for create": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				CreateBook(gomock.Any(), gomock.Any()).
				Return(nil).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"A book for create while server in error state": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				CreateBook(gomock.Any(), gomock.Any()).
				Return(fiber.ErrInternalServerError).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},

		"A list of books": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				GetBooks(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(&[]BookDTO{
					{
						Id:              "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59",
						CoverUrl:        "https://picsum.photos/seed/5CsJk20lGp/3533/3856",
						ISBN:            "978-0-928061-84-0",
						Title:           "I, Claudius",
						Author:          "Philip Roth",
						PublicationYear: "2025",
						CreatedAt:       &createdAt,
					},
				}, 1, nil).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"No books found": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				GetBooks(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(nil, 0, fiber.ErrNotFound).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"A list of books while server in error state": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				GetBooks(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).
				Return(nil, 0, fiber.ErrInternalServerError).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},

		"A book with id for get book detail": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			book := BookDTO{
				Id:              "7c9affa4-5c43-4cb4-a5fb-dcc291fbba59",
				CoverUrl:        "https://picsum.photos/seed/5CsJk20lGp/3533/3856",
				ISBN:            "978-0-928061-84-0",
				Title:           "I, Claudius",
				Author:          "Philip Roth",
				PublicationYear: "2025",
				CreatedAt:       &createdAt,
			}
			mockRepository.
				EXPECT().
				GetBookById(gomock.Any(), gomock.Any()).
				Return(&book, nil).
				Times(1)

			return models.ProviderStateResponse{"book": book}, nil
		},
		"Not existed book with id for get book detail": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				GetBookById(gomock.Any(), gomock.Any()).
				Return(nil, fiber.ErrNotFound).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"A book with id while server in error state": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				GetBookById(gomock.Any(), gomock.Any()).
				Return(nil, fiber.ErrInternalServerError).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},

		"A book with id and fields for update": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				UpdateBookById(gomock.Any(), gomock.Any(), gomock.Any()).
				Return(nil).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"Not existed book with id and fields for update": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				UpdateBookById(gomock.Any(), gomock.Any(), gomock.Any()).
				Return(fiber.ErrNotFound).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"A book with id and fields but while server in error state": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				UpdateBookById(gomock.Any(), gomock.Any(), gomock.Any()).
				Return(fiber.ErrInternalServerError).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},

		"A book with id for delete": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				DeleteBookById(gomock.Any(), gomock.Any()).
				Return(nil).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"Not existed book with id for delete": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				DeleteBookById(gomock.Any(), gomock.Any()).
				Return(fiber.ErrNotFound).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
		"A book with id while server in error state for delete": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			if !setup {
				return models.ProviderStateResponse{}, nil
			}
			mockRepository.
				EXPECT().
				DeleteBookById(gomock.Any(), gomock.Any()).
				Return(fiber.ErrInternalServerError).
				Times(1)

			return models.ProviderStateResponse{}, nil
		},
	}

	baseUrl := fmt.Sprintf("http://127.0.0.1:%d", port)
	verifier := provider.NewVerifier()
	err := verifier.VerifyProvider(t, provider.VerifyRequest{
		Provider:                   "BookAPI",
		ProviderBaseURL:            baseUrl,
		BrokerURL:                  "http://127.0.0.1:3003",
		ProviderVersion:            "latest",
		FailIfNoPactsFound:         false,
		StateHandlers:              stateHandlers,
		PublishVerificationResults: true,
		BeforeEach: func() error {
			mockController = gomock.NewController(t)
			mockRepository = NewMockRepository(mockController)
			handler.repository = mockRepository
			return nil
		},
		AfterEach: func() error {
			if mockController != nil {
				mockController.Finish()
			}
			return nil
		},
	})

	assert.NoError(t, err)
}
