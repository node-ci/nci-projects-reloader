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

	describe('main', function() {
		before(function() {
			watcherAddSpy.reset();
			watcherChangeSpy.reset();
			watcherRemoveSpy.reset();
		});

		it('should be created without errors', function() {
			watcher = chokidar.watch(
				path.join(projectsPath, '*', 'config.*'),
				{ignoreInitial: true, depth: 1}
			);

			watcher.on('add', watcherAddSpy);
			watcher.on('change', watcherChangeSpy);
			watcher.on('unlink', watcherRemoveSpy);
			watcher.on('error', watcherErrorSpy);
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
	var spyCalledOnceDelay = 50;
	var spyCalledOnceTime = 0;
	// remember first time of detecting changes for using it in test below
	var spyCalledOnceFirstTime;
	var waitForSpyCalledOnce = function(spy, callback) {
		if (spy.calledOnce) {
			if (!spyCalledOnceFirstTime) {
				spyCalledOnceFirstTime = spyCalledOnceTime;
			}
			spyCalledOnceTime = 0;
			callback();
		} else {
			spyCalledOnceTime += spyCalledOnceDelay;
			setTimeout(function() {
				waitForSpyCalledOnce(spy, callback);
			}, spyCalledOnceDelay);
		}
	};

	var projectPath,
		projectConfigPath;

	describe('when new file added', function() {
		before(function(done) {
			projectPath = path.join(projectsPath, 'test_project');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			watcherAddSpy.reset();
			watcherChangeSpy.reset();
			watcherRemoveSpy.reset();

			fs.writeFile(projectConfigPath, 'some text', function(err) {
				if (err) {
					done(err);
				} else {
					waitForSpyCalledOnce(watcherAddSpy, done);
				}
			});
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
			projectPath = path.join(projectsPath, 'test_project2');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			watcherAddSpy.reset();

			fs.writeFile(projectConfigPath, 'some text', function(err) {
				if (err) {
					done(err);
				} else {
					waitForSpyCalledOnce(watcherAddSpy, done);
				}
			});
		});

		before(function(done) {
			watcherAddSpy.reset();
			watcherChangeSpy.reset();
			watcherRemoveSpy.reset();

			fs.appendFile(projectConfigPath, 'another text', function(err) {
				if (err) {
					done(err);
				} else {
					waitForSpyCalledOnce(watcherChangeSpy, done);
				}
			});
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
			projectPath = path.join(projectsPath, 'test_project3');
			projectConfigPath = path.join(projectPath, 'config.txt');

			fs.mkdir(projectPath, done);
		});

		before(function(done) {
			watcherAddSpy.reset();

			fs.writeFile(projectConfigPath, 'some text', function(err) {
				if (err) {
					done(err);
				} else {
					waitForSpyCalledOnce(watcherAddSpy, done);
				}
			});
		});

		before(function(done) {
			watcherAddSpy.reset();
			watcherChangeSpy.reset();
			watcherRemoveSpy.reset();

			fs.unlink(projectConfigPath, function(err) {
				if (err) {
					done(err);
				} else {
					waitForSpyCalledOnce(watcherRemoveSpy, done);
				}
			});
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
			watcherAddSpy.reset();

			fs.writeFile(projectConfigPath, 'some text', function(err) {
				if (err) {
					done(err);
				} else {
					waitForSpyCalledOnce(watcherAddSpy, done);
				}
			});
		});

		before(function(done) {
			fs.unlink(projectConfigPath, done);
		});

		before(function(done) {
			watcherAddSpy.reset();
			watcherChangeSpy.reset();
			watcherRemoveSpy.reset();

			// + 500 ms to be sure
			var timeout = spyCalledOnceFirstTime + 500;

			fs.writeFile(projectConfigPath, 'some text', function(err) {
				if (err) {
					done(err);
				} else {
					setTimeout(done, timeout);
				}
			});
		});

		after(function(done) {
			fs.unlink(projectConfigPath, done);
		});

		after(function(done) {
			fs.rmdir(projectPath, done);
		});

		it('should not emit any events', function() {
			expect(watcherAddSpy.called).equal(false);
			expect(watcherChangeSpy.called).equal(false);
			expect(watcherRemoveSpy.called).equal(false);
			expect(watcherErrorSpy.called).equal(false);
		});
	});

});