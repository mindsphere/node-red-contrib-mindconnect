FROM nodered/node-red-docker:rpi-v8
COPY Docker/ARM/qemu-arm-static /usr/bin

# Install the node from npm for ARM builds
WORKDIR /usr/src/node-red
RUN npm install @mindconnect/node-red-contrib-mindconnect@latest
