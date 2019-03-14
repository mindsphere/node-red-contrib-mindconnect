// Copyright Siemens AG, 2019

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

    it("should instantiate", done => {
        helper.should.not.be.null;
        helper.should.not.be.undefined;
        mcnode.should.not.be.null;
        const flow = [{ id: "n1", type: "mindconnect", z: 320, name: "mindconnect", configtype: "RSA_3072" }];

        helper.load(mcnode, flow, () => {
            const n1 = helper.getNode("n1");
            n1.should.have.property("name", "mindconnect");
            done();
        });
    });
});
