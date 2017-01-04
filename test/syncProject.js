'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	proxyquire = require('proxyquire').noCallThru();

describe('sync project function', function() {

	var watcherSpy = {
		on: sinon.stub()
	};

	var module = proxyquire('../lib/index', {
		chokidar: {
			watch: sinon.stub().returns(watcherSpy)
		}
	});

	var app = {
		lib: {logger: function() {
			return {log: sinon.stub()};
		}},
		config: {paths: {projects: '/tmp'}},
		projects: {}
	};

	var syncProject;

	before(function() {
		module.register(app);

		syncProject = watcherSpy.on.getCall(0).args[1];
	});

	describe('main', function() {
		it('should be a function', function() {
			expect(syncProject).a('function');
		});

		it('should accept two arguments', function() {
			expect(syncProject).length(2);
		});
	});

	describe('unload loaded project', function() {
		before(function() {
			app.projects.get = sinon.stub().returns({});
			app.projects.unload = sinon.stub();

			syncProject('/tmp/test_project/config.yaml', null);
		});

		after(function() {
			delete app.projects.get;
			delete app.projects.unload;
		});

		it('call project get', function() {
			expect(app.projects.get.calledOnce).equal(true);
			expect(app.projects.get.getCall(0).args[0]).equal('test_project');
		});

		it('unload loaded project', function() {
			expect(app.projects.unload.calledOnce).equal(true);
			expect(app.projects.unload.getCall(0).args[0]).equal('test_project');
		});
	});

	describe('do not unload not loaded project', function() {
		before(function() {
			app.projects.get = sinon.stub().returns(null);
			app.projects.unload = sinon.stub();

			syncProject('/tmp/test_project/config.yaml', null);
		});

		after(function() {
			delete app.projects.get;
			delete app.projects.unload;
		});

		it('call project get', function() {
			expect(app.projects.get.calledOnce).equal(true);
			expect(app.projects.get.getCall(0).args[0]).equal('test_project');
		});

		it('do not unload loaded project', function() {
			expect(app.projects.unload.called).equal(false);
		});
	});

});
