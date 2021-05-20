// Copyright Siemens AG, 2019

import { IMindConnectConfiguration } from "@mindconnect/mindconnect-nodejs";
import ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export const actionSchema = {
    definitions: {},
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://opensource.mindsphere.io/mindconnect/action",
    type: "object",
    title: "The Root Schema",
    required: ["action", "timestamp"],
    properties: {
        action: {
            $id: "#/properties/action",
            type: "string",
            title: "The Action Schema",
            default: "",
            examples: ["await"],
            oneOf: [{ enum: ["await", "renew"] }],
        },
        timestamp: {
            $id: "#/properties/timestamp",
            type: "string",
            title: "The Timestamp Schema",
            default: "",
            examples: ["2020-02-25T09:31:01.493Z"],
            pattern: "^(.*)$",
        },
    },
};

export const sdkFunctionSchema = {
    definitions: {},
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://opensource.mindsphere.io/mindconnect/sdk",
    type: "object",
    title: "The Root Schema",
    required: ["function"],
    properties: {
        function: {
            $id: "#/properties/function",
            type: "string",
            title: "The operation Schema",
            default: "",
            examples: ["return agent.Sdk().GetAssetManagementClient().GetAsset('<id>');"],
        },
    },
};

export const assetInfoSchema = {
    definitions: {},
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://opensource.mindsphere.io/mindconnect/assetInfoSchema",
    type: "object",
    title: "The Root Schema",
    required: ["assetId", "includeShared", "propertyNames"],
    properties: {
        assetId: {
            $id: "#/properties/assetId",
            type: "string",
            title: "The assetId Schema",
            default: "",
            examples: ["assetId"],
        },
        includeShared: {
            $id: "#/properties/includeShared",
            type: "boolean",
            title: "The assetId Schema",
            default: false,
            examples: [true],
        },

        propertyNames: {
            $id: "#/properties/propertyNames",
            type: "array",
            items: {
                type: "string",
            },
            title: "The propertyNames Schema",
            default: "",
            examples: ["staticVariables"],
        },
    },
};

export const eventSchema = {
    $id: "http://opensource.mindsphere.io/mindconnect/event",
    type: "object",
    properties: {
        entityId: {
            $id: "/properties/entityId",
            type: "string",
            title: "The Entityid Schema ",
            default: "",
            examples: ["12345678901234567890123456789012"],
            minLength: 32,
            maxLength: 32,
            pattern: "^[A-Fa-f0-9]*$",
        },
        timestamp: {
            $id: "/properties/timestamp",
            type: "string",
            format: "date-time",
            title: "The Timestamp Schema ",
            default: "",
            examples: ["2018-06-16T18:38:07.293Z"],
        },
        sourceType: {
            $id: "/properties/sourceType",
            type: "string",
            title: "The Sourcetype Schema ",
            default: "",
            examples: ["Event"],
        },
        sourceId: {
            $id: "/properties/sourceId",
            type: "string",
            title: "The Sourceid Schema ",
            default: "",
            examples: ["application"],
        },
        source: {
            $id: "/properties/source",
            type: "string",
            title: "The Source Schema ",
            default: "",
            examples: ["Meowz"],
        },
        severity: {
            $id: "/properties/severity",
            type: "integer",
            title: "The Severity Schema ",
            default: 0,
            examples: [20],
        },
        description: {
            $id: "/properties/description",
            type: "string",
            title: "The Description Schema ",
            default: "",
            examples: [""],
        },
    },
    required: ["timestamp", "severity", "description", "source", "sourceId", "sourceType"],
};

export const dataLakeFileInfoSchema = {
    $id: "http://opensource.mindsphere.io/mindconnect/datalakefileinfo",
    type: "object",
    properties: {
        dataLakeFile: {
            $id: "/properties/dataLakeFile",
            type: ["string", "object"],
            title: "fileName ",
            default: "",
        },
        dataLakeFilePath: {
            $id: "/properties/dataLakeFilePath",
            type: "string",
            title: "filePath ",
            default: "",
        },
        subTenantId: {
            $id: "/properties/subTenantId",
            type: "string",
            title: "subTenantId ",
            default: "",
        },
    },
    required: ["dataLakeFile", "dataLakeFilePath"],
};

