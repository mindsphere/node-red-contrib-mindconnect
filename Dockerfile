FROM nodered/node-red

# build and package 

COPY --chown=node-red:node-red *.tgz /data
USER node-red
WORKDIR /data
RUN cp /usr/src/node-red/package.json .
RUN npm install --no-audit --no-update-notifier --no-fund --save --save-prefix=~ --production --engine-strict  `ls mindconnect-node-red-contrib-*.tgz`
WORKDIR /usr/src/node-red

