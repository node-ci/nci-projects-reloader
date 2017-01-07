'use strict';

var expect = require('expect.js'),
	sinon = require('sinon'),
	os = require('os'),
	fs = require('fs'),
	path = require('path'),
	chokidar = require('chokidar');

describe('watcher', function() {

	var projectsPath = path.join(
		os.tmpdir(),
		'nci-projects-reloaded-test-' + Date.now()
	);

	before(function(done) {
		fs.mkdir(projectsPath, done);
	});

	after(function(done) {
		fs.rmdir(projectsPath, done);
	});

	var watcher,
		watcherAddSpy = sinon.stub(),
		watcherChangeSpy = sinon.stub(),
		watcherRemoveSpy = sinon.stub(),
		watcherErrorSpy = sinon.stub();

	var resetWatcherSpies = function() {
		watcherAddSpy.reset();
		watcherChangeSpy.reset();
		watcherRemoveSpy.reset();
		watcherErrorSpy.reset();
	};

	var projectPath,
		projectConfigPath;

	describe('main', function() {
		before(function(done) {
			projectPath = path.join(projectsPath, 'test_project');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.writeFile(projectConfigPath, 'some text', done);
		});

		after(function(done) {
			fs.unlink(projectConfigPath, done);
		});

		after(function(done) {
			fs.rmdir(projectPath, done);
		});

		it('should be created without errors', function(done) {
			watcher = chokidar.watch(
				path.join(projectsPath, '*', 'config.*'),
				{ignoreInitial: true, depth: 1}
			);

			watcher.on('add', watcherAddSpy);
			watcher.on('change', watcherChangeSpy);
			watcher.on('unlink', watcherRemoveSpy);
			watcher.on('error', watcherErrorSpy);

			watcher.on('ready', done);
		});

		it('should not emit initial events', function() {
			expect(watcherAddSpy.called).equal(false);
			expect(watcherChangeSpy.called).equal(false);
			expect(watcherRemoveSpy.called).equal(false);
			expect(watcherErrorSpy.called).equal(false);
		});
	});

	// coz file watcher need some time to detect file change we need some
	// helper for waiting for it
	var waitForSpyCalledOnce = function(spy, callback) {
		if (spy.calledOnce) {
			callback();
		} else {
			setTimeout(function() {
				waitForSpyCalledOnce(spy, callback);
			}, 50);
		}
	};

	// create callback which passes error or call waitForSpyCalledOnce
	var createWaitForSpyCalledOnceCallback = function(spy, callback) {
		return function(err) {
			if (err) {
				callback(err);
			} else {
				waitForSpyCalledOnce(spy, callback);
			}
		};
	};

	describe('when new file added', function() {
		before(function(done) {
			projectPath = path.join(projectsPath, 'test_project2');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.writeFile(
				projectConfigPath,
				'some text',
				createWaitForSpyCalledOnceCallback(watcherAddSpy, done)
			);
		});

		after(function(done) {
			fs.unlink(projectConfigPath, done);
		});

		after(function(done) {
			fs.rmdir(projectPath, done);
		});

		it('should emit add event', function() {
			expect(watcherAddSpy.calledOnce).equal(true);
			expect(watcherChangeSpy.called).equal(false);
			expect(watcherRemoveSpy.called).equal(false);
			expect(watcherErrorSpy.called).equal(false);
		});

		it('should pass file name and info to event handler', function() {
			var args = watcherAddSpy.getCall(0).args;
			expect(args[0]).equal(projectConfigPath);
			expect(args[1]).ok();
		});
	});

	describe('when existing file changed', function() {
		before(function(done) {
			projectPath = path.join(projectsPath, 'test_project3');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.writeFile(
				projectConfigPath,
				'some text',
				createWaitForSpyCalledOnceCallback(watcherAddSpy, done)
			);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.appendFile(
				projectConfigPath,
				'another text',
				createWaitForSpyCalledOnceCallback(watcherChangeSpy, done)
			);
		});

		after(function(done) {
			fs.unlink(projectConfigPath, done);
		});

		after(function(done) {
			fs.rmdir(projectPath, done);
		});

		it('should emit change event', function() {
			expect(watcherAddSpy.called).equal(false);
			expect(watcherChangeSpy.calledOnce).equal(true);
			expect(watcherRemoveSpy.called).equal(false);
			expect(watcherErrorSpy.called).equal(false);
		});

		it('should pass file name and info to event handler', function() {
			var args = watcherChangeSpy.getCall(0).args;
			expect(args[0]).equal(projectConfigPath);
			expect(args[1]).ok();
		});
	});

	describe('when existing file removed', function() {
		before(function(done) {
			projectPath = path.join(projectsPath, 'test_project4');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.writeFile(
				projectConfigPath,
				'some text',
				createWaitForSpyCalledOnceCallback(watcherAddSpy, done)
			);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.unlink(
				projectConfigPath,
				createWaitForSpyCalledOnceCallback(watcherRemoveSpy, done)
			);
		});

		after(function(done) {
			fs.rmdir(projectPath, done);
		});

		it('should emit remove event', function() {
			expect(watcherAddSpy.called).equal(false);
			expect(watcherChangeSpy.called).equal(false);
			expect(watcherRemoveSpy.calledOnce).equal(true);
			expect(watcherErrorSpy.called).equal(false);
		});

		it('should pass only file name to event handler', function() {
			var args = watcherRemoveSpy.getCall(0).args;
			expect(args[0]).equal(projectConfigPath);
			expect(args[1]).not.ok();
		});
	});

	describe('when previously removed file was added again', function() {
		before(function(done) {
			projectPath = path.join(projectsPath, 'test_project');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.writeFile(
				projectConfigPath,
				'some text',
				createWaitForSpyCalledOnceCallback(watcherAddSpy, done)
			);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.unlink(
				projectConfigPath,
				createWaitForSpyCalledOnceCallback(watcherRemoveSpy, done)
			);
		});

		before(function(done) {
			resetWatcherSpies();

			fs.writeFile(
				projectConfigPath,
				'some text',
				createWaitForSpyCalledOnceCallback(watcherAddSpy, done)
			);
		});

		after(function(done) {
			fs.unlink(projectConfigPath, done);
		});

		after(function(done) {
			fs.rmdir(projectPath, done);
		});

		it('should emit add event', function() {
			expect(watcherAddSpy.calledOnce).equal(true);
			expect(watcherChangeSpy.called).equal(false);
			expect(watcherRemoveSpy.called).equal(false);
			expect(watcherErrorSpy.called).equal(false);
		});

		it('should pass file name and info to event handler', function() {
			var args = watcherAddSpy.getCall(0).args;
			expect(args[0]).equal(projectConfigPath);
			expect(args[1]).ok();
		});
	});

});
