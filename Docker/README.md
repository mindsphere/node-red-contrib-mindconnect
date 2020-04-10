# node-red-contrib-mindconnect

![pulls](https://img.shields.io/docker/pulls/mindconnect/node-red-contrib-mindconnect.svg?style=flat)

## Node-RED Agent for the MindConnect API

## Images supporting multiple processor architectures (from 3.7.0)

These docker images are based on the [Node-RED-Docker](https://hub.docker.com/r/nodered/node-red/) image (Node-RED version 1.0.*) and provide the preinstalled [node-red-contib-mindconnect](https://github.com/mindsphere/node-red-contrib-mindconnect) node.

``` bash

#pull the latest image, docker runtime will choose the appropriate architecture.

docker pull mindconnect/node-red-contrib-mindconnect
```

### Tags

- **latest** : latest state of the master branch on [GitHub](https://github.com/mindsphere/node-red-mindconnect) for multiple processor architecture.

## Deprectated images supporting x86 or ARM architectures (until-3.6.2)

These docker images are based on the [Node-RED-Docker](https://hub.docker.com/r/nodered/node-red-docker/) image (Node-RED version 0.20.*) and provide the preinstalled [node-red-contib-mindconnect](https://github.com/mindsphere/node-red-contrib-mindconnect) node.

### Deprecated Tags

- **arm-latest** : latest state of the mater branch on [GitHub](https://github.com/mindsphere/node-red-mindconnect) for ARM processor architecture. (deprecated)
- **x.x.x** : image containing the x.x.x. version of the node-red-contib-mondconnect agents for X86. (deprecated before 3.7.0)
- **arm-x.x.x** : image containing the x.x.x. version of the node-red-contib-mondconnect agents for ARM. (deprecated)

## Using the images

Running the image with Node-RED avaialble at : [http://localhost:1880](http://localhost:1880)

``` bash
 docker run -it --name mind-red -p 1880:1880 mindconnect/node-red-contrib-mindconnect  
```

Run the container as a service, keeping the state on the host in the /DATA and /DATA/.mc directory , behind a http proxy running at [http://192.168.0.1](http://192.168.0.1)

``` bash
docker run -dit --name mind-red-service -p 1880:1880 -v /DATA:/data:rw -v /DATA/mc:/usr/src/node-red/.mc:rw --restart unless-stopped -e HTTP_PROXY=http://192.168.0.1 mindconnect/node-red-contrib-mindconnect
```

## Important docker image user change - for users upgrading from versions before 3.7.0 to current versions of the image

If you are using host directories for docker persistence and you are upgrading from previous version of docker images (which were based on 0.20.* version of node red) you will have to ensure that any existing data and .mc directory has the correct ownership.
As of 1.0 this needs to be 1000:1000. This can be forced by running the command

```bash
sudo chown -R 1000:1000 path/to/your/node-red/data
sudo chown -R 1000:1000 path/to/your/node-red/data/.mc
```

on the host system.

in example above:

```bash
sudo chown -R 1000:1000 /DATA
sudo chown -R 1000:1000 /DATA/.mc
```

Consider using docker named volumes instead. <https://docs.docker.com/storage/volumes/>

This is necessary because of the change in the base docker image of node-red. See also <https://nodered.org/docs/getting-started/docker>

## Siemens API Notice

This project has been released under an [Open Source license](./LICENSE.md). The release may include and/or use APIs to Siemens’ or third parties’ products or services. In no event shall the project’s Open Source license grant any rights in or to these APIs, products or services that would alter, expand, be inconsistent with, or supersede any terms of separate license agreements applicable to those APIs. “API” means application programming interfaces and their specifications and implementing code that allows other software to communicate with or call on Siemens’ or third parties’ products or services and may be made available through Siemens’ or third parties’ products, documentations or otherwise.

## Node-RED Base Image

This image is based on the [Node-RED-Docker](https://hub.docker.com/r/nodered/node-red-docker/) docker image.

Node-RED is a project of the [JS Foundation](http://js.foundation).
It was created by [IBM Emerging Technology](https://www.ibm.com/blogs/emerging-technology/).
Copyright JS Foundation and other contributors  [http://js.foundation](http://js.foundation) under the [Apache License](https://github.com/node-red/node-red/blob/master/LICENSE)
