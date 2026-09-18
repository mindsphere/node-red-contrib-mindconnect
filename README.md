# node-red-contrib-mindconnect

> [!WARNING]
> **v4: migrated Insights Hub tenants only.**
> Version 4 supports tenants migrated to the `*.siemens.app` application URL scheme.
> **If your tenant still uses `*.mindsphere.io` application URLs, stay on v3. Do not upgrade to v4.**
> This is v4 - verified against a migrated (`*.siemens.app`) tenant. If your tenant is still on
> `*.mindsphere.io`, install the v3 release instead (`npm install @mindconnect/node-red-contrib-mindconnect@3`).

## Node-RED Agent for the Insights Hub MindConnect API

<!-- markdownlint-disable MD033 -->
<img src="images/mindconnect-node-red-logo.svg" alt="@mindconnect/node-red-contrib-mindconnect" width="300px"/>
<!-- markdownlint-enableMD033 -->

This node enables the Node-RED users to upload timeseries, files and events to Insights Hub.
This project has started as a community effort at Siemens AG and is now available for general use.

[![Build](https://github.com/mindsphere/node-red-contrib-mindconnect/actions/workflows/build.yml/badge.svg)](https://github.com/mindsphere/node-red-contrib-mindconnect/actions/workflows/build.yml) [![The MIT License](https://img.shields.io/badge/license-MIT-009999.svg?style=flat)](./LICENSE.md)
[![npm](https://img.shields.io/npm/v/@mindconnect/node-red-contrib-mindconnect/latest.svg?style=flat)](https://www.npmjs.com/package/@mindconnect/node-red-contrib-mindconnect) ![downloads](https://img.shields.io/npm/dw/@mindconnect/node-red-contrib-mindconnect.svg?colorB=009999)
[![Documentation](https://img.shields.io/badge/Insights%20Hub-documentation-%23009999.svg)](https://developer.siemens.com/industrial-iot-open-source/node-red-contrib-mindconnect/index.html)
[![Forum](https://img.shields.io/badge/Insights%20Hub-community-%23009999.svg)](https://community.plm.automation.siemens.com/t5/Developer-Space/bd-p/MindSphere-platform-forum)

The node is written in typescript/javascript without any native dependencies so it should work beside x86 also on other platforms (e.g. on raspberry pi, IoT2000 etc, you just have to have Node-RED installed).

## Installing the node

For legacy tenants using `*.mindsphere.io` application URLs, explicitly select v3:

```bash
# change to your ~./node-red/ folder
cd ~/.node-red/
npm install @mindconnect/node-red-contrib-mindconnect@3
```

The v4 release is for migrated tenants using application URLs such as
`<customerTenantId>-<appName>-<coreTenantId>.<region>.siemens.app`.
Confirm your tenant's migration status before selecting a major version; do not rewrite onboarding URLs manually.

## Node-RED - Manage Palette Installation

You can install the node also via the Manage palette feature in the Node-RED administration UI.
**Legacy tenants must keep v3 installed and must not accept a v4 upgrade.**
If the palette does not offer a version choice, use the explicit v3 installation command above.

![palette](images/install_palette.png)

### FAQ

- install to the .node-red folder if you have installed node-red globally
- install to the userDir directory if you have custom userDir
- make sure that your nodejs version is relatively current

## How to use the Node-RED node

Since version 3.9.0 it is possible to completely configure the agent from Node-RED. You will only need the initial Boarding configuration from the Insights Hub UI.

### Step 0: Create (at least) one asset and one agent in Insights Hub

- Create an asset in Asset Manager for your data
- Create an agent of the type MindConnectLib [core.mclib] and store the agent.

### Step 1: Get the initial agent configuration from Insights Hub Asset Manager

You can choose between:

- **RSA_3072** public/private key pair (3072bit) for enhanced security which requires more computing power on the devices and
- **SHARED_SECRET** shared key (256bit) for lightweight devices.

If you want to use RSA_3072 you will have to create a 3072bit key for your device, eg. with openssl:

```bash
openssl genrsa -out private.key 3072
```

There is no additional configuration required for SHARED_SECRET security profile.

![boarding configuration](images/boarding-configuration.png)

### Step 2: Copy the agent onboarding information (and if necessary the RSA 3072 private key) to the node and deploy the flow

Copy the agent onboarding information and optionally the RSA_3072 private key to the node and deploy the flow.

![implementation](images/configured-node.png)

### Step 3: Press the agent configuration button and select the target asset

The most common agent configuration setup is to have a 1:1 mapping between the Node-RED agent which is delivering the data and your target
Insights Hub Asset. If this type of configuration is sufficient for your use case you just have to click on the asset to which you want to map the data in the asset list. (you can use the filter asset listbox to quickly find your asset)

![implementation](images/automatic-configuration.png)

The node will automatically configure all necessary data sources and mapping for you. If you need a more complex setup, just click on the **Insights Hub Configuration Dialog** button which will lead you to the configuration dialog in Insights Hub, where you can create more complex configurations and mappings.

![implementation](images/mindsphere-configuration.png)

### Step 4: Create and deploy the flow and send data

You can use the node to send timeseries, bulk timeseries, events and files to Insights Hub. The templates for the input messages are listed
below, but you can also just use the **Agent Information** button which will let you copy the corresponding template to clipboard.

![implementation](images/infodialog-templates.png)

#### Send data points

The node requires json objects as input in following format (e.g. from a function node)

```javascript
const values = [
    { dataPointId: "1000000000", qualityCode: "1", value: "42" },
    { dataPointId: "1000000001", qualityCode: "1", value: "33.7" },
    { dataPointId: "1000000003", qualityCode: "1", value: "45.76" }
];

msg._time = new Date();
msg.payload = values;
return msg;
```

The node will validate if the data is valid for your agent configuration. his feature can be switched off in the settings but it is not recommended to do so.

#### Send data points in bulk

The node requires json objects as input in following format (e.g. from a function node if you want to use bulk upload)

```javascript
const values = [
    {
        timestamp: "2018-11-09T07:46:36.699Z",
        values: [
            { dataPointId: "1000000000", qualityCode: "1", value: "42" },
            { dataPointId: "1000000001", qualityCode: "1", value: "33.7" },
            { dataPointId: "1000000003", qualityCode: "1", value: "45.76" }
        ]
    },
    {
        timestamp: "2018-11-08T07:46:36.699Z",
        values: [
            { dataPointId: "1000000000", qualityCode: "1", value: "12" },
            { dataPointId: "1000000001", qualityCode: "1", value: "13.7" },
            { dataPointId: "1000000003", qualityCode: "1", value: "15.76" }
        ]
    }
];

msg.payload = values;
return msg;
```

**Note:** All Insights Hub timestamps must be in the **ISO format** (use `toISOString()` function).

#### Send events

The node requires json objects as input in following format (e.g. from a function node). You can send an event to any asset you have access to in your tenant. Just use the asset id in the entityid.

```javascript
msg.payload = {
    entityId: "d72262e71ea0470eb9f880176b888938", // optional, use assetid if you want to send event somewhere else :)
    sourceType: "Agent",
    sourceId: "application",
    source: "Meowz",
    severity: 30, // 0-99 : 20:error, 30:warning, 40: information
    description: "Event sent at " + new Date().toISOString(),
    timestamp: new Date().toISOString(),
    additionalproperty1: "123",
    additionalproperty2: "456"
};
return msg;
```

If you are using the custom events instead of Insights Hub standard events please include the following switch in the message.

```javascript
msg._customEvent=true;
```

#### File Upload

The node requires json objects as input in following format (e.g. from a function node). You can upload file to any asset you have access to in your tenant. Just use the asset id in the entityid.

```javascript
msg.payload = {
    entityId: "d72262e71ea0470eb9f880176b888938", //optional (per default files are uploaded to the agent)
    fileName: "digitaltwin.png", // you can also pass an instance of a Buffer
    fileType: "image/png", //optional, it is automatically determined if there is no fileType specified
    filePath: "images/digitaltwin.png", // required if you are using buffer instead of the file name
    description: "testfile"
};
return msg;
```

If the experimental chunking feature is on, the files which are larger than 8MB will be uploaded in 8 MB Chunks.

#### Data Lake File Upload

Precondition for data lake upload is that [Insights Hub Integrated Data Lake](https://www.dex.siemens.com/mindsphere/applications/integrated-data-lake) is purchased and write-enabled.
The node requires json objects as input in following format (e.g. from a function node).

```javascript
// Preconditions : data-lake is purchased and enabled for writing (see mc data-lake --mode write  CLI command)
//
// Agents can only upload files to a path which is prefixed with their agent id
// The MindConnect Node will apply this prefix automatically to the dataLakeFileUpload Path
// You can pass either a javascript buffer or path to file in the dataLakeFile property for upload
// The subTenantId can be optionally added to the messsage

const dataLakeFileInfo = {
  "dataLakeFile": "my/path/to/file.txt",
  "dataLakeFilePath": "uploads/file.txt"
};

// Uncomment the next code line if you just want to generate an upload url (in msg._signedUrl) 
// without actually uploading the file
// msg._ignorePayload = true;

msg.payload = dataLakeFileInfo;
return msg;
```

Please note:

- Agents can only upload files to a path which is prefixed with their agent id
- The MindConnect Node will apply this prefix automatically to the dataLakeFileUpload Path
- You can pass either a javascript buffer or path to file in the dataLakeFile property for upload
- The subTenantId can be optionally added to the messsage

#### Reading Asset Information

You can read the data (e.g. static asset variables, or full asset information) from Insights Hub using the following message. This can be used to implement a "digital shadow/digital twin" pattern, where the change in the Insights Hub variables is reflected to the real world asset. See the [documentation](https://developer.siemens.com/industrial-iot-open-source/node-red-contrib-mindconnect/index.html) for a full example.

```javascript
msg.payload = {
  "assetId": "{assetId}",
  "includeShared": false,
  "propertyNames": []
};

return msg;
```

You can reduce the number of items in payload by specifying list of properties to include in the message: e.g.
`propertyNames: ["variables"] or ["location"]`

#### Executing custom functions using Insights Hub javascript/typescript SDK

The node can be used to execute a complex script which uses [Insights Hub javascript/typescript SDK](https://opensource.mindsphere.io/docs/mindconnect-nodejs/sdk/index.html). The node will create an asyncronous function with one parameter (sdk) and the specified function body and execute it. You can only call the Insights Hub APIs which allow agent authorization.

```javascript
msg.payload = {
    function: `
const assetManagement = sdk.GetAssetManagementClient();
const asset = await assetManagement.GetAsset('{assetId}');
return asset;
`};
           
return msg;
```

#### Error handling in the flows

The node can be configured to retry all Insights Hub operations (1-10 times, with delay of time \* 300ms before the next try)
If you need more complex flows, the node also returns the

```javascript
msg._mindsphereStatus; // OK on success othervise error
msg._error; // The timestamped error message
```

properties which can be used to create more complex flows. (e.g. in the flow below, the unrecoverable errors are written in error.log file and the failed data is stored in backupdata.log file)

Existing message properties such as `msg._mindsphereStatus` and `msg._includeMindSphereToken`
retain their names for flow compatibility. Documentation URLs and historical screenshots may also retain the former branding.

![errorhandling](images/errorhandling.png)

## JWT Token Generation for SouthBound APIs

The node can be used to generate authentication tokens which you can use to call your own custom southbound APIs.
The msg.headers will have an Insights Hub Authorization JWT.

```javascript
msg._includeMindSphereToken=true;
```

if you just want to get the token without sending any data to Insights Hub

```javascript
msg._ignorePayload=true;
```

Treat tokens as you would any other credentials.

## Control Topic and Status Messages

The version 3.11.0 introduces two new features - the status message which is displayed on the node (and/or emited on the `control` topic dependent on the Emit Control topic) after either:

- the maximal number of parallel requests (**Async Requests**) has been exceeded or
- the maximal wait time (**Async Duration**) has been reached.

The following image illustrates the function of the new settings:

![image](./images/internal-array.png)

The `payload` on the `control` topic with the status information looks like this:

```javascript
{
    requests: number;
    success: number;
    pending: number;
    errors: number;
}
```

This information can be used to manage for example a queue node before the mindconnect node to regulate the flow of
the messages. See the [documentation](https://developer.siemens.com/industrial-iot-open-source/node-red-contrib-mindconnect/index.html) for examples.

## Demo flows

[![Documentation](https://img.shields.io/badge/Insights%20Hub-documentation-%23009999.svg)](https://developer.siemens.com/industrial-iot-open-source/node-red-contrib-mindconnect/index.html)

See the [documentation](https://developer.siemens.com/industrial-iot-open-source/node-red-contrib-mindconnect/index.html) for demo flow examples.

## Securing API Endpoints

The corresponding API calls for reading the data source configuration and mappings in Agent Configuration and Agent Information dialog require that the user has:

```mindconnect.read```

permission. The automatic configuration requires

```mindconnect.write```

permission.

## Troubleshooting

If you have problems with your agent:

1. Stop the agent.
2. Move or delete the content of the .mc folder (the json files with configuration and authentication settings).
3. Offboard the agent.
4. Create new settings for the mindconnect library.
5. copy the new settings to the node.

### Reseting the agent settings from version 3.7.0

Since version 3.7.0. it is possible to delete the content of the .mc/agentconfig.json file and the agent settings directly from the node.

Press on the "delete local configuration" :wastebucket: button on the node, confirm the dialog and redeploy the node.

![delete local settings](images/deletelocal.png)

If you are having problems, it is a good idea to restart the Node-RED runtime completely.

## Generating the documentation

You can always generate the current HTML documentation by running the command below.

```bash
#this generates a docs/ folder the with full documentation of the library.
npm run doc
```

## Proxy support

Set the http_proxy or HTTP_PROXY environment variable if you need to connect via proxy.

```bash
# set http proxy environment variable if you are using e.g. fiddler on the localhost.

export HTTP_PROXY=http://localhost:8888
```

## How to setup development environment

```bash
# create a directory ../devnodes
cd ..
mkdir devnodes
cd devnodes
# this registers your development directory with node red
npm link ../node-red-contrib-mindconnect

# after that in you can start developing with
cd ../node-red-contrib-mindconnect

npm run start-dev

# your node red flows will be stored in the ../devnodes directory
```

## Legal

This project has been released under an [Open Source license](./LICENSE.md). The release may include and/or use APIs to Siemens’ or third parties’ products or services. In no event shall the project’s Open Source license grant any rights in or to these APIs, products or services that would alter, expand, be inconsistent with, or supersede any terms of separate license agreements applicable to those APIs. “API” means application programming interfaces and their specifications and implementing code that allows other software to communicate with or call on Siemens’ or third parties’ products or services and may be made available through Siemens’ or third parties’ products, documentations or otherwise.
