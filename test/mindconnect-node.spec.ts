// Copyright Siemens AG, 2019

import { IMindConnectConfiguration, MindConnectAgent } from "@mindconnect/mindconnect-nodejs";
import * as chai from "chai";
import { it } from "mocha";
import mcnode = require("../src/mindconnect.js");
import helper = require("node-red-node-test-helper");
helper.init(require.resolve("node-red"));
chai.should();

describe("MindConnect Node-RED node", () => {
    before(done => {
        helper.startServer(done);
    });

    after(done => {
        helper.stopServer(done);
    });

    afterEach(function() {
        helper.unload();
    });

    const sharedSecretConfig: IMindConnectConfiguration = require("../agentconfig.json");

    const nodeTemplate = {
        type: "mindconnect",
        configtype: "SHARED_SECRET",
        agentconfig: JSON.stringify(sharedSecretConfig),
        privatekey: "",
        model: "",
        validate: true,
        validateevent: true,
        chunk: false,
        disablekeepalive: false,
        retry: "3"
    };

    it("should instantiate", done => {
        helper.should.not.be.null;
        helper.should.not.be.undefined;
        mcnode.should.not.be.null;
        const flow = [
            {
                id: "n1",
                name: "mindconnect",
                ...nodeTemplate
            }
        ];

        helper.load(mcnode, flow, () => {
            const n1 = helper.getNode("n1");
            n1.should.have.property("name", "mindconnect");
            n1.should.have.property("configtype", "SHARED_SECRET");
            n1.should.have.property("validate", true);
            n1.should.have.property("retry", "3");
            done();
        });
    });

    it("should validate data before sending to MindSphere", done => {
        const flow = [{ id: "n1", ...nodeTemplate, wires: [["n2"]] }, { id: "n2", type: "helper" }];

        helper.load(mcnode, flow, () => {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", msg => {
                msg.should.have.property("_mindsphereStatus", "Error");
                done();
            });
            const values = [{ datapoint: "unexistent", qualityCode: "244", value: "42" }];
            n1.receive({ _time: new Date(), payload: values });
        });
    });

    it("should send timeseries data to MindSphere", done => {
        const flow = [{ id: "n1", ...nodeTemplate, wires: [["n2"]] }, { id: "n2", type: "helper" }];

        helper.load(mcnode, flow, async () => {
            const n1 = helper.getNode("n1");

            const agent = n1.agent as MindConnectAgent;
            const config = await agent.GetDataSourceConfiguration();

            const n2 = helper.getNode("n2");
            n2.on("input", msg => {
                msg.should.have.property("_mindsphereStatus", "OK");
                done();
            });

            const values = [];
            config.dataSources.forEach(dataSource => {
                dataSource.dataPoints.forEach(datapoint => {
                    values.push({
                        dataPointId: datapoint.id.toString(),
                        qualityCode: "0",
                        value: Math.floor(Math.random() * 101).toString()
                    });
                });
            });

            n1.receive({ _time: new Date(), payload: values });
        });
    });

    it("should send bulk timeseries data to MindSphere", done => {
        const flow = [{ id: "n1", ...nodeTemplate, wires: [["n2"]] }, { id: "n2", type: "helper" }];

        helper.load(mcnode, flow, async () => {
            const n1 = helper.getNode("n1");

            const agent = n1.agent as MindConnectAgent;
            const config = await agent.GetDataSourceConfiguration();

            const n2 = helper.getNode("n2");
            n2.on("input", msg => {
                msg.should.have.property("_mindsphereStatus", "OK");
                done();
            });

            const values = [];
            config.dataSources.forEach(dataSource => {
                dataSource.dataPoints.forEach(datapoint => {
                    values.push({
                        dataPointId: datapoint.id.toString(),
                        qualityCode: "0",
                        value: Math.floor(Math.random() * 101).toString()
                    });
                });
            });

            n1.receive({ payload: [{ timestamp: new Date().toISOString(), values: values }] });
        });
    });

    it("should send events to mindsphere", done => {
        const flow = [{ id: "n1", ...nodeTemplate, wires: [["n2"]] }, { id: "n2", type: "helper" }];

        helper.load(mcnode, flow, () => {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", msg => {
                msg.should.have.property("_mindsphereStatus", "OK");
                done();
            });
            n1.receive({
                payload: {
                    sourceType: "UnitTest Agent",
                    sourceId: "application",
                    source: "MindConnect Agent",
                    severity: 40, // ? 0-99 : 20:error, 30:warning, 40: information
                    description: "Event sent at " + new Date().toISOString(),
                    timestamp: new Date().toISOString()
                }
            });
        });
    });

    it("should send files to mindsphere", done => {
        const flow = [{ id: "n1", ...nodeTemplate, wires: [["n2"]] }, { id: "n2", type: "helper" }];

        helper.load(mcnode, flow, () => {
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n2.on("input", msg => {
                msg.should.have.property("_mindsphereStatus", "OK");
                done();
            });
            n1.receive({
                payload: {
                    fileName: "README.md",
                    description: `File last uploaded on ${new Date().toISOString()}`
                }
            });
        });
    });
});
