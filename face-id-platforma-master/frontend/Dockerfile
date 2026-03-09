# Base node image for building the frontend App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Nginx image for serving the built assets
FROM nginx:alpine

# Copy built files to Nginx serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# We will let the main Nginx handle routing, but this internal frontend nginx 
# simply serves the static files. A custom conf for SPA routing:
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
