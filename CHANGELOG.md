# Changelog

## 3.12.0 (Vienna Siberian Tigers) - May 2021

## New Features 3.12.0

- Support for "bidirectional" communication with MindSphere [#129]
- new message type to read asset information [#129]
- new message type to execute a custom javascript script using MindSphere javascript/typescript SDK [#129]
- Bumped all dependencies

## 3.11.0 (Vienna Jaguarundi) - March 2021

## New Features 3.11.0

- **Important** Bugfix for Unitless Mapping (see below)
- Implemented Support for EU2 Data Lake
- New setting: **Data Lake Only** - the node will not try to retrieve configuration if it only used for data lake
- New setting: **Emit control message** - the node will emit a message which can be used to control the data ingest
- New setting: **Hide request statatus information** - reduces the node verbosity
- New example flows on [https://playgound.mindconnect.rocks](https://playgound.mindconnect.rocks) - queing the messages, handling ingest pressure
- Documented how to manage the node configuration from the flow on playground.
- Bumped all dependencies
- Restructured files for better readability
- Upgraded json schema definitions for ajv v7 reqirements

## Bugfix 3.11.0

- **Important** - There is now a new type of mapping in MindSphere (unitless mapping) which versions before 3.11.0 are not aware of and which was causing the node to create mappings with the *"null"* unit. (that is "null" as a string). This is fixed in version 3.11.0. It is **strongly recommended** to upgrade to 3.11.0 if you are using automatic mapping feature.

## 3.10.0 (Vienna European Shorthair) - November 2020

## New Features 3.10.0

- Support for Generation of Signed Upload URLs
- Data Lake File Upload Support
- Better error messages when the node input is misconfigured
- Bumped all dependencies

## Bugfix 3.10.0

- The node now handles long asset names correctly

## 3.9.2 (Vienna Bobcats) - October 2020

## Bugfix 3.9.2

- Node not working properly on IOT 2040 with Node-RED 0.20.7 (#107)

## 3.9.1 (Vienna Bobcats) - September 2020

## Bugfix 3.9.1

- Node not loading on raspberry pi with chromium 79.0 (#103)
- Copy to clipboard not working on raspberry pi with chromium 79.0 (#104)

## 3.9.0 (Vienna Bobcats) - September 2020

## New Features 3.9.0

- Automatical Data Source Configuration and Mapping to a selected asset. (#89)
- Configuration Information Dialog about current agent state.
- Buttons to copy timeseries-, bulk timeseries-, event- and file- templates to the clipboard.
- New examples on <https://playground.mindconnect.rocks> for flows
- MindSphere Start for Free suited example on <https://playground.mindconnect.rocks>
- Bumped all dependencies

## 3.8.1 (Vienna Tigers) - July 2020

## Bugfix 3.8.1

- Removed Ajv from global scope

## 3.8.0 (Vienna Tigers) - July 2020

## New Features 3.8.0

- Custom Event Support via _customEvent switch on the message.
- Added msg._includeMindSphereToken and msg._ignorePayload switch which propagates the MindSphere Authentication Token in msg.headers
- The msg._includeMindSphereToken switch can be used in conjuction with the http request node to call custom southbound mindsphere APIs (#83)
- New examples on <https://playground.mindconnect.rocks> for flows
- Bumped all dependencies
- New Logo <3

## BugFix 3.8.0

- Node is now Node-RED 1.10 compatible.

## 3.7.0 (Vienna Ocelots) - April 2020

## New Features 3.7.0

- new docker images with version 1.0.* for multiple architectures
- the old 0.20.* based docker images are now deprecated
- the node has now a link to agent diagnostic application in the mindsphere
- new configuration button to delete all local data of the agent (including the .mc/agentconfig.json)
- the node will await parallel asynchronous requests automatically after configured number of seconds
- the node will regularly display information about asynchronous requests

### Important docker image user change - for users upgrading from versions before 3.7.0

If you are using host directories for docker persistence and you are upgrading from previous version of docker images (which were based on 0.20.* version of node red) you will have to ensure that any existing data and .mc directory has the correct ownership.
As of 1.0 this needs to be 1000:1000. This can be forced by running the command

```bash
sudo chown -R 1000:1000 path/to/your/node-red/data
sudo chown -R 1000:1000 path/to/your/node-red/data/.mc
```

on the host system.

Consider using docker named volumes instead.

This is necessary because of the change in the base docker image of node-red. See also <https://nodered.org/docs/getting-started/docker>

## Bugfixes 3.7.0

- the node now removes previous keep alive and async logging interval on redeployement (#39)
- fixed CSS for node-red > 1.0.0 (the node title is white again)
- updated to mindconnect-nodejs 3.7.0
- bumped all dependencies

Stay strong, safe and healthy! <3 :hearth:

## 3.6.2 (Vienna Jungle Cats) - September 2019

## Bugfixes 3.6.2

- Fixed problem with cached agent configuration which was preventing redeployments.

## 3.6.1 (Vienna Jungle Cats) - July 2019 - Recovery

## Bugfixes 3.6.1

- Security fix: Bumped the lodash dependency to 4.17.4

## 3.6.0 (Vienna Jungle Cats) - July 2019

## New Features 3.6.0

- Added Links to MindSphere OpenSource Tools and Libraries Documentation
- upgraded to version 3.6.0 of the mindconnect-nodejs library
- bumped all dependencies
- added explicit :rw to the docker container documentation (see #39)

## Bugfixes 3.6.0

- improved documentation in README.md

## 3.5.0 (Vienna Clouded Leopards) - May 2019

## New Features 3.5.0

- updated to version 3.5.3 of mindconnect-nodejs library
- chunked upload is now using the multipart upload file API
- there is a new experimental parameter max async uploads: If this setting is > 1 the node will not wait for every request to finish
- switched documentation generation to compodoc as typedoc doesn't seem to be maintained
- bumped all versions

## Bugfixes 3.5.0

- improved documentation in README.md

## 3.4.0 (Vienna Caracals) - April 2019

## New Features 3.4.0

- updated to version 3.4.0. of mindconnect-nodejs library.
- auto keep-alive: the node will renew the token every hour even when there is no data sent.
- programatic delivery of the configuration - prerequisite for auto-configuration node which is coming in next versions
- moved schema-validation to mindconnect-schema.ts, improved code and documentation
- new msg._error message with timestamped error property for better flows

## 3.3.0 (Vienna Panthers) - February 2019

### New Features 3.3.0

- Updated to version 3.3.0. of mindconnect library
- added container build process on hub.docker.com
- direct link to configuration settings in MindSphere from Node-RED UI
- improved error handling

### Bugfix 3.3.0

- fixed the issue #3 Failed to load mindconnect node when modifying the URL root path #3

## 3.2.0 (Vienna Lynx) - January 2019

### New Features 3.2.0

- Updated to version 3.2.0. of mindconnect library
- MIT License
- use flows.json as default

## 3.0.2 (Vienna Wildcats) - November 2018

### New Features 3.0.2

- Updated to version 3.0.2. of mindconnect library
- Improved documentation

## 3.0.1 (Vienna Wildcats) - November 2018

### New Features 3.0.1

- Preparation for release
- Added support for RSA_3072
- Added Bulk Upload
- Retries for mindsphere operations

## 3.0.0 - Beta 2 (Vienna Kittens) - April 2018

### New Features 3.0.0 - beta 2

- Added support for events.
- Added support for file upload.
- Added editable node name.
- Added editable settings for validation and chunking.
- Added security audit and legal audit to build in preparation for publication.

## 3.0.0 - alpha 1 (Vienna Horses) - April 2018

### New Features 3.0.0 - alpha 1

- Provided Docker Images for x86 and arm architectures.
- Provided Docker Images for x86 and arm architectures with siemens proxy (COIA) support.
- Shamelessly upgraded the version to 3.0.0 to match mindconnect-nodejs library.
- Initial support for nodejs.
- Retired mindsphere 2 branch.
