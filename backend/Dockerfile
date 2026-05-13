FROM node:18-alpine

WORKDIR /app

# Install OS dependencies needed for some npm packages
RUN apk add --no-cache python3 make g++ libc6-compat

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --production --no-optional 2>&1

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
