// Copyright Siemens AG, 2017

import { MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import * as fs from "fs";
import * as path from "path";
import * as allSettled from "promise.allsettled";
import * as q from "queryable-promise";
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

                    const requestCount = promises.length;

                    if (await actionValidator(msg.payload)) {
                        if (msg.payload.action === "await") {
                            awaitPromises = true;
                        } else if (msg.payload.action === "renew") {
                            promises.push(q(renewToken({ msg, agent, timestamp, node, requestCount })));
                        }
                    } else if ((await eventValidator(msg.payload)) || msg._customEvent === true) {
                        promises.push(q(sendEvent({ msg, agent, timestamp, node, requestCount })));
                    } else if (await fileValidator(msg.payload)) {
                        promises.push(q(sendFile({ msg, agent, timestamp, node, requestCount })));
                    } else if (await dataLakeValidator(msg.payload)) {
                        promises.push(q(sendFileToDataLake({ msg, agent, timestamp, node, requestCount })));
                    } else if (await bulkValidator(msg.payload)) {
                        promises.push(q(sendBulkTimeSeriesData({ msg, agent, timestamp, node, requestCount })));
                    } else if (await tsValidator(msg.payload)) {
                        promises.push(q(sendTimeSeriesData({ msg, agent, timestamp, node, requestCount })));
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

                        promises.push(q(handleInputError(msg, errorObject, timestamp, promises.length)));
                    }

                    if ((promises.length % node.parallel === 0 && promises.length > 0) || awaitPromises) {
                        node.status({
                            fill: "blue",
                            shape: "dot",
                            text: `awaiting ${promises.length} parallel requests...`,
                        });

                        node.send({
                            _mindsphereStatus: "OK",
                            _mindsphereRequestCount: promises.length,
                            topic: "control",
                        });

                        const pending = promises.filter((x) => x.isPending()).length;
                        const rejected = promises.filter((x) => x.isRejected()).length;
                        const fullfilled = promises.filter((x) => x.isResolved()).length;

                        node.log(
                            `Parallel requests status: ${fullfilled} finished with ${rejected} errors and ${pending} still pending at ${timestamp}`
                        );
                        node.status({
                            fill: rejected === 0 ? (pending === 0 ? "green" : "blue") : "red",
                            shape: "dot",
                            text: `Parallel requests status: ${fullfilled} finished with ${rejected} errors and ${pending} pending at ${timestamp}`,
                        });

                        promises = promises.filter((x) => x.isPending());
                        awaitPromises = false;
                    }
                } catch (error) {
                    handleError(node, msg, error, 0);
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

        async function handleInputError(msg: any, error, timestamp: Date, requestCount: number) {
            handleError(node, msg, error, requestCount);
            return msg;
        }
    }

    RegisterHttpHandlers(RED, nodeRedMindConnectAgent);
};
