FROM nodered/node-red

# build and package 
COPY --chown=node-red *.tgz /usr/src/node-red
WORKDIR /usr/src/node-red
RUN npm install `ls mindconnect-node-red-contrib*.tgz`

