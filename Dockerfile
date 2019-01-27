FROM node:alpine as builder


# RUN npm install -g yarn
WORKDIR /root

COPY . .
RUN yarn
RUN yarn run build

FROM node:alpine as builder2

WORKDIR /root

COPY --from=builder /root/package.json /root/package.json
COPY --from=builder /root/yarn.lock /root/yarn.lock
RUN yarn install --production=true
# RUN yarn add axios body-parser cors express moment mongoose node-cache rmwc
# RUN yarn add axios body-parser cors express moment mongoose node-cache


FROM node:alpine

WORKDIR /root

COPY --from=builder /root/build /root/build
COPY --from=builder /root/server /root/server
COPY --from=builder /root/public /root/public
COPY --from=builder2 /root/node_modules /root/node_modules

ENV LivepeerMetricsMongo=mongodb://mongodb:27017/metrics-rinkeby?retryWrites=true
ENV SERVESTATIC=1
EXPOSE 3000/tcp

CMD ["node", "server/Server.js"]

# docker build -t darkdragon/livepeermetrics .
# docker run -d --name livemongodb mongo:latest
# docker run --link livemongodb:mongodb -p 0.0.0.0:3000:3000/tcp --name livemetrics darkdragon/livepeermetrics

