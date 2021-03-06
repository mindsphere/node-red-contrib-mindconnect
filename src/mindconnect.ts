// Copyright Siemens AG, 2017

import { BaseEvent, MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import * as fs from "fs";
import * as path from "path";
import * as allSettled from "promise.allsettled";
import {
    actionSchemaValidator,
    bulkUploadValidator,
    dataLakeFileInfoValidator,
    eventSchemaValidator,
    fileInfoValidator,
    IConfigurationInfo,
    IDataLakeFileInfo,
    IFileInfo,
    remoteConfigurationValidator,
    timeSeriesValidator,
} from "./mindconnect-schema";
import {
    configureAgent,
    copyConfiguration,
    handleError,
    reloadFlow,
    retryWithNodeLog,
    sleep,
} from "./mindconnect-utils";

export = function (RED: any): void {
    function nodeRedMindConnectAgent(config: any) {
        RED.nodes.createNode(this, config);
        let node = this;
        copyConfiguration(this, config);

        try {
            const agentConfig = JSON.parse(config.agentconfig);
            if (agentConfig.action === "delete") {
                handleDeleteConfiguration(agentConfig);
                return;
            }
        } catch (err) {}

        configureAgent(node);

        let promises = [];
        let awaitPromises = false;

        allSettled.shim();

        this.on("close", () => {
            clearInterval(node.interval_id);
            clearInterval(node.await_id);
            node.log("cleared keep alive and async duration interval");
            node.status({});
        });

        this.on("input", (msg) => {
            (async () => {
                try {
                    const agent = <MindConnectAgent>node.agent;
                    const rcValidator = remoteConfigurationValidator();
                    if (await rcValidator(msg.payload)) {
                        return await reconfigureNode(msg);
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

                    if (!msg.payload) {
                        throw new Error("you have to have a payload in your msg.payload to post the data!");
                    }

                    const eventValidator = eventSchemaValidator();
                    const fileValidator = fileInfoValidator();
                    const bulkValidator = bulkUploadValidator();
                    const tsValidator = timeSeriesValidator();
                    const actionValidator = actionSchemaValidator();
                    const dataLakeValidator = dataLakeFileInfoValidator();

                    if (msg._includeMindSphereToken) {
                        msg.headers = { ...msg.headers, Authorization: `Bearer ${await agent.GetAgentToken()}` };
                        node.status({
                            fill: "green",
                            shape: "dot",
                            text: `propagating authentication token in msg.headers...`,
                        });

                        if (msg._ignorePayload) {
                            node.send(msg);
                            return;
                        }
                    }
                    if (await actionValidator(msg.payload)) {
                        if (msg.payload.action === "await") {
                            awaitPromises = true;
                        } else if (msg.payload.action === "renew") {
                            promises.push(renewToken(msg, agent, timestamp));
                        }
                    } else if ((await eventValidator(msg.payload)) || msg._customEvent === true) {
                        promises.push(sendEvent(msg, agent, timestamp));
                    } else if (await fileValidator(msg.payload)) {
                        promises.push(sendFile(msg, agent, timestamp));
                    } else if (await dataLakeValidator(msg.payload)) {
                        promises.push(sendFileToDataLake(msg, agent, timestamp));
                    } else if (await bulkValidator(msg.payload)) {
                        promises.push(sendBulkTimeSeriesData(msg, agent, timestamp));
                    } else if (await tsValidator(msg.payload)) {
                        promises.push(sendTimeSeriesData(msg, agent, timestamp));
                    } else {
                        let errorObject = extractErrorString(
                            eventValidator,
                            fileValidator,
                            bulkValidator,
                            tsValidator,
                            rcValidator,
                            actionValidator,
                            dataLakeValidator
                        );

                        promises.push(handleInputError(msg, errorObject, timestamp));
                    }

                    if (
                        (promises.length % node.parallel === 0 && promises.length > 0) ||
                        (promises.length > 0 && awaitPromises)
                    ) {
                        node.status({
                            fill: "blue",
                            shape: "dot",
                            text: `awaiting ${promises.length} parallel requests...`,
                        });
                        const results = (await allSettled(promises)) || [];

                        const fullfilled = results.length;
                        const rejected = results.filter((pr: any) => pr.value._mindsphereStatus === "Error").length;

                        node.log(
                            `Parallel requests status: ${fullfilled} finished with ${rejected} errors at ${timestamp}`
                        );
                        node.status({
                            fill: rejected === 0 ? "green" : "red",
                            shape: "dot",
                            text: `Parallel requests status: ${fullfilled} finished with ${rejected} errors at ${timestamp}`,
                        });

                        promises = [];
                        awaitPromises = false;
                    }
                } catch (error) {
                    handleError(node, msg, error);
                    promises = [];
                    awaitPromises = false;
                }
            })();
            return;
        });

        function handleDeleteConfiguration(agentConfig: any) {
            const fileName = path.resolve(`.mc/${agentConfig.clientId}.json`);
            try {
                fs.unlinkSync(fileName);
                node.status({ fill: "blue", shape: "dot", text: `deleted configuration file ${fileName}` });
            } catch (error) {
                node.error(error);
                node.status({ fill: "red", shape: "dot", text: `error deleting ${fileName}` });
            }

            node.on("input", () => {
                node.error("The node is not correctly configured!");
                node.status({ fill: "red", shape: "dot", text: `The node is not correctly configured!` });
            });
            return;
        }

        async function reconfigureNode(msg: any) {
            node.status({ fill: "blue", shape: "dot", text: "received remote configuration..." });
            await sleep(300);
            node.status({
                fill: "yellow",
                shape: "dot",
                text: "the flow will restart in 1 second...",
            });
            await sleep(1000);
            const newConfiguration = msg.payload as IConfigurationInfo;
            await reloadFlow(node, RED.settings, newConfiguration);
            return msg;
        }

        function extractErrorString(
            eventValidator,
            fileValidator,
            bulkValidator,
            tsValidator,
            rcValidator,
            actionValidator,
            dataLakeValidator
        ) {
            const eventErrors = eventValidator.errors || [];
            const fileErrors = fileValidator.errors || [];
            const bulkErrors = bulkValidator.errors || [];
            const timeSeriesErrors = tsValidator.errors || [];
            const rcValidatorErrors = rcValidator.errors || [];
            const actionErrors = actionValidator.errors || [];
            const dataLakeErrors = dataLakeValidator.errors || [];

            const result = {
                message:
                    "the payload was not recognized as an event, file or datapoints. See node help for proper msg.payload.formats (see msg._errorObject for all errors)",
                actionErrors: [],
                eventErrors: [],
                fileErrors: [],
                dataLakeErrors: [],
                bulkErrors: [],
                timeSeriesErrors: [],
                remoteConfigurationErrors: [],
            };

            actionErrors.forEach((element) => {
                result.actionErrors.push(element.message);
            });

            eventErrors.forEach((element) => {
                result.eventErrors.push(element.message);
            });

            fileErrors.forEach((element) => {
                result.fileErrors.push(element.message);
            });

            dataLakeErrors.forEach((element) => {
                result.dataLakeErrors.push(element.message);
            });

            bulkErrors.forEach((element) => {
                result.bulkErrors.push(element.message);
            });

            timeSeriesErrors.forEach((element) => {
                result.timeSeriesErrors.push(element.message);
            });
            rcValidatorErrors.forEach((element) => {
                result.remoteConfigurationErrors.push(element.message);
            });

            return result;
        }

        async function handleInputError(msg: any, error, timestamp: Date) {
            handleError(node, msg, error);
            return msg;
        }

        async function renewToken(msg: any, agent: MindConnectAgent, timestamp: Date) {
            if (node.disablekeepalive) {
                node.log("Keep alive for this agent is disabled");
                return;
            }

            try {
                node.status({ fill: "grey", shape: "dot", text: `renewing agent token` });
                await retryWithNodeLog(node.retry, () => agent.RenewToken(), "RenewToken", node);
                node.log(`Last keep alive key rotation at ${timestamp}`);
                node.status({ fill: "green", shape: "dot", text: `Last keep alive key rotation at ${timestamp}` });
                msg._mindsphereStatus = "OK";
                // this is a control message, we are not sending the mesage further
            } catch (error) {
                // this is a control message, we are not sending the mesage further
                handleError(node, msg, error, false);
            }
            return msg;
        }

        async function sendTimeSeriesData(msg: any, agent: MindConnectAgent, timestamp: Date) {
            try {
                node.status({ fill: "grey", shape: "dot", text: `recieved data points` });
                await retryWithNodeLog(
                    node.retry,
                    () => agent.PostData(msg.payload, timestamp, node.validate),
                    "PostData",
                    node
                );
                node.log(`Posted last message at ${timestamp}`);
                node.status({ fill: "green", shape: "dot", text: `Posted last message at ${timestamp}` });
                msg._mindsphereStatus = "OK";
                node.send(msg);
            } catch (error) {
                handleError(node, msg, error);
            }
            return msg;
        }

        async function sendBulkTimeSeriesData(msg: any, agent: MindConnectAgent, timestamp: Date) {
            try {
                node.status({
                    fill: "grey",
                    shape: "dot",
                    text: `recieved ${msg.payload.length} data points for bulk upload `,
                });
                await retryWithNodeLog(
                    node.retry,
                    () => agent.BulkPostData(msg.payload, node.validate),
                    "BulkPost",
                    node
                );
                node.log(`Posted last bulk message at ${timestamp}`);
                node.status({ fill: "green", shape: "dot", text: `Posted last bulk message at ${timestamp}` });
                msg._mindsphereStatus = "OK";
                node.send(msg);
            } catch (error) {
                handleError(node, msg, error);
            }
            return msg;
        }

        async function sendFileToDataLake(msg: any, agent: MindConnectAgent, timestamp: Date) {
            try {
                const dataLakeClient = agent.Sdk().GetDataLakeClient();
                const fileInfo = msg.payload as IDataLakeFileInfo;
                const message = Buffer.isBuffer(fileInfo.dataLakeFile) ? "Buffer" : fileInfo.dataLakeFile;
                node.status({ fill: "grey", shape: "dot", text: `recieved fileInfo ${message} at ${timestamp}` });

                const url = await retryWithNodeLog(
                    node.retry,
                    () =>
                        dataLakeClient.GenerateUploadObjectUrls({
                            paths: [{ path: `/${agent.ClientId()}/${fileInfo.dataLakeFilePath}` }],
                            subtenantId: fileInfo.subTenantId,
                        }),
                    "GenerateUploadObjectUrl",
                    node
                );

                node.status({
                    fill: "grey",
                    shape: "dot",
                    text: `generated upload URL : ${msg._ignorePayload ? "skipping upload" : "uploading file"}`,
                });

                msg._signedUrl = url.objectUrls[0].signedUrl;
                msg._mindsphereStatus = "OK";

                if (!msg.ignorePayload) {
                    await retryWithNodeLog(
                        node.retry,
                        () => dataLakeClient.PutFile(fileInfo.dataLakeFile, url.objectUrls[0].signedUrl),
                        "PutFileToDataLake",
                        node
                    );
                    const uploadTimeStamp = new Date();
                    node.log(`Uploaded file at ${uploadTimeStamp} to Data Lake`);
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: `Uploaded file at ${uploadTimeStamp} to data lake.`,
                    });
                }
                node.send(msg);
            } catch (error) {
                handleError(node, msg, error);
            }
            return msg;
        }

        async function sendFile(msg: any, agent: MindConnectAgent, timestamp: Date) {
            try {
                const fileInfo = msg.payload as IFileInfo;
                const message = Buffer.isBuffer(fileInfo.fileName) ? "Buffer" : fileInfo.fileName;
                node.status({ fill: "grey", shape: "dot", text: `recieved fileInfo ${message}` });

                let parallelUploads = node.parallel || 1;
                const entityId = fileInfo.entityId || agent.ClientId();
                if (Buffer.isBuffer(fileInfo) && !fileInfo.filePath) {
                    throw Error("you have to provide the filePath when using Buffer as the payload");
                }

                await retryWithNodeLog(
                    node.retry,
                    () =>
                        agent.UploadFile(
                            entityId,
                            fileInfo.filePath || Buffer.isBuffer(fileInfo.fileName) ? "unknown" : fileInfo.fileName,
                            fileInfo.fileName,
                            {
                                chunk: node.chunk,
                                parallelUploads: parallelUploads,
                                type: fileInfo.fileType,
                            }
                        ),
                    "FileUpload",
                    node
                );
                node.log(`Uploaded file at ${timestamp}`);
                node.status({ fill: "green", shape: "dot", text: `Uploaded file at ${timestamp}` });
                msg._mindsphereStatus = "OK";
                node.send(msg);
            } catch (error) {
                handleError(node, msg, error);
            }
            return msg;
        }

        async function sendEvent(msg: any, agent: MindConnectAgent, timestamp: any) {
            try {
                node.status({ fill: "grey", shape: "dot", text: `recieved event` });
                const event = <BaseEvent>msg.payload;
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
            } catch (error) {
                handleError(node, msg, error);
            }
            return msg;
        }
    }

    RED.nodes.registerType("mindconnect", nodeRedMindConnectAgent);

    RED.httpAdmin.get("/mindconnect/mindsphere.css", function (req, res) {
        const filename = path.join(__dirname, "mindsphere.css");
        res.sendFile(filename);
    });

    RED.httpAdmin.get("/mindconnect/agentinfo/:id", RED.auth.needsPermission("mindconnect.read"), async (req, res) => {
        const node = RED.nodes.getNode(req.params.id);
        try {
            if (!node) {
                throw new Error(`There is no node with id ${req.params.id}`);
            }
            const agent = node.agent as MindConnectAgent;

            if (!agent) {
                throw new Error(`There is no agent configured at node with id ${req.params.id}`);
            }

            if (!agent.IsOnBoarded()) {
                await agent.OnBoard();
            }
            const configuration = await agent.GetDataSourceConfiguration();
            const mappings = await agent.GetDataMappings();
            res.send({
                id: req.params.id,
                clientid: agent.ClientId(),
                isOnboarded: agent.IsOnBoarded(),
                configuration: configuration,
                mappings: mappings,
            });
        } catch (err) {
            res.send({ error: `${err.message || JSON.stringify(err)}` });
            node.status({
                fill: "red",
                shape: "dot",
                text: `Error occured:  ${err.message || JSON.stringify(err)}`,
            });
        }
    });

    RED.httpAdmin.get(
        "/mindconnect/assets/:id/:assetid",
        RED.auth.needsPermission("mindconnect.read"),
        async (req, res) => {
            const node = RED.nodes.getNode(req.params.id);

            try {
                if (!node) {
                    throw new Error(`There is no node with id ${req.params.id}`);
                }
                const agent = node.agent as MindConnectAgent;

                if (!agent) {
                    throw new Error(`There is no agent configured at node with id ${req.params.id}`);
                }

                if (!agent.IsOnBoarded()) {
                    await agent.OnBoard();
                }
                const asset = await agent.Sdk().GetAssetManagementClient().GetAsset(req.params.assetid);
                res.send(asset);
            } catch (err) {
                res.send({ error: `${err.message || JSON.stringify(err)}` });
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: `Error occured:  ${err.message || JSON.stringify(err)}`,
                });
            }
        }
    );

    RED.httpAdmin.get(
        "/mindconnect/asset/:id/:filter",
        RED.auth.needsPermission("mindconnect.read"),
        async (req, res) => {
            const node = RED.nodes.getNode(req.params.id);
            try {
                // console.log(req.params.id, node);
                if (!node) {
                    throw new Error(`There is no node with id ${req.params.id}`);
                }
                const agent = node.agent as MindConnectAgent;

                if (!agent) {
                    throw new Error(`There is no agent configured at node with id ${req.params.id}`);
                }

                if (!agent.IsOnBoarded()) {
                    await agent.OnBoard();
                }
                const am = agent.Sdk().GetAssetManagementClient();
                const filter =
                    req.params.filter === "root"
                        ? JSON.stringify({
                              not: {
                                  typeId: {
                                      startsWith: "core",
                                  },
                              },
                          })
                        : JSON.stringify({
                              or: {
                                  typeId: {
                                      contains: `${req.params.filter}`,
                                  },
                                  name: {
                                      contains: `${req.params.filter}`,
                                  },
                              },
                          });

                const children = await am.GetAssets({
                    size: 2000,
                    filter: filter,
                });
                res.send(children);
            } catch (err) {
                res.send({ error: `${err.message || JSON.stringify(err)}` });
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: `Error occured:  ${err.message || JSON.stringify(err)}`,
                });
            }
        }
    );

    RED.httpAdmin.post(
        "/mindconnect/assets/:id/:assetid",
        RED.auth.needsPermission("mindconnect.write"),
        async (req, res) => {
            const node = RED.nodes.getNode(req.params.id);
            // console.log(RED.auth.needsPermission("flows.write")());
            try {
                if (!node) {
                    throw new Error(`There is no node with id ${req.params.id}`);
                }
                const agent = node.agent as MindConnectAgent;

                if (!agent) {
                    throw new Error(`There is no agent configured at node with id ${req.params.id}`);
                }

                await agent.DeleteAllMappings();
                await agent.ConfigureAgentForAssetId(req.params.assetid);

                node.status({
                    fill: "green",
                    shape: "dot",
                    text: `successfully auto-configured agent for ${req.params.assetid}`,
                });
                res.send({ id: req.params.id, clientid: agent.ClientId(), isOnboarded: agent.IsOnBoarded() });
            } catch (err) {
                res.send({ error: `${err.message || JSON.stringify(err)}` });
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: `Error occured:  ${err.message || JSON.stringify(err)}`,
                });
            }
        }
    );
};
