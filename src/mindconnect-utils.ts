// Copyright Siemens AG, 2019
import { MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import { IConfigurationInfo } from "./mindconnect-schema";

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
    node.retry = config.retry;
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
        mcnode.log(`settings: ${startlogmessage} retries: ${mcnode.retry}`);
        const HOUR = 3600000;
        mcnode.interval_id = setInterval(async () => {
            if (!mcnode.disablekeepalive) {
                let timestamp = new Date();

                try {
                    let agent = <MindConnectAgent>mcnode.agent;
                    await retry(mcnode.retry, () => agent.RenewToken(), "RenewToken");
                    mcnode.status({
                        fill: "green",
                        shape: "dot",
                        text: `Last keep alive key rotation at ${timestamp}`
                    });
                    mcnode.log(`Last keep alive key rotation at ${timestamp}`);
                } catch (error) {
                    mcnode.error(error);
                    mcnode.status({
                        fill: "red",
                        shape: "ring",
                        text: `Error occured during keep alive ${error} on ${timestamp}`
                    });
                }
            } else {
                mcnode.log("Keep alive for this agent is disabled");
            }
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
