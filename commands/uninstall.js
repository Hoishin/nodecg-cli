'use strict';

const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');
const util = require('../lib/utils/nodecg');
const chalk = require('chalk');
const rimraf = require('rimraf');
const os = require('os');

module.exports = function (program) {
	program.command('uninstall <bundle>')
		.description('Uninstalls a bundle.')
		.option('-f, --force', 'ignore warnings')
		.action(action);
};

function action(bundleName, options) {
	const nodecgPath = util.getNodeCGPath();
	const bundlePath = path.join(nodecgPath, 'bundles/', bundleName);

	if (!fs.existsSync(bundlePath)) {
		console.error('Cannot uninstall %s: bundle is not installed.', chalk.magenta(bundleName));
		return;
	}

	/* istanbul ignore if: deleteBundle() is tested in the else path */
	if (options.force) {
		deleteBundle(bundleName, bundlePath);
	} else {
		inquirer.prompt([{
			name: 'confirmUninstall',
			message: 'Are you sure you wish to uninstall ' + chalk.magenta(bundleName) + '?',
			type: 'confirm'
		}]).then(answers => {
			if (answers.confirmUninstall) {
				deleteBundle(bundleName, bundlePath);
			}
		});
	}
}

function deleteBundle(name, path) {
	if (!fs.existsSync(path)) {
		console.log('Nothing to uninstall.');
		return;
	}

	process.stdout.write('Uninstalling ' + chalk.magenta(name) + '... ');
	try {
		rimraf.sync(path);
	} catch (e) {
		/* istanbul ignore next */
		process.stdout.write(chalk.red('failed!') + os.EOL);
		/* istanbul ignore next */
		console.error(e.stack);
		/* istanbul ignore next */
		return;
	}
	process.stdout.write(chalk.green('done!') + os.EOL);
}
