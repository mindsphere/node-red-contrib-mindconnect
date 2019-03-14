// Copyright Siemens AG, 2019

import { IMindConnectConfiguration } from "@mindconnect/mindconnect-nodejs";
import * as chai from "chai";
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
            done();
        });
    });
});
