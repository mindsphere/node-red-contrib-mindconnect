// Copyright Siemens AG, 2019

import { IMindConnectConfiguration } from "@mindconnect/mindconnect-nodejs";
import * as chai from "chai";
import { describe, it } from "mocha";
import {
    bulkUploadValidator,
    eventSchemaValidator,
    fileInfoValidator,
    remoteConfigurationValidator,
    timeSeriesValidator
} from "../src/mindconnect-schema";
chai.should();

describe("Schema Validators", () => {
    it("should instantiate all validators", () => {
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
    });

    it("should validate events", async () => {
        const eventVal = eventSchemaValidator();
        eventVal.should.exist;

        const event = {
            sourceType: "Agent",
            sourceId: "application",
            source: "MindConnect Agent",
            severity: 80,
            description: "Event sent at " + new Date().toISOString(),
            timestamp: new Date().toISOString()
        };
        await eventVal({ sourceType: "Agent" }).should.be.false;
        await eventVal({ event }).should.be.false;
        await eventVal(event).should.be.true;
    });

    it("should validate fileInfos", async () => {
        const fiVal = fileInfoValidator();
        fiVal.should.exist;

        const fileInfo = {
            entityId: "1234567890abcdef1234567890abcdef", // optional
            fileName: "package.json",
            fileType: "application/json", // optional
            description: "testfile"
        };

        await fiVal({}).should.be.false;
        await fiVal(fileInfo).should.be.true;
        delete fileInfo.entityId;
        await fiVal(fileInfo).should.be.true;
        delete fileInfo.fileType;
        await fiVal(fileInfo).should.be.true;
        delete fileInfo.fileName;
        await fiVal(fileInfo).should.be.false;
        fileInfo.fileName = "blubb";
        delete fileInfo.description;
        await fiVal(fileInfo).should.be.false;
    });

    it("should validate timeseries", async () => {
        const tsVal = timeSeriesValidator();
        tsVal.should.exist;
        const values = [
            {
                dataPointId: "1541718362027",
                qualityCode: "1",
                value: "47"
            }
        ];

        await tsVal({}).should.be.false;
        await tsVal(values).should.be.true;

        for (let index = 0; index < 10; index++) {
            values.push({ dataPointId: "123", qualityCode: "1", value: "33.5" });
        }
        await tsVal(values).should.be.true;

        (values as any[]).push({ xdataPointId: "123", qualityCode: "1", value: "33.5" }); // * invalid data point
        await tsVal(values).should.be.false;
        await tsVal([{ xdataPointId: "123", qualityCode: "1", value: "33.5" }]).should.be.false;
    });

    it("should validate bulk", async () => {
        const buVal = bulkUploadValidator();
        buVal.should.exist;
        const values = [
            {
                dataPointId: "1541718362027",
                qualityCode: "1",
                value: "47"
            }
        ];

        await buVal([{ timeSTAMP: new Date().toISOString(), values: values }]).should.be.false;
        await buVal([{ timestamp: new Date().toISOString(), values: values }]).should.be.true;

        for (let index = 0; index < 10; index++) {
            values.push({ dataPointId: "123", qualityCode: "1", value: "33.5" });
        }
        await buVal([{ timestamp: new Date().toISOString(), values: values }]).should.be.true;

        (values as any[]).push({ xdataPointId: "123", qualityCode: "1", value: "33.5" }); // * invalid data point
        await buVal([{ timestamp: new Date().toISOString(), values: values }]).should.be.true;
        await buVal([{ xdataPointId: "123", qualityCode: "1", value: "33.5" }]).should.be.false;
    });

    it("should validate remoteConfiguration", async () => {
        const rcVal = remoteConfigurationValidator();
        rcVal.should.exist;

        const sharedSecretConfig: IMindConnectConfiguration = require("../agentconfig.json");

        await rcVal({}).should.be.false;
        await rcVal([{}]).should.be.false;
        await rcVal({ name: "test" }).should.be.true;
        await rcVal({ name: 123 }).should.be.false;
        await rcVal({ name: "testNode", validate: true }).should.be.true;
        await rcVal({ name: "testNode", validate: true, eventvalidate: false }).should.be.true;
        await rcVal({ name: "testNode", validate: true, validateevent: false }).should.be.true;
        await rcVal({ name: "testNode", validate: true, validateevent: false, agentconfig: "" }).should.be.false;
        await rcVal({ name: "testNode", validate: true, validateevent: false, agentconfig: {} }).should.be.false;
        await rcVal({
            name: "testNode",
            validate: true,
            validateevent: false,
            agentconfig: sharedSecretConfig
        }).should.be.true;
    });
});
