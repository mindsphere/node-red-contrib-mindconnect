import ajv = require("ajv");

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
