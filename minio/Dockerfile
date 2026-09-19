# L'immagine ufficiale "minio/minio" non e' piu' liberamente scaricabile da
# Docker Hub (il pull viene rifiutato con "denied: requested access to the
# resource is denied" anche per utenti anonimi). Per non dipendere dalla
# policy di un registry di terzi, costruiamo il server MinIO direttamente
# dal binario ufficiale pubblicato da MinIO stesso via HTTPS.
FROM alpine:3.20

ARG TARGETARCH

RUN apk add --no-cache ca-certificates curl && \
    curl -fsSL -o /usr/local/bin/minio "https://dl.min.io/server/minio/release/linux-${TARGETARCH}/minio" && \
    chmod +x /usr/local/bin/minio

EXPOSE 9000 9001
ENTRYPOINT ["minio"]
