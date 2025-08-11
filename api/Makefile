generate-mock:
	mockgen -source=internal/book/repository.go -destination=internal/book/repository_mock.go -package=book

lint:
	golangci-lint run ./...

test:
	go test ./...

test-pact:
	go test -tags pact ./... 