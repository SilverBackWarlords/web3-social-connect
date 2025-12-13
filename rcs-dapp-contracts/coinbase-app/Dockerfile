FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install --production

# Copy local code to the container image.
COPY . .

# Set the port to 3000
ENV PORT 3000
EXPOSE 3000

# Run the web service on container startup.
<<<<<<< HEAD
CMD ["node", "server.js"]
=======
CMD ["node", "index.js"]
>>>>>>> 08d13ee0ed1db22b3af0bf253927d6380e55cb20
