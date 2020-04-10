FROM nodered/node-red

# build and package 
RUN mkdir /tmp/install
WORKDIR /tmp/install
COPY --chown=node-red package*.json ./
COPY --chown=node-red . . 
RUN npm install


RUN npm pack
RUN cp *.tgz /usr/src/node-red
RUN cd .. && rm -rf /tmp/install

WORKDIR /usr/src/node-red
RUN npm install `ls mindconnect-node-red-contrib*.tgz`

