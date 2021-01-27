import { MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import * as path from "path";

/**
 * Register the http handlers for the node configuration.
 *
 * @export
 * @param {*} RED
 * @param {(config: any) => void} nodeRedMindConnectAgent
 */
export function RegisterHttpHandlers(RED: any, nodeRedMindConnectAgent: (config: any) => void) {
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
}
