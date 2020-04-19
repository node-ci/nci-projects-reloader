# nci projects reloader

On disk changes projects reloader for nci for [nci](https://github.com/node-ci/nci).

[![Npm version](https://img.shields.io/npm/v/nci-projects-reloader.svg)](https://www.npmjs.org/package/nci-projects-reloader)
[![Build Status](https://travis-ci.org/node-ci/nci-projects-reloader.svg?branch=master)](https://travis-ci.org/node-ci/nci-projects-reloader)
[![Known Vulnerabilities](https://snyk.io/test/npm/nci-projects-reloader/badge.svg)](https://snyk.io/test/npm/nci-projects-reloader)


## Node.js compatibility

This plugin requires node.js >= 10 to work.


## Installation

```sh
npm install nci-projects-reloader
```

## Usage

To enable add this plugin to the `plugins` section at server config:

```json
{
    "plugins": [
        "nci-projects-reloader"
    ]
....
}
```

after that when you change any project config (or add new project) on disk it
will be automatically updated within currently running nci server.
