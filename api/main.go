package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	json "github.com/bytedance/sonic"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/contrib/otelfiber"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/adaptor"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
	"go.uber.org/zap"

	"book-api/internal/book"
	"book-api/internal/url"
	"book-api/pkg/config"
	_ "book-api/pkg/log"
)

type GlobalHandler interface {
	RegisterHandlers()
}

var httpRequestDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
	Name:    "http_request_duration_seconds",
	Help:    "Duration of HTTP requests in seconds",
	Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10},
}, []string{"route", "method", "status"})

func init() {
	prometheus.MustRegister(httpRequestDuration)
}

func main() {
	cfg := config.Read()
	defer func() {
		if err := zap.L().Sync(); err != nil {
			panic(err)
		}
	}()
	zap.L().Info("Server starting...")

	traceProvider := initTracer(cfg)
	bookPgRepository := book.NewPgRepository(
		traceProvider,
		cfg.PostgresConfig.Host,
		cfg.PostgresConfig.Port,
		cfg.PostgresConfig.Username,
		cfg.PostgresConfig.Password,
		cfg.PostgresConfig.Database,
	)

	server := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		JSONDecoder:           json.Unmarshal,
		JSONEncoder:           json.Marshal,
		IdleTimeout:           5 * time.Second,
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		Concurrency:           256 * 1024,
	})
	server.Use(recover.New())
	server.Use(cors.New(cors.Config{AllowOrigins: cfg.CorsOrigins}))
	server.Use(otelfiber.Middleware())
	server.Use(requestDurationMiddleware())
	server.Get("/metrics", adaptor.HTTPHandler(promhttp.Handler()))
	server.Get("/health", func(ctx *fiber.Ctx) error {
		return ctx.Status(fiber.StatusOK).JSON(map[string]interface{}{"Status": "OK"})
	})

	validate := validator.New(validator.WithRequiredStructEnabled())
	handlers := []GlobalHandler{
		book.NewHandler(server, validate, traceProvider.Tracer("book"), bookPgRepository),
		url.NewHandler(server, validate, traceProvider.Tracer("url")),
	}
	for _, handler := range handlers {
		handler.RegisterHandlers()
	}

	go func() {
		if err := server.Listen(fmt.Sprintf("0.0.0.0:%s", cfg.ServerPort)); err != nil {
			zap.L().Fatal("Failed to start server", zap.Error(err))
		}
	}()
	zap.L().Info("Server started on port", zap.String("port", cfg.ServerPort))

	gracefulShutdown(server)
}

func gracefulShutdown(server *fiber.App) {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	zap.L().Info("Shutting down server...")

	if err := server.ShutdownWithTimeout(5 * time.Second); err != nil {
		zap.L().Error("Error during server shutdown", zap.Error(err))
	}

	zap.L().Info("Server gracefully stopped")
}

func requestDurationMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Response().StatusCode())
		httpRequestDuration.WithLabelValues(
			c.Route().Path,
			c.Method(),
			status,
		).Observe(duration)

		return err
	}
}

func initTracer(cfg *config.Config) *sdktrace.TracerProvider {
	exporter, err := otlptrace.New(
		context.Background(),
		otlptracehttp.NewClient(
			otlptracehttp.WithEndpoint(cfg.OtelTraceEndpoint),
			otlptracehttp.WithHeaders(map[string]string{
				"content-type": "application/json",
			}),
			otlptracehttp.WithInsecure(),
		),
	)
	if err != nil {
		log.Fatal(err)
	}

	traceProvider := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(
			resource.NewWithAttributes(
				semconv.SchemaURL,
				semconv.ServiceNameKey.String("book-api"),
			)),
	)
	otel.SetTracerProvider(traceProvider)
	otel.SetTextMapPropagator(
		propagation.NewCompositeTextMapPropagator(
			propagation.TraceContext{},
			propagation.Baggage{},
		),
	)

	return traceProvider
}
