// Copyright Siemens AG, 2017

import { MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import * as fs from "fs";
import * as path from "path";
import { RegisterHttpHandlers } from "./http-handlers";
import {
    renewToken,
    sendBulkTimeSeriesData,
    sendEvent,
    sendFile,
    sendFileToDataLake,
    sendTimeSeriesData,
} from "./mindconnect-ops";
import {
    actionSchemaValidator,
    bulkUploadValidator,
    dataLakeFileInfoValidator,
    eventSchemaValidator,
    fileInfoValidator,
    IConfigurationInfo,
    remoteConfigurationValidator,
    timeSeriesValidator,
} from "./mindconnect-schema";
import {
    configureAgent,
    copyConfiguration,
    extractErrorString,
    handleError,
    IQuerablePromise,
    queryablePromise,
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

        let promises: IQuerablePromise[] = [];
        let awaitPromises = false;

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
                    if (rcValidator(msg.payload)) {
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

                    if (actionValidator(msg.payload)) {
                        if (msg.payload.action === "await") {
                            awaitPromises = true;
                        } else if (msg.payload.action === "renew") {
                            promises.push(queryablePromise(renewToken({ msg, agent, timestamp, node })));
                        }
                    } else if (eventValidator(msg.payload) || msg._customEvent === true) {
                        promises.push(queryablePromise(sendEvent({ msg, agent, timestamp, node })));
                    } else if (fileValidator(msg.payload)) {
                        promises.push(queryablePromise(sendFile({ msg, agent, timestamp, node })));
                    } else if (dataLakeValidator(msg.payload)) {
                        promises.push(queryablePromise(sendFileToDataLake({ msg, agent, timestamp, node })));
                    } else if (bulkValidator(msg.payload)) {
                        promises.push(queryablePromise(sendBulkTimeSeriesData({ msg, agent, timestamp, node })));
                    } else if (tsValidator(msg.payload)) {
                        promises.push(queryablePromise(sendTimeSeriesData({ msg, agent, timestamp, node })));
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

                        promises.push(queryablePromise(handleInputError(msg, errorObject, timestamp)));
                    }

                    if ((promises.length % node.parallel === 0 && promises.length > 0) || awaitPromises) {
                        const pending = promises.filter((x) => x.isPending()).length;
                        const rejected = promises.filter((x) => x.isRejected()).length;
                        const fullfilled = promises.filter((x) => x.isFulfilled()).length;
                        const errorneous = promises.filter((x) => x.isErrorneous()).length;

                        const info = {
                            requests: promises.length,
                            success: fullfilled - errorneous,
                            pending: pending,
                            errors: rejected + errorneous,
                        };

                        if (node.emitcontrol) {
                            node.send({
                                topic: "control",
                                payload: info,
                            });
                        }

                        node.log(
                            `${info.requests} requests, ${info.success} successful with ${info.errors} errors and ${info.pending} still pending`
                        );
                        node.status({
                            fill: info.errors === 0 ? (info.pending === 0 ? "green" : "blue") : "red",
                            shape: "dot",
                            text: `[${timestamp.toLocaleString()}] ${info.requests} requests, ${
                                info.success
                            } successful with ${info.errors} errors and ${info.pending} still pending`,
                        });

                        promises = promises.filter((x) => x.isPending());
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

        async function handleInputError(msg: any, error, timestamp: Date) {
            handleError(node, msg, error);
            return msg;
        }
    }

    RegisterHttpHandlers(RED, nodeRedMindConnectAgent);
};
