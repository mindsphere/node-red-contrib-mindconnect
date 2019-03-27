// Copyright Siemens AG, 2017

import * as mindconnectNodejs from "@mindconnect/mindconnect-nodejs";
import * as path from "path";
import {
    bulkUploadValidator,
    eventSchemaValidator,
    fileInfoValidator,
    IConfigurationInfo,
    IFileInfo,
    remoteConfigurationValidator,
    timeSeriesValidator
} from "./mindconnect-schema";
import { configureAgent, copyConfiguration, reloadFlow, retryWithNodeLog, sleep } from "./mindconnect-utils";

export = function(RED: any): void {
    function nodeRedMindConnectAgent(config: any) {
        RED.nodes.createNode(this, config);
        copyConfiguration(this, config);
        let node = this;

        configureAgent(node);

        this.on("input", msg => {
            (async () => {
                try {
                    const agent = <mindconnectNodejs.MindConnectAgent>node.agent;
                    node.status({});
                    const rcValidator = remoteConfigurationValidator();

                    if (await rcValidator(msg.payload)) {
                        node.status({ fill: "blue", shape: "dot", text: "received remote configuration..." });
                        await sleep(300);
                        node.status({
                            fill: "yellow",
                            shape: "dot",
                            text: "the flow will restart in 1 second..."
                        });
                        await sleep(1000);
                        const newConfiguration = msg.payload as IConfigurationInfo;
                        await reloadFlow(node, RED.settings, newConfiguration);
                        return msg;
                    }

                    if (!node.agent) {
                        node.error(
                            `Error creating mindconnect agent occured. Is  ${process.cwd()} directory writable? Have you setup the certificate?`,
                            msg
                        );
                        return;
                    }

                    if (!agent.IsOnBoarded() || (msg._forceOnBoard && msg._forceOnBoard === true)) {
                        node.status({ fill: "grey", shape: "dot", text: `onboarding` });
                        await retryWithNodeLog(node.retry, () => agent.OnBoard(), "OnBoard", node);
                    }

                    if (!agent.HasDataSourceConfiguration() || (msg._forceGetConfig && msg._forceGetConfig === true)) {
                        node.status({ fill: "grey", shape: "dot", text: `getting configuration` });
                        node.model = await retryWithNodeLog(
                            node.retry,
                            () => agent.GetDataSourceConfiguration(),
                            "GetConfiguration",
                            node
                        );
                    }

                    let timestamp = msg._time ? msg._time : new Date();

                    if (!(timestamp instanceof Date)) {
                        throw new Error(
                            `The time stamp in msg._time must be a javascript Date() and not ${timestamp.toString()}.`
                        );
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
                        const event = <mindconnectNodejs.BaseEvent>msg.payload;
                        if (!event.entityId) {
                            event.entityId = agent.ClientId();
                        }
                        const result = await retryWithNodeLog(
                            node.retry,
                            () => agent.PostEvent(event, timestamp, node.validateevent),
                            "PostEvent",
                            node
                        );
                        node.log(`Posted last event at ${timestamp}`);
                        node.status({ fill: "green", shape: "dot", text: `Posted last event at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);
                    } else if (await fileValidator(msg.payload)) {
                        const fileInfo = <IFileInfo>msg.payload;
                        node.status({ fill: "grey", shape: "dot", text: `recieved fileInfo ${fileInfo.fileName}` });

                        const result = await retryWithNodeLog(
                            node.retry,
                            () =>
                                agent.Upload(
                                    fileInfo.fileName,
                                    fileInfo.fileType,
                                    fileInfo.description,
                                    node.chunk,
                                    fileInfo.entityId
                                ),
                            "FileUpload",
                            node
                        );
                        node.log(`Uploaded file at ${timestamp}`);
                        node.status({ fill: "green", shape: "dot", text: `Uploaded file at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);
                    } else if (await bulkValidator(msg.payload)) {
                        node.status({
                            fill: "grey",
                            shape: "dot",
                            text: `recieved ${msg.payload.length} data points for bulk upload `
                        });
                        const result = await retryWithNodeLog(
                            node.retry,
                            () =>
                                agent.BulkPostData(
                                    <mindconnectNodejs.TimeStampedDataPoint[]>msg.payload,
                                    node.validate
                                ),
                            "BulkPost",
                            node
                        );
                        node.log(`Posted last bulk message at ${timestamp}`);
                        node.status({ fill: "green", shape: "dot", text: `Posted last bulk message at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);
                    } else if (await tsValidator(msg.payload)) {
                        node.status({ fill: "grey", shape: "dot", text: `recieved data points` });

                        const result = await retryWithNodeLog(
                            node.retry,
                            () => agent.PostData(msg.payload, timestamp, node.validate),
                            "PostData",
                            node
                        );
                        node.log(`Posted last message at ${timestamp}`);
                        node.status({ fill: "green", shape: "dot", text: `Posted last message at ${timestamp}` });
                        msg._mindsphereStatus = result ? "OK" : "Error";
                        node.send(msg);
                    } else {
                        const eventErrors = eventValidator.errors || [];
                        const fileErrors = fileValidator.errors || [];
                        const bulkErrors = bulkValidator.errors || [];
                        const timeSeriesErrors = tsValidator.errors || [];
                        const rcValidatorErrors = rcValidator.errors || [];

                        let errorString =
                            "the payload was not recognized as an event, file or datapoints. See node help for proper msg.payload.formats";

                        errorString += "\nEvent Errors:\n";
                        errorString += JSON.stringify(eventErrors, null, 2);
                        errorString += "\nFile Errors:\n";
                        errorString += JSON.stringify(fileErrors, null, 2);
                        errorString += "\nBulk Errors:\n";
                        errorString += JSON.stringify(bulkErrors, null, 2);
                        errorString += "\nTimeSeries Errors:\n";
                        errorString += JSON.stringify(timeSeriesErrors, null, 2);
                        errorString += "Configuration Errors:\n";
                        errorString += JSON.stringify(rcValidatorErrors, null, 2);

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

    RED.httpAdmin.get("/ajv.min.js", function(req, res) {
        const filename = require.resolve("ajv/dist/ajv.min.js");
        res.sendFile(filename);
    });

    RED.httpAdmin.get("/mindsphere.css", function(req, res) {
        const filename = path.join(__dirname, "mindsphere.css");
        res.sendFile(filename);
    });
};
