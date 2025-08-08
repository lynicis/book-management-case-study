package book

/*import (
	"path/filepath"
	"testing"

	"github.com/pact-foundation/pact-go/v2/models"
	"github.com/pact-foundation/pact-go/v2/provider"
	"github.com/stretchr/testify/assert"
)

// TODO:
func ProviderTest(t *testing.T) {
	go startServer()

	verifier := provider.NewVerifier()
	stateHandlers := models.StateHandlers{
		"": func(setup bool, state models.ProviderState) (models.ProviderStateResponse, error) {
			return models.ProviderStateResponse{}, nil
		},
	}

	err := verifier.VerifyProvider(t, provider.VerifyRequest{
		ProviderBaseURL: "http://localhost:1234",
		StateHandlers:   stateHandlers,
		PactFiles: []string{
			filepath.ToSlash("/path/to/SomeConsumer-SomeProvider.json"),
		},
	})

	assert.NoError(t, err)
}

func startServer() {} */
