package url

import (
	"io"
	"net/http"
	"net/url"
	"strings"
	"testing"

	json "github.com/bytedance/sonic"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.opentelemetry.io/otel"
)

func Test_NewHandler(t *testing.T) {
	app := fiber.New()
	validate := validator.New()
	tracer := otel.Tracer("url")
	h := NewHandler(app, validate, tracer)
	assert.NotNil(t, h)
}

func Test_RegisterHandlers(t *testing.T) {
	app := fiber.New()
	validate := validator.New()
	tracer := otel.Tracer("url")
	h := NewHandler(app, validate, tracer)
	h.RegisterHandlers()

	routes := app.GetRoutes()
	found := false
	for _, r := range routes {
		if r.Path == "/url" && r.Method == fiber.MethodPost {
			found = true
			break
		}
	}
	assert.True(t, found, "POST /url route should be registered")
}

func Test_GetUrl(t *testing.T) {
	tests := []struct {
		name      string
		operation UrlOperation
		inputURL  string
		expected  string
	}{
		{
			name:      "canonical",
			operation: UrlOperationCanonical,
			inputURL:  "https://BYFOOD.com/food-EXPeriences?query=abc/",
			expected:  "https://BYFOOD.com/food-EXPeriences",
		},
		{
			name:      "redirection",
			operation: UrlOperationRedirection,
			inputURL:  "https://BYFOOD.com/food-EXPeriences?query=abc/",
			expected:  "https://www.byfood.com/food-experiences?query=abc/",
		},
		{
			name:      "all",
			operation: UrlOperationAll,
			inputURL:  "https://BYFOOD.com/food-EXPeriences?query=abc/",
			expected:  "https://www.byfood.com/food-experiences",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			server, validate := setupServer()
			h := NewHandler(server, validate, otel.Tracer("url"))
			h.RegisterHandlers()

			u, err := url.Parse(tc.inputURL)
			require.NoError(t, err)

			payload, err := json.Marshal(GetUrlRequest{
				Operation: tc.operation,
				Url:       u,
			})
			require.NoError(t, err)

			req, err := http.NewRequest(http.MethodPost, "/url", strings.NewReader(string(payload)))
			require.NoError(t, err)
			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
			req.Header.Set(fiber.HeaderAccept, fiber.MIMEApplicationJSON)

			res, err := server.Test(req, -1)
			require.NoError(t, err)

			body, err := io.ReadAll(res.Body)
			require.NoError(t, err)

			assert.Equal(t, http.StatusOK, res.StatusCode)
			assert.Equal(t, "{\"processed_url\":\""+tc.expected+"\"}", string(body))
		})
	}
}

func setupServer() (*fiber.App, *validator.Validate) {
	server := fiber.New(fiber.Config{
		JSONDecoder:           json.Unmarshal,
		JSONEncoder:           json.Marshal,
		DisableStartupMessage: true,
	})

	return server, validator.New(validator.WithRequiredStructEnabled())
}
