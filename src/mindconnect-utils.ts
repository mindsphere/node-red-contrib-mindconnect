// Copyright Siemens AG, 2019
import { MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import * as debug from "debug";
import fetch from "node-fetch";
import { IConfigurationInfo } from "./mindconnect-schema";
const log = debug("node-red-contrib-mindconnect");

export const sleep = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryWithNodeLog = async (n, func, operation, node) => {
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

export const copyConfiguration = (node: IConfigurationInfo, config: IConfigurationInfo) => {
    node.name = config.name;
    node.configtype = config.configtype;
    node.agentconfig = config.agentconfig;
    node.privatekey = config.privatekey;
    node.model = config.model;
    node.validate = config.validate;
    node.validateevent = config.validateevent;
    node.chunk = config.chunk;
    node.disablekeepalive = config.disablekeepalive;
    node.emitcontrol = config.emitcontrol;
    node.retry = config.retry;
    node.parallel = config.parallel;
    node.asyncduration = config.asyncduration;
};

export const configureAgent = (mcnode: IConfigurationInfo, newConfig?: IConfigurationInfo) => {
    try {
        if (newConfig) {
            newConfig.agentconfig = JSON.stringify(newConfig.agentconfig);
            copyConfiguration(mcnode, newConfig);
        }
        if (typeof mcnode.agentconfig === "string") {
            let agentConfig = JSON.parse(mcnode.agentconfig);
            mcnode.agent = new MindConnectAgent(agentConfig);
        } else {
            mcnode.agent = new MindConnectAgent(mcnode.config);
        }
        let startlogmessage = "";
        if (mcnode.validate) startlogmessage += "validates timeseries ";
        if (mcnode.validateevent) startlogmessage += "validates events ";
        if (mcnode.chunk) startlogmessage += "chunked upload ";
        if (mcnode.disablekeepalive) startlogmessage += "disabled keep-alive";
        else startlogmessage += "keep-alive rotation: every hour";
        mcnode.emitcontrol = mcnode.emitcontrol || false;
        startlogmessage += ` control topic: ${mcnode.emitcontrol ? "enabled" : "disabled"}`;

        mcnode.parallel = mcnode.parallel || "1";
        mcnode.asyncduration = mcnode.asyncduration || "10";
        startlogmessage += ` parallel requests: ${mcnode.parallel} async requests wait: ${mcnode.asyncduration}s`;
        mcnode.log(`settings: ${startlogmessage} retries: ${mcnode.retry}`);
        mcnode.status({ fill: "grey", shape: "dot", text: `settings: ${startlogmessage} retries: ${mcnode.retry}` });
        const HOUR = 3600000;

        mcnode.await_id = setInterval(async () => {
            mcnode.receive({ payload: { action: "await", timestamp: new Date().toISOString() } });
        }, parseInt(mcnode.asyncduration) * 1000);

        mcnode.interval_id = setInterval(async () => {
            mcnode.receive({ payload: { action: "renew", timestamp: new Date().toISOString() } });
        }, HOUR);

        if (mcnode.agent.GetProfile() === "RSA_3072") {
            mcnode.privatekey = mcnode.privatekey.trim();
            if (!mcnode.privatekey.toString().startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
                throw new Error("Invalid certificate it has to start with : -----BEGIN RSA PRIVATE KEY-----");
            }
            if (!mcnode.privatekey.endsWith("\n")) {
                mcnode.privatekey += "\n";
            }
            if (!mcnode.privatekey.toString().endsWith("-----END RSA PRIVATE KEY-----\n")) {
                throw new Error("Invalid certificate it has to end with : -----END RSA PRIVATE KEY-----\n");
            }
            mcnode.agent.SetupAgentCertificate(mcnode.privatekey.toString());
        }
    } catch (error) {
        mcnode.error(error);
        mcnode.status({ fill: "red", shape: "ring", text: `Error occured ${error}` });
    }
};

export const reloadFlow = async (node, settings, newConfig) => {
    const flowId = node.z;
    const nodeId = node.id;
    try {
        let uri = `http://localhost:${settings.uiPort || 1880}`;
        if (settings.httpAdminRoot) {
            uri += settings.httpAdminRoot;
        }

        if (!uri.endsWith("/")) {
            uri += "/";
        }

        uri = `${uri}flow/${flowId}`;
        const response = await fetch(uri, { method: "GET" });

        if (!response.ok) {
            throw new Error(`${response.statusText} ${await response.text()}`);
        }

        if (response.status >= 200 && response.status <= 299) {
            const flow = await response.json();

            if (!flow.nodes) {
                throw new Error("No nodes in flow!");
            }

            const currentNode = (flow.nodes as []).find((x: any) => {
                return x.id === nodeId;
            });

            if (!currentNode) {
                throw new Error("there is no node with such id!");
            }
            configureAgent(node, newConfig);

            if (typeof newConfig.agentconfig !== "string") {
                newConfig.agentconfig = JSON.stringify(newConfig.agentconfig);
            }
            copyConfiguration(currentNode, newConfig);

            const putResponse = await fetch(uri, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(flow),
            });

            if (!putResponse.ok || putResponse.status < 200 || putResponse.status > 299) {
                throw new Error(
                    `error reloading flow ${putResponse.status} ${putResponse.statusText} ${await putResponse.text()}`
                );
            }

            node.status({
                fill: "green",
                shape: "dot",
                text: "the configuration was received and the flow was restarted. please reload your browser!",
            });
        } else {
            throw new Error(`invalid response ${await response.text()}`);
        }
    } catch (err) {
        const message = `Error occurred reloading flow: ${flowId}, ${nodeId} ${err.message}`;
        log(message);
        throw new Error(message);
    }
};

export const handleError = (
    node: IMindConnectNode,
    msg: { _mindsphereStatus: string; _error: string; _errorObject: object; _mindsphereRequestCount: number },
    error: { message: any },
    requestCount: number,
    sendMessage: boolean = true
) => {
    node.error(error);
    msg._mindsphereStatus = "Error";
    msg._mindsphereRequestCount = requestCount;
    msg._errorObject = error;
    msg._error = `${new Date().toISOString()} ${error.message}}`;
    sendMessage && node.send(msg);
    const errortext = error.message || error;
    node.status({ fill: "red", shape: "dot", text: `${errortext}` });
};

export interface IMindConnectNode {
    validateevent: boolean;
    chunk: boolean;
    parallel: number;
    disablekeepalive: any;
    emitcontrol?: boolean;
    retry: number;
    validate: boolean;
    log(arg0: string);
    agent: MindConnectAgent;
    error: (arg0: any) => void;
    send: (arg0: any) => void;
    status: (arg0: { fill: string; shape: string; text: string }) => void;
}

export const extractErrorString = (
    eventValidator: { errors?: any[] },
    fileValidator: { errors?: any[] },
    bulkValidator: { errors?: any[] },
    tsValidator: { errors?: any[] },
    rcValidator: { errors?: any[] },
    actionValidator: { errors?: any[] },
    dataLakeValidator: { errors?: any[] }
) => {
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
};
