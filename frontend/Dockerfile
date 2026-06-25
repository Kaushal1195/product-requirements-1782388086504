# Stage 1: Build the React application
FROM node:18-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the React app
# VITE_API_BASE_URL is set in docker-compose.yml for local dev,
# but for a production build, it might be hardcoded or passed during build.
# For CI/CD, we'll use a placeholder or default.
ARG VITE_API_BASE_URL_ARG=http://localhost:8000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL_ARG

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React app from the build-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80 for Nginx
EXPOSE 80

# Command to start Nginx
CMD ["nginx", "-g", "daemon off;"]
