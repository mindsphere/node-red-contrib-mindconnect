# node-red-contrib-mindconnect

![](https://img.shields.io/docker/pulls/mindconnect/node-red-contrib-mindconnect.svg?style=flat)

## Node-RED Agent for the MindConnect API

These docker images are based on the [Node-RED-Docker](https://hub.docker.com/r/nodered/node-red-docker/) image and provide the preinstalled [node-red-contib-mindconnect](https://github.com/mindsphere/node-red-contrib-mindconnect) node for your convinience.

## Processor Architecture

The images are provided for X86 and ARM Processor Architectures (e.g. Raspberry Pi...)

## Tags:

- **latest** : latest state of the master branch on [GitHub](https://github.com/mindsphere/node-red-mindconnect) for X86 processor architecture.

- **arm-latest** : latest state of the mater branch on [GitHub](https://github.com/mindsphere/node-red-mindconnect) for ARM processor architecture. 

- **x.x.x** : image containing the x.x.x. version of the node-red-contib-mondconnect agents for X86. 
- **arm-x.x.x** : image containing the x.x.x. version of the node-red-contib-mondconnect agents for ARM.

``` bash
docker pull mindconnect/node-red-contrib-mindconnect #pulls the latest image for x86 architecture
docker pull mindconnect/node-red-contrib-mindconnect:arm-latest # pulls the latest image for ARM architecture
```

## Using the images

Running the image with Node-RED avaialble at : http://localhost:1880

``` bash
 docker run -it --name mind-red -p 1880:1880 mindconnect/node-red-contrib-mindconnect  
```

Run the container as a service, keeping the state on the host in the /DATA and /DATA/.mc directory , behind a http proxy running at http://192.168.0.1

``` bash
docker run -dit --name mind-red-service -p 1880:1880 -v /DATA:/data -v /DATA/mc:/usr/src/node-red/.mc --restart unless-stopped -e HTTP_PROXY=http://192.168.0.1 mindconnect/node-red-contrib-mindconnect
```

## Legal Notice

This image is based on the [Node-RED-Docker](https://hub.docker.com/r/nodered/node-red-docker/) docker image.

Node-RED is a project of the [JS Foundation](http://js.foundation).
It was created by [IBM Emerging Technology](https://www.ibm.com/blogs/emerging-technology/).
Copyright JS Foundation and other contributors  http://js.foundation under the [Apache License](https://github.com/node-red/node-red/blob/master/LICENSE) 