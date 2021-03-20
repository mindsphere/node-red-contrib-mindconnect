// Copyright Siemens AG, 2019

import * as chai from "chai";
import { describe, it } from "mocha";
import { IConfigurationInfo } from "../src/mindconnect-schema";
import { configureAgent, copyConfiguration, retryWithNodeLog, sleep } from "../src/mindconnect-utils";
import helper = require("node-red-node-test-helper");
helper.init(require.resolve("node-red"));
chai.should();

describe("MindConnect Utils", () => {
    it("should be able to asynchronously wait", async () => {
        sleep.should.not.be.undefined;
        const then = new Date();
        await sleep(500);
        const now = new Date();
        (now.getTime() - then.getTime()).should.be.gte(490);
    });

    it("should be able to retry with node log", async () => {
        let retries = 0;
        const mock = { log: () => {}, status: () => {} };

        await retryWithNodeLog(
            5,
            () => {
                if (retries++ < 2) throw new Error("not yet");
            },
            "Test",
            mock
        );
        retries.should.be.greaterThan(2);
    });

    it("should be able to copy configuration", async () => {
        const config: IConfigurationInfo = {
            name: "Hello",
            configtype: "SHARED_SECRET",
            agentconfig: {
                content: {
                    baseUrl: "https://southgate.eu1.mindsphere.io",
                    iat: "...",
                    clientCredentialProfile: ["SHARED_SECRET"],
                    clientId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    tenant: "castidev",
                },
                expiration: new Date("2018-11-15T17:31:35.000Z"),
            },
            privatekey: "xx",
            model: "yy",
            validate: true,
            validateevent: false,
            chunk: true,
            disablekeepalive: true,
            retry: "2",
            parallel: "1",
            asyncduration: "3",
            emitcontrol: false,
            datalakeonly: false,
            supressverbosity: false,
        };

        const target = {} as IConfigurationInfo;
        copyConfiguration(target, config);
        target.should.be.deep.equal(config);
        target.privatekey.should.be.equal("xx");
        target.chunk.should.be.true;
    });

    it("should be able to configure agent", async () => {
        const config: IConfigurationInfo = {
            name: "Hello",
            configtype: "SHARED_SECRET",
            agentconfig: {
                content: {
                    baseUrl: "https://southgate.eu1.mindsphere.io",
                    iat: "...",
                    clientCredentialProfile: ["SHARED_SECRET"],
                    clientId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    tenant: "castidev",
                },
                expiration: new Date("2018-11-15T17:31:35.000Z"),
            },
            privatekey: "xx",
            model: "yy",
            validate: true,
            validateevent: false,
            chunk: true,
            disablekeepalive: true,
            retry: "2",
            parallel: "1",
            asyncduration: "3",
        };

        const mock = ({ log: () => {}, status: () => {} } as unknown) as IConfigurationInfo;
        configureAgent(mock, config);
        mock.agent.should.not.be.undefined;
        mock.agent._configuration.should.not.be.undefined;
        mock.should.be.deep.include(config);
    });

    it("should be able to validate correct configuration", async () => {
        const config: IConfigurationInfo = {
            name: "Hello",
            configtype: "RSA_3072",
            agentconfig: {
                content: {
                    baseUrl: "https://southgate.eu1.mindsphere.io",
                    iat: "...",
                    clientCredentialProfile: ["RSA_3072"],
                    clientId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    tenant: "castidev",
                },
                expiration: new Date("2018-11-15T17:31:35.000Z"),
            },
            privatekey: "-----BEGIN RSA PRIVATE KEY----- -----END RSA PRIVATE KEY-----\n",
            model: "yy",
            validate: true,
            validateevent: false,
            chunk: true,
            disablekeepalive: false,
            retry: "2",
            parallel: "1",
            asyncduration: "3",
        };

        let errorCalled = false;
        let logCalled = false;
        const errors = [];

        const mock = ({
            log: () => {
                logCalled = true;
            },
            status: () => {},
            error: (x) => {
                errors.push(x);
                errorCalled = true;
            },
        } as unknown) as IConfigurationInfo;

        configureAgent(mock, config);
        mock.agent.should.not.be.undefined;
        mock.agent._configuration.should.not.be.undefined;
        mock.should.be.deep.include(config);
        errorCalled.should.be.false;
        errors.length.should.equal(0);
        logCalled.should.be.true;
    });

    it("should be able to throw an error on incorrect certificate ", async () => {
        const config: IConfigurationInfo = {
            name: "Hello",
            configtype: "RSA_3072",
            agentconfig: {
                content: {
                    baseUrl: "https://southgate.eu1.mindsphere.io",
                    iat: "...",
                    clientCredentialProfile: ["RSA_3072"],
                    clientId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                    tenant: "castidev",
                },
                expiration: new Date("2018-11-15T17:31:35.000Z"),
            },
            privatekey: "-----BEGIN RSA PRIVATE KEY-----\n",
            model: "yy",
            validate: true,
            validateevent: false,
            chunk: true,
            disablekeepalive: true,
            retry: "2",
            parallel: "1",
            asyncduration: "3",
        };

        let errorCalled = false;
        const errors = [];

        const mock = ({
            log: () => {},
            status: () => {},
            error: (x) => {
                errors.push(x);
                errorCalled = true;
            },
        } as unknown) as IConfigurationInfo;

        configureAgent(mock, config);
        mock.agent.should.not.be.undefined;
        mock.agent._configuration.should.not.be.undefined;
        mock.should.be.deep.include(config);
        errorCalled.should.be.true;
        errors.length.should.equal(1);
        errors[0].toString().should.include("END RSA PRIVATE KEY");
    });
});
