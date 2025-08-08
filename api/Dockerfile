FROM golang:1.24.5-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o book-api .

FROM alpine

WORKDIR /app

RUN adduser -D appuser

USER appuser

COPY --from=builder /app/config ./config

COPY --from=builder /app/book-api .

EXPOSE 3001

CMD ["./book-api"]