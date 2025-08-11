package url

import "net/url"

type UrlOperation string

const (
	UrlOperationCanonical   UrlOperation = "canonical"
	UrlOperationRedirection UrlOperation = "redirection"
	UrlOperationAll         UrlOperation = "all"
)

type GetUrlRequest struct {
	Operation UrlOperation `json:"operation" validate:"oneof=canonical redirection all"`
	Url       *url.URL     `json:"url"`
}
