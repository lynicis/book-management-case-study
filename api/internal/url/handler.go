package url

import (
	"net/url"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

type Handler struct {
	server    *fiber.App
	validator *validator.Validate
	tracer    trace.Tracer
}

func NewHandler(server *fiber.App, validator *validator.Validate, tracer trace.Tracer) *Handler {
	return &Handler{
		server:    server,
		validator: validator,
		tracer:    tracer,
	}
}

func (h *Handler) RegisterHandlers() {
	h.server.Post("/url", h.GetUrl)
}

func (h *Handler) GetUrl(ctx *fiber.Ctx) error {
	_, span := h.tracer.Start(ctx.Context(), "GetUrl")
	defer span.End()

	var reqBody GetUrlRequest
	if err := ctx.BodyParser(&reqBody); err != nil {
		return err
	}

	span.SetAttributes(
		attribute.String("url", reqBody.Url.String()),
		attribute.String("operation", string(reqBody.Operation)),
	)

	// validator library cannot handle net/url types so should check it in handler layer
	if !strings.ContainsAny(reqBody.Url.Hostname(), "byfood.com") {
		return fiber.ErrBadRequest
	}

	if err := h.validator.StructCtx(ctx.Context(), reqBody); err != nil {
		return fiber.ErrBadRequest
	}

	var processed string

	switch reqBody.Operation {
	case "canonical":
		processed = canonicalURL(reqBody.Url).String()
	case "redirection":
		processed = strings.ToLower(redirectionUrl(reqBody.Url).String())
	case "all":
		processed = strings.ToLower(canonicalURL(redirectionUrl(reqBody.Url)).String())
	default:
		return fiber.ErrBadRequest
	}

	span.SetAttributes(attribute.String("processed_url", processed))
	return ctx.JSON(fiber.Map{"processed_url": processed})
}

func canonicalURL(u *url.URL) *url.URL {
	u.RawQuery = ""
	u.Fragment = ""
	if u.Path != "/" {
		u.Path = strings.TrimSuffix(u.Path, "/")
	}
	return u
}

func redirectionUrl(u *url.URL) *url.URL {
	u.Host = "www.byfood.com"
	return u
}
