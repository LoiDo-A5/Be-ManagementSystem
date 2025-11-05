# Use a lightweight Node.js image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund --legacy-peer-deps && npm cache clean --force

# Copy app source
COPY src ./src

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
