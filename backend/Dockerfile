FROM node:18-alpine

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies — no native modules, no build tools needed
RUN npm install --production --no-optional --ignore-scripts

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/server.js"]
