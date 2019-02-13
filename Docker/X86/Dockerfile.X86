FROM nodered/node-red-docker:v8

# build and package 
RUN mkdir /tmp/install
WORKDIR /tmp/install
COPY --chown=node-red package*.json ./
RUN npm install
COPY --chown=node-red . . 

RUN npm pack
RUN cp *.tgz /usr/src/node-red
RUN cd .. && rm -rf /tmp/install

WORKDIR /usr/src/node-red
RUN npm install `ls mindconnect-node-red-contrib*.tgz`

