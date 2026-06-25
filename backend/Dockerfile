# Use a Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# to install dependencies
COPY package*.json ./

# Install dependencies
# Using --omit=dev for production builds to reduce image size
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# The migrate.js script needs 'pg' which is a dependency.
# It also needs access to the database schema file.
# Ensure the database directory is copied.
COPY database /app/database

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
# The `npm run migrate` command will be handled by docker-compose for initial setup.
# Here, we just define the start command for the application itself.
CMD ["node", "server.js"]
