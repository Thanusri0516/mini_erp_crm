FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install packages
RUN npm install

# Copy codebase
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to Javascript
RUN npm run build

# Expose port
EXPOSE 5000

# Start script
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
