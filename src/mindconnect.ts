// Copyright Siemens AG, 2017

import { BaseEvent, MindConnectAgent, TimeStampedDataPoint } from '@mindconnect/mindconnect-nodejs';
import * as ajv from "ajv";
import * as path from "path";

interface IFileInfo {
    entityId: string,
    fileName: string,
    fileType: string,
    description?: string
}

export = function (RED: any): void {

    const eventSchema = {
        "type": "object",
        "properties": {
            "entityId": {
                "$id": "/properties/entityId",
                "type": "string",
                "title": "The Entityid Schema ",
                "default": "",
                "examples": [
                    "`12"
                ],
                "minLength": 32,
                "maxLength": 32,
                "pattern": "^[A-Fa-f0-9]*$"
            },
            "timestamp": {
                "$id": "/properties/timestamp",
                "type": "string",
                "format": "date-time",
                "title": "The Timestamp Schema ",
                "default": "",
                "examples": [
                    "2018-06-16T18:38:07.293Z"
                ]
            },
            "sourceType": {
                "$id": "/properties/sourceType",
                "type": "string",
                "title": "The Sourcetype Schema ",
                "default": "",
                "examples": [
                    "Event"
                ]
            },
            "sourceId": {
                "$id": "/properties/sourceId",
                "type": "string",
                "title": "The Sourceid Schema ",
                "default": "",
                "examples": [
                    "application"
                ]
            },
            "source": {
                "$id": "/properties/source",
                "type": "string",
                "title": "The Source Schema ",
                "default": "",
                "examples": [
                    "Meowz"
                ]
            },
            "severity": {
                "$id": "/properties/severity",
                "type": "integer",
                "title": "The Severity Schema ",
                "default": 0,
                "examples": [
                    20
                ]
            },
            "description": {
                "$id": "/properties/description",
                "type": "string",
                "title": "The Description Schema ",
                "default": "",
                "examples": [
                    ""
                ]
            }
        },
        "required": [
            "timestamp",
            "severity",
            "description",
            "source",
            "sourceId",
            "sourceType"
        ]
    };


    function eventSchemaValidator(): ajv.ValidateFunction {
        const schemaValidator = new ajv({ $data: true, allErrors: true });
        return schemaValidator.compile(eventSchema);
    }

    const fileInfoSchema = {
        "$id": "http://example.com/example.json",
        "type": "object",
        "properties": {
            "entityId": {
                "$id": "/properties/entityId",
                "type": "string",
                "title": "The Entityid Schema ",
                "default": "",
                "minLength": 32,
                "maxLength": 32,
                "pattern": "^[A-Fa-f0-9]*$"
            },
            "fileName": {
                "$id": "/properties/sourceType",
                "type": "string",
                "title": "The Sourcetype Schema ",
                "default": ""
            },
            "description": {
                "$id": "/properties/description",
                "type": "string",
                "title": "The Description Schema ",
                "default": "",
                "examples": [
                    ""
                ]
            }
        },
        "required": [
            "fileName",
            "description"
        ]
    };

    function fileInfoValidator(): ajv.ValidateFunction {
        const schemaValidator = new ajv({ $data: true, allErrors: true });
        return schemaValidator.compile(fileInfoSchema);
    }

    const bulkUploadSchema = {
        "type": "array",
        "items": {
            "type": "object",
            "required": ["timestamp", "values"],
            "properties": {
                "timestamp": {
                    "type": "string"
                },
                "values": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": [],
                        "properties": {
                            "dataPointId": {
                                "type": "string"
                            },
                            "qualityCode": {
                                "type": "string"
                            },
                            "value": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        }
    };

    function bulkUploadValidator(): ajv.ValidateFunction {
        const schemaValidator = new ajv({ $data: true, allErrors: true });
        return schemaValidator.compile(bulkUploadSchema);
    }

    const timeSeriesSchema = {
        "type": "array",
        "items": {
            "type": "object",
            "required": ["dataPointId", "qualityCode", "value"],
            "properties": {
                "dataPointId": {
                    "type": "string"
                },
                "qualityCode": {
                    "type": "string"
                },
                "value": {
                    "type": "string"
                }
            }
        }
    };

    function timeSeriesValidator(): ajv.ValidateFunction {
        const schemaValidator = new ajv({ $data: true, allErrors: true });
        return schemaValidator.compile(timeSeriesSchema);
    }


    function nodeRedMindConnectAgent(config: any) {
        RED.nodes.createNode(this, config);
        let node = this;

        const sleep = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

        const retry = async (n, func, operation) => {
            let error;
            for (let i = 0; i < n; i++) {
                try {
                    if (i > 0) {
                        node.status({ fill: "yellow", shape: "ring", text: `${operation}: retrying ${i + 1} of ${n}` });
                        node.log(`${operation}: retrying ${i + 1} of ${n}`);
                        await sleep(i * 300);
                    }
                    return await func();
                } catch (err) {
                    error = err;
                }
            }
            throw error;
        };


        try {
            let agentConfig = JSON.parse(config.agentconfig);
            let agent = new MindConnectAgent(agentConfig);
            node.agent = agent;

            if (agent.GetProfile() === "RSA_3072") {

                config.privatekey = config.privatekey.trim();

                if (!config.privatekey.toString().startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
                    throw new Error("Invalid certificate it has to start with : -----BEGIN RSA PRIVATE KEY-----");
                }

                if (!config.privatekey.endsWith("\n")) {
                    config.privatekey += "\n";
                }

                if (!config.privatekey.toString().endsWith("-----END RSA PRIVATE KEY-----\n")) {
                    throw new Error("Invalid certificate it has to end with : -----END RSA PRIVATE KEY-----\n");
                }

                node.agent.SetupAgentCertificate(config.privatekey.toString());
            }

        } catch (error) {
            node.error(error);
            node.status({ fill: "red", shape: "ring", text: `Error occured ${error}` });
        }


        this.on("input", msg => {
            (async () => {

                try {
                    const agent = <MindConnectAgent>node.agent;
                    node.status({});

                    if (!node.agent) {
                        node.error(`Error creating mindconnect agent occured. Is  ${process.cwd()} directory writable? Have you setup the certificate?`, msg);
                        return;
                    }

                    if (!agent.IsOnBoarded() || (msg._forceOnBoard && msg._forceOnBoard === true)) {
                        node.status({ fill: "grey", shape: "dot", text: `onboarding` });
                        await retry(config.retry, () => agent.OnBoard(), "OnBoard");
                    }

                    if (!agent.HasDataSourceConfiguration() || (msg._forceGetConfig && msg._forceGetConfig === true)) {
                        node.status({ fill: "grey", shape: "dot", text: `getting configuration` });
                        node.model = await retry(config.retry, () => agent.GetDataSourceConfiguration(), "GetConfiguration");
                    }

                    let timestamp = msg._time ? msg._time : new Date();

                    if (!(timestamp instanceof Date)) {
                        throw new Error(`The time stamp in msg._time must be a javascript Date() and not ${timestamp.toString()}.`);
                    }

                    node.status({ fill: "grey", shape: "dot", text: `posting data` });
                    if (!msg.payload) {
                        throw new Error("you have to have a payload in your msg.payload to post the data!");
                    }

                    const eventValidator = eventSchemaValidator();
                    const fileValidator = fileInfoValidator();
                    const bulkValidator = bulkUploadValidator();
                    const tsValidator = timeSeriesValidator();

                    if (await eventValidator(msg.payload)) {

                        node.status({ fill: "grey", shape: "dot", text: `recieved event` });
                        const event = <BaseEvent>msg.payload;
                        if (!event.entityId) {
                            event.entityId = agent.ClientId();
                        }
                        const result = await retry(config.retry, () => agent.PostEvent(event, timestamp, config.validateevent), "PostEvent");
                        node.log(result);
                        node.status({ fill: "green", shape: "dot", text: `Posted last event at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);
                    } else if (await fileValidator(msg.payload)) {

                        const fileInfo = <IFileInfo>msg.payload;
                        node.status({ fill: "grey", shape: "dot", text: `recieved fileInfo ${fileInfo.fileName}` });

                        const result = await retry(config.retry, () => agent.Upload(fileInfo.fileName, fileInfo.fileType, fileInfo.description, config.chunk, fileInfo.entityId), "FileUpload");
                        node.log(result);
                        node.status({ fill: "green", shape: "dot", text: `Uploaded file at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);

                    } else if (await bulkValidator(msg.payload)) {

                        node.status({ fill: "grey", shape: "dot", text: `recieved ${msg.payload.length} data points for bulk upload ` });
                        const result = await retry(config.retry, () => agent.BulkPostData(<TimeStampedDataPoint[]>msg.payload, config.validate), "BulkPost");
                        node.log(result);
                        node.status({ fill: "green", shape: "dot", text: `Posted last message at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);

                    } else if (await tsValidator(msg.payload)) {

                        node.status({ fill: "grey", shape: "dot", text: `recieved data points` });
                        const result = await retry(config.retry, () => agent.PostData(msg.payload, timestamp, config.validate), "PostData");
                        node.log(result);
                        node.status({ fill: "green", shape: "dot", text: `Posted last message at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);
                    } else {
                        const eventErrors = eventValidator.errors || [];
                        const fileErrors = fileValidator.errors || [];
                        const bulkErrors = bulkValidator.errors || [];
                        const timeSeriesErrors = tsValidator.errors || [];

                        let errorString = "the payload was not recognized as an event, file or datapoints. See node help for proper msg.payload.formats";
                        console.log(eventErrors, fileErrors, bulkErrors, timeSeriesErrors);

                        errorString += "\nEvent Errors:\n";
                        errorString += JSON.stringify(eventErrors, null, 2);
                        errorString += "\nFile Errors:\n";
                        errorString += JSON.stringify(fileErrors, null, 2);
                        errorString += "\nBulk Errors:\n";
                        errorString += JSON.stringify(bulkErrors, null, 2);
                        errorString += "\nTimeSeries Errors:\n";
                        errorString += JSON.stringify(timeSeriesErrors, null, 2);

                        throw new Error(errorString);
                    }

                } catch (error) {
                    node.error(error);
                    msg._mindsphereStatus = "Error";
                    node.send(msg);
                    node.status({ fill: "red", shape: "dot", text: `${error}` });
                }
            })();
            return;
        });
    }

    RED.nodes.registerType("mindconnect", nodeRedMindConnectAgent);

    RED.httpAdmin.get('/ajv.min.js', function (req, res) {
        const filename = require.resolve("ajv/dist/ajv.min.js");
        res.sendFile(filename);
    });

    RED.httpAdmin.get('/mindsphere.css', function (req, res) {
        const filename = path.join(__dirname, 'mindsphere.css');
        res.sendFile(filename);
    });
};

