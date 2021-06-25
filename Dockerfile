FROM node

LABEL maintainer = "Jun Hong Lin <m81923@gmail.com>"

WORKDIR /home/app

COPY package*.json ./

RUN npm install && \
    rm -r /home/node

COPY . .

EXPOSE 3000
# CMD ["node", "app.js"]

# build image: docker build . -t junhong/share-label:1.0-dev
# run container: docker run -it --rm -p 3000:3000 --name share-label [Image Id] bash
