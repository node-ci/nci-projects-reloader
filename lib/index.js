'use strict';

var path = require('path'),
	chokidar = require('chokidar');

exports.register = function(app) {
	var logger = app.lib.logger('projects reloader');

	// start file watcher for reloading projects on change
	var addOrChangeProject = function(filename) {
		var projectName = path.relative(
			app.config.paths.projects,
			path.dirname(filename)
		);

		if (app.projects.get(projectName)) {
			logger.log('Unload project: "' + projectName + '"');
			app.projects.unload({name: projectName});
		}

		logger.log('Load project "' + projectName + '" on change');
		app.projects.load({name: projectName}, function(err) {
			if (err) {
				return logger.error(
					'Error during load project "' + projectName + '": ',
					err.stack || err
				);
			}
			logger.log(
				'Project "' + projectName + '" loaded:',
				JSON.stringify(app.projects.get(projectName), null, 4)
			);
		});
	};	

	var unlinkProject = function(filename) {
		var projectName = path.relative(
			app.config.paths.projects,
			path.dirname(filename)
		);

		if (app.projects.get(projectName)) {
			logger.log('Unload project: "' + projectName + '"');
			app.projects.unload({name: projectName});
		}
	};



	// NOTE: currently after add remove and then add same file events will
	// not be emitted
	var watcher = chokidar.watch(
		path.join(app.config.paths.projects, '*', 'config.*'),
		{ignoreInitial: true, depth: 1}
	);
	watcher.on('add', addOrChangeProject);
	watcher.on('change', addOrChangeProject);
	watcher.on('unlink', unlinkProject);


	watcher.on('error', function(err) {
		logger.error('File watcher error occurred: ', err.stack || err);
	});
};