export const fileInfoSchema = {
    $id: "http://opensource.mindsphere.io/mindconnect/fileinfo",
    type: "object",
    properties: {
        entityId: {
            $id: "/properties/entityId",
            type: "string",
            title: "The Entityid Schema ",
            default: "",
            minLength: 32,
            maxLength: 32,
            pattern: "^[A-Fa-f0-9]*$",
        },
        fileName: {
            $id: "/properties/fileName",
            type: ["string", "object"],
            title: "The fileName Schema ",
            default: "",
        },
        filePath: {
            $id: "/properties/filePath",
            type: "string",
            title: "The filePath Schema ",
            default: "",
        },
        description: {
            $id: "/properties/description",
            type: "string",
            title: "The Description Schema ",
            default: "",
            examples: [""],
        },
    },
    required: ["fileName", "description"],
};

export const bulkUploadSchema = {
    $id: "http://opensource.mindsphere.io/mindconnect/bulkupload",
    type: "array",
    items: {
        type: "object",
        required: ["timestamp", "values"],
        properties: {
            timestamp: {
                type: "string",
            },
            values: {
                type: "array",
                items: {
                    type: "object",
                    required: [],
                    properties: {
                        dataPointId: {
                            type: "string",
                        },
                        qualityCode: {
                            type: "string",
                        },
                        value: {
                            type: "string",
                        },
                    },
                },
            },
        },
    },
};

export const timeSeriesSchema = {
    $id: "http://opensource.mindsphere.io/mindconnect/timeseries",
    type: "array",
    items: {
        type: "object",
        required: ["dataPointId", "qualityCode", "value"],
        properties: {
            dataPointId: {
                type: "string",
            },
            qualityCode: {
                type: "string",
            },
            value: {
                type: "string",
            },
        },
    },
};

export const remoteConfigurationSchema = {
    definitions: {},
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://opensource.mindsphere.io/mindconnect/remoteconfiguration",
    type: "object",
    title: "The Root Schema",
    required: [
        "name",
        "configtype",
        "agentconfig",
        "privatekey",
        "model",
        "validate",
        "validateevent",
        "chunk",
        "disablekeepalive",
        "retry",
        "asyncduration",
    ],
    properties: {
        name: {
            $id: "#/properties/name",
            type: "string",
            title: "The Name Schema",
            default: "",
            examples: ["Hello"],
            pattern: "^(.*)$",
        },
        configtype: {
            $id: "#/properties/configtype",
            type: "string",
            title: "The Configtype Schema",
            default: "",
            examples: ["SHARED_SECRET"],
            pattern: "^(.*)$",
        },
        agentconfig: {
            $id: "#/properties/agentconfig",
            type: "object",
            title: "The Agentconfig Schema",
            required: ["content", "expiration"],
            properties: {
                content: {
                    $id: "#/properties/agentconfig/properties/content",
                    type: "object",
                    title: "The Content Schema",
                    required: ["baseUrl", "iat", "clientCredentialProfile", "clientId", "tenant"],
                    properties: {
                        baseUrl: {
                            $id: "#/properties/agentconfig/properties/content/properties/baseUrl",
                            type: "string",
                            title: "The Baseurl Schema",
                            default: "",
                            examples: ["https://southgate.eu1.mindsphere.io"],
                            pattern: "^(.*)$",
                        },
                        iat: {
                            $id: "#/properties/agentconfig/properties/content/properties/iat",
                            type: "string",
                            title: "The Iat Schema",
                            default: "",
                            examples: ["eyJraW...a1"],
                            pattern: "^(.*)$",
                        },
                        clientCredentialProfile: {
                            $id: "#/properties/agentconfig/properties/content/properties/clientCredentialProfile",
                            type: "array",
                            title: "The Clientcredentialprofile Schema",
                            items: {
                                $id: "#/properties/agentconfig/properties/content/properties/clientCredentialProfile/items",
                                type: "string",
                                title: "The Items Schema",
                                default: "",
                                examples: ["SHARED_SECRET"],
                                pattern: "^(.*)$",
                            },
                        },
                        clientId: {
                            $id: "#/properties/agentconfig/properties/content/properties/clientId",
                            type: "string",
                            title: "The Clientid Schema",
                            default: "",
                            examples: ["d72262e71ea0470eb9f880176b888938"],
                            pattern: "^(.*)$",
                        },
                        tenant: {
                            $id: "#/properties/agentconfig/properties/content/properties/tenant",
                            type: "string",
                            title: "The Tenant Schema",
                            default: "",
                            examples: ["castidev"],
                            pattern: "^(.*)$",
                        },
                    },
                },
                expiration: {
                    $id: "#/properties/agentconfig/properties/expiration",
                    type: "string",
                    title: "The Expiration Schema",
                    default: "",
                    examples: ["2018-11-15T17:31:35.000Z"],
                    pattern: "^(.*)$",
                },
            },
        },
        privatekey: {
            $id: "#/properties/privatekey",
            type: "string",
            title: "The Privatekey Schema",
            default: "",
            examples: [""],
            pattern: "^(.*)$",
        },
        model: {
            $id: "#/properties/model",
            type: "string",
            title: "The Model Schema",
            default: "",
            examples: [""],
            pattern: "^(.*)$",
        },
        validate: {
            $id: "#/properties/validate",
            type: "boolean",
            title: "The Validate Schema",
            default: false,
            examples: [true],
        },
        validateevent: {
            $id: "#/properties/validateevent",
            type: "boolean",
            title: "The Validateevent Schema",
            default: false,
            examples: [false],
        },
        chunk: {
            $id: "#/properties/chunk",
            type: "boolean",
            title: "The Chunk Schema",
            default: false,
            examples: [true],
        },
        disablekeepalive: {
            $id: "#/properties/disablekeepalive",
            type: "boolean",
            title: "The Disablekeepalive Schema",
            default: false,
            examples: [true],
        },
        emitcontrol: {
            $id: "#/properties/emitcontrol",
            type: "boolean",
            title: "The emitcontrol Schema",
            default: false,
            examples: [true],
        },
        datalakeonly: {
            $id: "#/properties/datalakeonly",
            type: "boolean",
            title: "The datalakeonly Schema",
            default: false,
            examples: [true],
        },
        supressverbosity: {
            $id: "#/properties/supressverbosity",
            type: "boolean",
            title: "The supressverbosity Schema",
            default: false,
            examples: [true],
        },
        retry: {
            $id: "#/properties/retry",
            type: "string",
            title: "The Retry Schema",
            default: "",
            examples: ["7"],
            pattern: "^([0-9]*)$",
        },
        asyncduration: {
            $id: "#/properties/asyncduration",
            type: "string",
            title: "The asyncduration Schema",
            default: "",
            examples: ["7"],
            pattern: "^([0-9]*)$",
        },
    },
};

