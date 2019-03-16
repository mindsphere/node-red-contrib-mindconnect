// Copyright Siemens AG, 2019

import ajv = require("ajv");
import { IMindConnectConfiguration } from "@mindconnect/mindconnect-nodejs";

export const eventSchema = {
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
            pattern: "^[A-Fa-f0-9]*$"
        },
        timestamp: {
            $id: "/properties/timestamp",
            type: "string",
            format: "date-time",
            title: "The Timestamp Schema ",
            default: "",
            examples: ["2018-06-16T18:38:07.293Z"]
        },
        sourceType: {
            $id: "/properties/sourceType",
            type: "string",
            title: "The Sourcetype Schema ",
            default: "",
            examples: ["Event"]
        },
        sourceId: {
            $id: "/properties/sourceId",
            type: "string",
            title: "The Sourceid Schema ",
            default: "",
            examples: ["application"]
        },
        source: {
            $id: "/properties/source",
            type: "string",
            title: "The Source Schema ",
            default: "",
            examples: ["Meowz"]
        },
        severity: {
            $id: "/properties/severity",
            type: "integer",
            title: "The Severity Schema ",
            default: 0,
            examples: [20]
        },
        description: {
            $id: "/properties/description",
            type: "string",
            title: "The Description Schema ",
            default: "",
            examples: [""]
        }
    },
    required: ["timestamp", "severity", "description", "source", "sourceId", "sourceType"]
};

export const fileInfoSchema = {
    $id: "http://example.com/example.json",
    type: "object",
    properties: {
        entityId: {
            $id: "/properties/entityId",
            type: "string",
            title: "The Entityid Schema ",
            default: "",
            minLength: 32,
            maxLength: 32,
            pattern: "^[A-Fa-f0-9]*$"
        },
        fileName: {
            $id: "/properties/sourceType",
            type: "string",
            title: "The Sourcetype Schema ",
            default: ""
        },
        description: {
            $id: "/properties/description",
            type: "string",
            title: "The Description Schema ",
            default: "",
            examples: [""]
        }
    },
    required: ["fileName", "description"]
};

export const bulkUploadSchema = {
    type: "array",
    items: {
        type: "object",
        required: ["timestamp", "values"],
        properties: {
            timestamp: {
                type: "string"
            },
            values: {
                type: "array",
                items: {
                    type: "object",
                    required: [],
                    properties: {
                        dataPointId: {
                            type: "string"
                        },
                        qualityCode: {
                            type: "string"
                        },
                        value: {
                            type: "string"
                        }
                    }
                }
            }
        }
    }
};

export const timeSeriesSchema = {
    type: "array",
    items: {
        type: "object",
        required: ["dataPointId", "qualityCode", "value"],
        properties: {
            dataPointId: {
                type: "string"
            },
            qualityCode: {
                type: "string"
            },
            value: {
                type: "string"
            }
        }
    }
};

export const remoteConfigurationSchema = {
    definitions: {},
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://example.com/root.json",
    type: "object",
    title: "The Root Schema",
    required: ["name"],
    properties: {
        name: {
            $id: "#/properties/name",
            type: "string",
            title: "The Name Schema",
            default: "",
            examples: ["Hello"],
            pattern: "^(.*)$"
        },
        agentconfig: {
            $id: "#/properties/agentconfig",
            type: "object",
            title: "The Agentconfig Schema",
            default: null,
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
                            pattern: "^(.*)$"
                        },
                        iat: {
                            $id: "#/properties/agentconfig/properties/content/properties/iat",
                            type: "string",
                            title: "The Iat Schema",
                            default: "",
                            examples: ["eyJra.....g"],
                            pattern: "^(.*)$"
                        },
                        clientCredentialProfile: {
                            $id: "#/properties/agentconfig/properties/content/properties/clientCredentialProfile",
                            type: "array",
                            title: "The Clientcredentialprofile Schema",
                            items: {
                                $id:
                                    "#/properties/agentconfig/properties/content/properties/clientCredentialProfile/items",
                                type: "string",
                                title: "The Items Schema",
                                default: "",
                                examples: ["RSA_3072"],
                                pattern: "^(.*)$"
                            }
                        },
                        clientId: {
                            $id: "#/properties/agentconfig/properties/content/properties/clientId",
                            type: "string",
                            title: "The Clientid Schema",
                            default: "",
                            examples: ["1dfbc6d8b23547f386af04ea6754ffa7"],
                            pattern: "^(.*)$"
                        },
                        tenant: {
                            $id: "#/properties/agentconfig/properties/content/properties/tenant",
                            type: "string",
                            title: "The Tenant Schema",
                            default: "",
                            examples: ["castidev"],
                            pattern: "^(.*)$"
                        }
                    }
                },
                expiration: {
                    $id: "#/properties/agentconfig/properties/expiration",
                    type: "string",
                    title: "The Expiration Schema",
                    default: "",
                    examples: ["2018-11-15T17:31:35.000Z"],
                    pattern: "^(.*)$"
                }
            }
        },
        privatekey: {
            $id: "#/properties/privatekey",
            type: "string",
            title: "The Privatekey Schema",
            default: "",
            examples: ["Blubb"],
            pattern: "^(.*)$"
        },
        validate: {
            $id: "#/properties/validate",
            type: "boolean",
            title: "The Validate Schema",
            default: false,
            examples: [true]
        },
        validteevent: {
            $id: "#/properties/validteevent",
            type: "boolean",
            title: "The Validteevent Schema",
            default: false,
            examples: [false]
        },
        chunk: {
            $id: "#/properties/chunk",
            type: "boolean",
            title: "The Chunk Schema",
            default: false,
            examples: [true]
        },
        disablekeepalive: {
            $id: "#/properties/disablekeepalive",
            type: "boolean",
            title: "The Disablekeepalive Schema",
            default: false,
            examples: [true]
        },
        retry: {
            $id: "#/properties/retry",
            type: "integer",
            title: "The Retry Schema",
            default: 0,
            examples: [3]
        }
    }
};

export function remoteConfigurationValidator(): ajv.ValidateFunction {
    const schemaValidator = new ajv({ $data: true, allErrors: true });
    return schemaValidator.compile(remoteConfigurationSchema);
}

export function eventSchemaValidator(): ajv.ValidateFunction {
    const schemaValidator = new ajv({ $data: true, allErrors: true });
    return schemaValidator.compile(eventSchema);
}

export function fileInfoValidator(): ajv.ValidateFunction {
    const schemaValidator = new ajv({ $data: true, allErrors: true });
    return schemaValidator.compile(fileInfoSchema);
}

export function bulkUploadValidator(): ajv.ValidateFunction {
    const schemaValidator = new ajv({ $data: true, allErrors: true });
    return schemaValidator.compile(bulkUploadSchema);
}

export function timeSeriesValidator(): ajv.ValidateFunction {
    const schemaValidator = new ajv({ $data: true, allErrors: true });
    return schemaValidator.compile(timeSeriesSchema);
}

export interface IFileInfo {
    entityId: string;
    fileName: string;
    fileType: string;
    description?: string;
}

export interface IConfigurationInfo {
    name: string;
    agentConfiguration?: IMindConnectConfiguration;
    rsaPrivateKey?: string;
    validate: boolean;
    validateevent: boolean;
    chunk: boolean;
    disablekeepalive: boolean;
    retry: 3;
}
