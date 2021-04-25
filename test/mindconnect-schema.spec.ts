// Copyright Siemens AG, 2019

import { IMindConnectConfiguration } from "@mindconnect/mindconnect-nodejs";
import * as chai from "chai";
import { describe, it } from "mocha";
import {
    actionSchemaValidator,
    bulkUploadValidator,
    eventSchemaValidator,
    fileInfoValidator,
    remoteConfigurationValidator,
    timeSeriesValidator,
} from "../src/mindconnect-schema";
chai.should();

describe("Schema Validators", () => {
    it("should instantiate all validators @ci", () => {
        const eventVal = eventSchemaValidator();
        eventVal.should.exist;

        const fiVal = fileInfoValidator();
        fiVal.should.exist;

        const tsVal = timeSeriesValidator();
        tsVal.should.exist;

        const buVal = bulkUploadValidator();
        buVal.should.exist;

        const rcVal = remoteConfigurationValidator();
        rcVal.should.exist;

        const actionVal = actionSchemaValidator();
        actionVal.should.exist;
    });

    it("should validate events @ci", async () => {
        const eventVal = eventSchemaValidator();
        eventVal.should.exist;

        const event = {
            sourceType: "Agent",
            sourceId: "application",
            source: "MindConnect Agent",
            severity: 80,
            description: "Event sent at " + new Date().toISOString(),
            timestamp: new Date().toISOString(),
        };
        eventVal({ sourceType: "Agent" }).should.be.false;
        eventVal({ event }).should.be.false;
        eventVal(event).should.be.true;
    });

    it("should validate fileInfos @ci", async () => {
        const fiVal = fileInfoValidator();
        fiVal.should.exist;

        const fileInfo = {
            entityId: "1234567890abcdef1234567890abcdef", // optional
            fileName: "package.json",
            fileType: "application/json", // optional
            description: "testfile",
        };

        fiVal({}).should.be.false;
        fiVal(fileInfo).should.be.true;
        delete fileInfo.entityId;
        fiVal(fileInfo).should.be.true;
        delete fileInfo.fileType;
        fiVal(fileInfo).should.be.true;
        delete fileInfo.fileName;
        fiVal(fileInfo).should.be.false;
        fileInfo.fileName = "blubb";
        delete fileInfo.description;
        fiVal(fileInfo).should.be.false;
    });

    it("should validate timeseries @ci", async () => {
        const tsVal = timeSeriesValidator();
        tsVal.should.exist;
        const values = [
            {
                dataPointId: "1541718362027",
                qualityCode: "1",
                value: "47",
            },
        ];

        tsVal({}).should.be.false;
        tsVal(values).should.be.true;

        for (let index = 0; index < 10; index++) {
            values.push({ dataPointId: "123", qualityCode: "1", value: "33.5" });
        }
        tsVal(values).should.be.true;

        (values as any[]).push({ xdataPointId: "123", qualityCode: "1", value: "33.5" }); // * invalid data point
        tsVal(values).should.be.false;
        tsVal([{ xdataPointId: "123", qualityCode: "1", value: "33.5" }]).should.be.false;
    });

    it("should validate bulk @ci", async () => {
        const buVal = bulkUploadValidator();
        buVal.should.exist;
        const values = [
            {
                dataPointId: "1541718362027",
                qualityCode: "1",
                value: "47",
            },
        ];

        buVal([{ timeSTAMP: new Date().toISOString(), values: values }]).should.be.false;
        buVal([{ timestamp: new Date().toISOString(), values: values }]).should.be.true;

        for (let index = 0; index < 10; index++) {
            values.push({ dataPointId: "123", qualityCode: "1", value: "33.5" });
        }
        buVal([{ timestamp: new Date().toISOString(), values: values }]).should.be.true;

        (values as any[]).push({ xdataPointId: "123", qualityCode: "1", value: "33.5" }); // * invalid data point
        buVal([{ timestamp: new Date().toISOString(), values: values }]).should.be.true;
        buVal([{ xdataPointId: "123", qualityCode: "1", value: "33.5" }]).should.be.false;
    });

    it("should validate remoteConfiguration", async () => {
        const rcVal = remoteConfigurationValidator();
        rcVal.should.exist;

        const sharedSecretConfig: IMindConnectConfiguration = require("../agentconfig.json");

        rcVal({}).should.be.false;
        rcVal([{}]).should.be.false;
        rcVal({ name: "test" }).should.be.false;
        rcVal({ name: 123 }).should.be.false;
        rcVal({ name: "testNode", validate: true }).should.be.false;
        rcVal({ name: "testNode", validate: true, eventvalidate: false }).should.be.false;
        rcVal({ name: "testNode", validate: true, validateevent: false }).should.be.false;
        rcVal({ name: "testNode", validate: true, validateevent: false, agentconfig: "" }).should.be.false;
        rcVal({ name: "testNode", validate: true, validateevent: false, agentconfig: {} }).should.be.false;
        rcVal({
            name: "testNode",
            configtype: "SHARED_SECRET",
            validate: true,
            validateevent: false,
            agentconfig: sharedSecretConfig,
            privatekey: "",
            model: "",
            chunk: false,
            disablekeepalive: false,
            retry: "7",
        }).should.be.false;

        rcVal({
            name: "testNode",
            configtype: "SHARED_SECRET",
            validate: true,
            validateevent: false,
            agentconfig: sharedSecretConfig,
            privatekey: "",
            model: "",
            chunk: false,
            disablekeepalive: false,
            retry: "0xa7",
            asyncduration: "23",
        }).should.be.false;

        rcVal({
            name: "testNode",
            configtype: "SHARED_SECRET",
            validate: true,
            validateevent: false,
            agentconfig: sharedSecretConfig,
            privatekey: "",
            model: "",
            chunk: false,
            disablekeepalive: false,
            retry: "7091",
            asyncduration: "23",
        }).should.be.true;
    });

    it("should validate node actions @ci", async () => {
        const actionVal = actionSchemaValidator();
        actionVal({}).should.be.false;
        actionVal({ action: "" }).should.be.false;
        actionVal({ action: "await", timestamp: new Date().toISOString() }).should.be.true;
        actionVal({ action: "renew", timestamp: new Date().toISOString() }).should.be.true;
        actionVal({ action: "non-existing-action", timestamp: new Date().toISOString() }).should.be.false;
    });
});
