# ./react-frontend/Dockerfile

FROM node:20

WORKDIR /app

# Copy package.json and package-lock.json
COPY ./my-react-app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Create .cache directory and set permissions
RUN mkdir -p /app/node_modules/.cache \
    && chmod -R 777 /app/node_modules/.cache

# Start the React development server
CMD ["npm", "start"]
