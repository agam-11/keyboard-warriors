# Step 1: Use an official Node.js runtime as a parent image
# We use the slim version because it's smaller and more secure
FROM node:18-slim

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json to the working directory
# This is done separately to take advantage of Docker's layer caching
COPY package*.json ./

# Step 4: Install application dependencies
RUN npm install

# Step 5: Copy the rest of your application's source code
COPY . .

# Step 6: Expose the port your app runs on. Azure will use this.
EXPOSE 3001

# Step 7: Define the command to run your app
CMD [ "node", "server.js" ]

