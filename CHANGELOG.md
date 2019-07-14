# Changelog

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
