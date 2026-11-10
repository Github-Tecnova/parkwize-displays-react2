# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG ENVIRONMENT=preview
# Create React App only exposes variables prefixed with REACT_APP_ and inlines
# them while building the static bundle.
ENV REACT_APP_ENVIRONMENT=$ENVIRONMENT

COPY package.json package-lock.json ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build


FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