const schemaValidator = new ajv({ $data: true, allErrors: true, allowUnionTypes: true });
addFormats(schemaValidator);

export function actionSchemaValidator(): ValidateFunction {
    return schemaValidator.compile(actionSchema);
}

export function assetInfoValidator(): ValidateFunction {
    return schemaValidator.compile(assetInfoSchema);
}


export function remoteConfigurationValidator(): ValidateFunction {
    return schemaValidator.compile(remoteConfigurationSchema);
}

export function eventSchemaValidator(): ValidateFunction {
    return schemaValidator.compile(eventSchema);
}

export function dataLakeFileInfoValidator(): ValidateFunction {
    return schemaValidator.compile(dataLakeFileInfoSchema);
}

export function fileInfoValidator(): ValidateFunction {
    return schemaValidator.compile(fileInfoSchema);
}

export function bulkUploadValidator(): ValidateFunction {
    return schemaValidator.compile(bulkUploadSchema);
}

export function sdkFunctionValidator(): ValidateFunction {
    return schemaValidator.compile(sdkFunctionSchema);
}

export function timeSeriesValidator(): ValidateFunction {
    return schemaValidator.compile(timeSeriesSchema);
}

export interface IAssetInfo {
    assetId: string;
    includeShared: boolean;
    propertyNames: Array<string>;
}

export interface IDataLakeFileInfo {
    dataLakeFile: Buffer | string;
    dataLakeFilePath: string;
    subTenantId?: string;
}

export interface IFileInfo {
    entityId: string;
    fileName: Buffer | string;
    fileType: string;
    filePath?: string;
    description?: string;
}

export interface IConfigurationInfo {
    name: string;
    configtype: string;
    agentconfig: string | IMindConnectConfiguration;
    privatekey: string;
    model: string;
    validate: boolean;
    validateevent: boolean;
    chunk: boolean;
    disablekeepalive: boolean;
    retry: string;
    parallel: string;
    asyncduration: string;
    [x: string]: any;
}
