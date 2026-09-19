# Sia l'immagine ufficiale "minio/minio" su Docker Hub (pull negato anche in
# anonimo) sia il binario precompilato su dl.min.io (risponde 410 Gone) non
# sono piu' liberamente scaricabili. MinIO resta pero' open source (AGPLv3):
# lo compiliamo dal sorgente ufficiale con Go, che non dipende da nessuna
# delle due distribuzioni chiuse. Il primo build è più lento (compila da
# sorgente), i successivi riusano la cache dei layer Docker.
FROM golang:1.24-alpine AS build

RUN apk add --no-cache git

ENV CGO_ENABLED=0
RUN go install github.com/minio/minio@RELEASE.2025-10-15T17-29-55Z

FROM alpine:3.20

RUN apk add --no-cache ca-certificates curl
COPY --from=build /go/bin/minio /usr/local/bin/minio

EXPOSE 9000 9001
ENTRYPOINT ["minio"]
