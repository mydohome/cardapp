FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Nome:porta del servizio backend sulla rete Docker interna; sovrascrivibile
# via "environment:" nel compose (in produzione dietro NPM e' "app:8000").
ENV BACKEND_UPSTREAM=backend:8000
EXPOSE 80
