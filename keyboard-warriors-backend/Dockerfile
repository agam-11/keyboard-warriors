# Step 1: Use an official Node.js runtime as a parent image
FROM node:18-slim

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json
COPY package*.json ./

# Step 4: Install application dependencies
RUN npm install

# Step 5: Copy the rest of your application's source code
COPY . .

# Step 6: Expose the port that Railway provides via the PORT env var.
# This MUST match the port your app listens on in production.
EXPOSE 8080

# Step 7: Define the command to run your app
# The server.js file is already configured to use process.env.PORT
CMD [ "node", "server.js" ]

