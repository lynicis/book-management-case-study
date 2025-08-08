package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestConfig_Read(t *testing.T) {
	assert.NotPanics(t, func() {
		config := Read()
		assert.NotNil(t, config)
	})
}
