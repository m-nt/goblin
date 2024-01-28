# syntax=docker/dockerfile:1
# FROM ubuntu:latest
# WORKDIR /dockercli
# ENV PATH="$PATH:/dockercli"
# RUN apt-get update && apt-get -d -o dir::cache=`pwd` -o Debug::NoLocking=1 install docker.io -y

FROM node:20-alpine
RUN apk add --update docker openrc
RUN rc-update add docker boot
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
USER node
RUN npm install
COPY --chown=node:node . .
EXPOSE 8000
CMD [ "node", "goblin.js" ]