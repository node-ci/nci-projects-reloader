'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	libModule = require('../lib'),
	helpers = require('./helpers'),
	path = require('path'),
	os = require('os');

describe('lib', function() {

	describe('module', function() {
		it('should export register function', function() {
			expect(libModule.register).a('function');
		});

		it('should export funct which accepts single arg', function() {
			expect(libModule.register).length(1);
		});
	});

	var watcherConstructorSpy = sinon.stub(),
		watcherOnSpy = sinon.stub(),
		register = helpers.getRegister({
			watchSpy: watcherConstructorSpy.returns({
				on: watcherOnSpy
			})
		}),
		projectsPath = os.tmpdir(),
		app = helpers.createApp({projectsPath: projectsPath}),
		syncProject;

	before(function() {
		register(app);

		syncProject = watcherOnSpy.getCall(0).args[1];
	});

	describe('register function', function() {
		it('should create watcher', function() {
			expect(watcherConstructorSpy.calledOnce).equal(true);
			var args = watcherConstructorSpy.getCall(0).args;
			expect(args[0]).equal(path.join(projectsPath, '*', 'config.*'));
			expect(args[1]).eql({ignoreInitial: true, depth: 1});
		});

		it('should bind sync project to watcher add', function() {
			var args = watcherOnSpy.getCall(0).args;
			expect(args[0]).equal('add');
			expect(args[1]).equal(syncProject);
		});

		it('should bind sync project to watcher change', function() {
			var args = watcherOnSpy.getCall(1).args;
			expect(args[0]).equal('change');
			expect(args[1]).equal(syncProject);
		});

		it('should bind sync project to watcher unlink', function() {
			var args = watcherOnSpy.getCall(2).args;
			expect(args[0]).equal('unlink');
			expect(args[1]).equal(syncProject);
		});

		it('should add handler for watcher error', function() {
			var args = watcherOnSpy.getCall(3).args;
			expect(args[0]).equal('error');
		});

		it('should call watcher.on 4 times in total', function() {
			expect(watcherOnSpy.callCount).equal(4);
		});

	});

});
