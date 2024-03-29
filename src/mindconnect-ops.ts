// * MindConnect Operations - sending of data

import { BaseEvent, MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import { IAssetInfo, IDataLakeFileInfo, IFileInfo } from "./mindconnect-schema";
import { handleError, IMindConnectNode, retryWithNodeLog } from "./mindconnect-utils";

export interface OperationParameters {
    msg: any;
    agent: MindConnectAgent;
    timestamp: Date;
    node: IMindConnectNode;
    send?: (value: object) => void;
}

export async function renewToken({ msg, agent, timestamp, node }: OperationParameters) {
    if (node.disablekeepalive) {
        node.log("Keep alive for this agent is disabled");
        return;
    }

    try {
        !node.supressverbosity && node.status({ fill: "grey", shape: "dot", text: `renewing agent token` });
        await retryWithNodeLog(node.retry, () => agent.RenewToken(), "RenewToken", node);
        node.log(`Last keep alive key rotation at ${timestamp}`);
        !node.supressverbosity &&
            node.status({ fill: "green", shape: "dot", text: `Last keep alive key rotation at ${timestamp}` });
        msg._mindsphereStatus = "OK";
        // this is a control message, we are not sending the mesage further
    } catch (error) {
        // this is a control message, we are not sending the mesage further
        handleError(node, msg, error, false);
    }
    return msg;
}

export async function sendTimeSeriesData({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        !node.supressverbosity && node.status({ fill: "grey", shape: "dot", text: `recieved data points` });
        await retryWithNodeLog(
            node.retry,
            () => agent.PostData(msg.payload, timestamp, node.validate),
            "PostData",
            node
        );
        node.log(`Posted last message at ${timestamp}`);
        !node.supressverbosity &&
            node.status({ fill: "green", shape: "dot", text: `Posted last message at ${timestamp}` });
        msg._mindsphereStatus = "OK";
        node.send(msg);
    } catch (error) {
        handleError(node, msg, error);
    }
    return msg;
}

export async function sendBulkTimeSeriesData({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        !node.supressverbosity &&
            node.status({
                fill: "grey",
                shape: "dot",
                text: `recieved ${msg.payload.length} data points for bulk upload `,
            });
        await retryWithNodeLog(node.retry, () => agent.BulkPostData(msg.payload, node.validate), "BulkPost", node);
        node.log(`Posted last bulk message at ${timestamp}`);
        !node.supressverbosity &&
            node.status({ fill: "green", shape: "dot", text: `Posted last bulk message at ${timestamp}` });
        msg._mindsphereStatus = "OK";
        node.send(msg);
    } catch (error) {
        handleError(node, msg, error);
    }
    return msg;
}

export async function sendFileToDataLake({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        const dataLakeClient = agent.Sdk().GetDataLakeClient();
        const fileInfo = msg.payload as IDataLakeFileInfo;
        const message = Buffer.isBuffer(fileInfo.dataLakeFile) ? "Buffer" : fileInfo.dataLakeFile;
        !node.supressverbosity &&
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

        !node.supressverbosity &&
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
            !node.supressverbosity &&
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

export async function sendFile({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        const fileInfo = msg.payload as IFileInfo;
        const message = Buffer.isBuffer(fileInfo.fileName) ? "Buffer" : fileInfo.fileName;
        !node.supressverbosity && node.status({ fill: "grey", shape: "dot", text: `recieved fileInfo ${message}` });

        let parallelUploads = node.parallel || 1;
        const entityId = fileInfo.entityId || agent.ClientId();
        if (Buffer.isBuffer(fileInfo) && !fileInfo.filePath) {
            throw Error("you have to provide the filePath when using Buffer as the payload");
        }

        await agent.UploadFile(
            entityId,
            fileInfo.filePath || (Buffer.isBuffer(fileInfo.fileName) ? "unknown" : fileInfo.fileName),
            fileInfo.fileName,
            {
                chunk: node.chunk,
                parallelUploads: parallelUploads,
                type: fileInfo.fileType,
                retry: node.retry,
            }
        );

        node.log(`Uploaded file at ${timestamp}`);
        !node.supressverbosity && node.status({ fill: "green", shape: "dot", text: `Uploaded file at ${timestamp}` });
        msg._mindsphereStatus = "OK";
        node.send(msg);
    } catch (error) {
        handleError(node, msg, error);
    }
    return msg;
}

export async function sendEvent({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        !node.supressverbosity && node.status({ fill: "grey", shape: "dot", text: `recieved event` });
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
        !node.supressverbosity &&
            node.status({ fill: "green", shape: "dot", text: `Posted last event at ${timestamp}` });
        msg._mindsphereStatus = result ? "OK" : "Error";
        node.send(msg);
    } catch (error) {
        handleError(node, msg, error);
    }
    return msg;
}

export async function getAssetInfo({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        !node.supressverbosity && node.status({ fill: "grey", shape: "dot", text: `reading asset data` });

        const assetInfo = msg.payload as IAssetInfo;
        const assetManagement = agent.Sdk().GetAssetManagementClient();

        const result = await retryWithNodeLog(
            node.retry,
            () => assetManagement.GetAsset(assetInfo.assetId, { includeShared: assetInfo.includeShared }),
            "Get AssetInfo",
            node
        );
        node.log(`got asset info for asset with ${assetInfo.assetId} at ${timestamp}`);
        !node.supressverbosity &&
            node.status({
                fill: "green",
                shape: "dot",
                text: `got asset info for asset with ${assetInfo.assetId} at ${timestamp}`,
            });
        msg._mindsphereStatus = result ? "OK" : "Error";

        msg.payload = result;
        if (assetInfo.propertyNames.length > 0) {
            const reducedResult = {};

            assetInfo.propertyNames.forEach((element) => {
                reducedResult[element] = result[element];
            });
            msg.payload = reducedResult;
        }
        node.send(msg);
    } catch (error) {
        console.log(error);
        handleError(node, msg, error);
    }
    return msg;
}

export async function applySdkOperation({ msg, agent, timestamp, node, send }: OperationParameters) {
    try {
        !node.supressverbosity && node.status({ fill: "grey", shape: "dot", text: `reading asset data` });

        // stop typescript from manging the constructor of async functions.
        const AsyncFunction = new Function(`return Object.getPrototypeOf(async function(){}).constructor`)();
        const fn = new AsyncFunction("sdk", msg.payload.function);

        const result = await retryWithNodeLog(node.retry, () => fn.apply({}, [agent.Sdk()]), "CallSdk", node);
        node.log(`executed sdk operation at ${timestamp}`);
        !node.supressverbosity &&
            node.status({ fill: "green", shape: "dot", text: `executed sdk operation at ${timestamp}` });
        msg._mindsphereStatus = result ? "OK" : "Error";
        msg.payload = result;
        node.send(msg);
    } catch (error) {
        console.log(error);
        handleError(node, msg, error);
    }
    return msg;
}
