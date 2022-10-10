FROM node:16


RUN mkdir -p /service_plug_apis
WORKDIR /service_plug_apis


# copying all the files from your file system to container file system
COPY package*.json ./
COPY yarn*.lock ./

# install all dependencies
RUN yarn install

COPY . .

#expose the port
EXPOSE 3005


# command to run when intantiate an image
CMD ["yarn","start"]