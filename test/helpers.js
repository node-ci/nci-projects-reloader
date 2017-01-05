'use strict';

var sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

exports.getRegister = function(params) {
	return proxyquire('../lib/index', {
		chokidar: {
			watch: params.watchSpy
		}
	}).register;
};

exports.createApp = function(params) {
	return {
		lib: {logger: function() {
			return {log: sinon.stub()};
		}},
		config: {paths: {projects: params.projectsPath}},
		projects: {}
	};
};
