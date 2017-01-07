'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	helpers = require('./helpers'),
	os = require('os'),
	path = require('path');

describe('sync project function', function() {

	var watcherOnSpy = sinon.stub(),
		register = helpers.getRegister({
			watchSpy: sinon.stub().returns({
				on: watcherOnSpy
			})
		}),
		projectsPath = os.tmpdir(),
		projectConfigPath = path.join(projectsPath, 'test_project', 'config.yaml'),
		app = helpers.createApp({projectsPath: projectsPath}),
		syncProject;

	before(function() {
		register(app);

		syncProject = watcherOnSpy.getCall(0).args[1];
	});

	describe('main', function() {
		it('should be a function', function() {
			expect(syncProject).a('function');
		});

		it('should accept two arguments', function() {
			expect(syncProject).length(2);
		});
	});

	describe('with already loaded project', function() {
		var project = {};

		before(function() {
			app.projects.get = sinon.stub().returns(project);
			app.projects.unload = sinon.stub();

			syncProject(projectConfigPath, null);
		});

		after(function() {
			delete app.projects.get;
			delete app.projects.unload;
		});

		it('should call projects get', function() {
			expect(app.projects.get.calledOnce).equal(true);
			expect(app.projects.get.getCall(0).args[0]).equal('test_project');
		});

		it('should call unload project', function() {
			expect(app.projects.unload.calledOnce).equal(true);
			expect(app.projects.unload.getCall(0).args[0]).equal('test_project');
		});
	});

	describe('with not yet loaded project', function() {
		var project = null;

		before(function() {
			app.projects.get = sinon.stub().returns(project);
			app.projects.unload = sinon.stub();

			syncProject(projectConfigPath, null);
		});

		after(function() {
			delete app.projects.get;
			delete app.projects.unload;
		});

		it('should call projects get', function() {
			expect(app.projects.get.calledOnce).equal(true);
			expect(app.projects.get.getCall(0).args[0]).equal('test_project');
		});

		it('should not call unload project', function() {
			expect(app.projects.unload.called).equal(false);
		});
	});

	describe('with file info', function() {
		var fileInfo = {};

		before(function() {
			app.projects.get = sinon.stub().returns(null);
			app.projects.load = sinon.stub();

			syncProject(projectConfigPath, fileInfo);
		});

		after(function() {
			delete app.projects.get;
			delete app.projects.load;
		});

		it('sholuld call projects load', function() {
			expect(app.projects.load.calledOnce).equal(true);
			expect(app.projects.load.getCall(0).args[0]).equal('test_project');
		});
	});

	describe('without file info', function() {
		var fileInfo = null;

		before(function() {
			app.projects.get = sinon.stub().returns(null);
			app.projects.load = sinon.stub();

			syncProject(projectConfigPath, fileInfo);
		});

		after(function() {
			delete app.projects.get;
			delete app.projects.load;
		});

		it('should not call projects load', function() {
			expect(app.projects.load.called).equal(false);
		});
	});
});
