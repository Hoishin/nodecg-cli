'use strict';

const childProcess = require('child_process');
const mkdirp = require('mkdirp');
const assert = require('chai').assert;
const sinon = require('sinon');
const MockProgram = require('../mocks/program');
const DefaultConfigCommand = require('../../commands/defaultconfig');
const fs = require('fs');

describe('defaultconfig command', () => {
	let program;

	beforeEach(() => {
		program = new MockProgram();
		new DefaultConfigCommand(program); // eslint-disable-line no-new
		if (fs.existsSync('./cfg/lfg-streamtip.json')) {
			fs.unlinkSync('./cfg/lfg-streamtip.json');
		}
	});

	context('when run with a bundle argument', () => {
		it('should successfully create a bundle config file when bundle has configschema.json', function () {
			this.timeout(25000);
			fs.writeFileSync('./bundles/lfg-streamtip/configschema.json', JSON.stringify({
				type: 'object',
				properties: {
					username: {
						type: 'string',
						default: 'user'
					},
					value: {
						type: 'integer',
						default: 5
					},
					nodefault: {
						type: 'string'
					}
				}
			}));
			sinon.spy(childProcess, 'execSync');
			program.runWith('defaultconfig lfg-streamtip');
			assert.equal(fs.existsSync('./cfg/lfg-streamtip.json'), true);
			const config = JSON.parse(fs.readFileSync('./cfg/lfg-streamtip.json'));
			assert.equal('user', config.username);
			assert.equal(5, config.value);
			assert.isUndefined(config.nodefault);
			childProcess.execSync.restore();
		});

		it('should print an error when the target bundle does not have a configschema.json', function () {
			this.timeout(25000);
			sinon.spy(console, 'error');
			mkdirp.sync('./bundles/missing-schema-bundle');
			program.runWith('defaultconfig missing-schema-bundle');
			assert.equal('\u001b[31mError:\u001b[39m Bundle %s does not have a configschema.json',
				console.error.getCall(0).args[0]);
			console.error.restore();
		});

		it('should print an error when the target bundle does not exist', function () {
			this.timeout(25000);
			sinon.spy(console, 'error');
			program.runWith('defaultconfig not-installed');
			assert.equal('\u001b[31mError:\u001b[39m Bundle %s does not exist',
				console.error.getCall(0).args[0]);
			console.error.restore();
		});

		it('should print an error when the target bundle already has a config', function () {
			this.timeout(25000);
			sinon.spy(console, 'error');
			fs.writeFileSync('./cfg/lfg-streamtip.json', JSON.stringify({fake: 'data'}));
			program.runWith('defaultconfig lfg-streamtip');
			assert.equal('\u001b[31mError:\u001b[39m Bundle %s already has a config file',
				console.error.getCall(0).args[0]);
			console.error.restore();
		});
	});

	context('when run with no arguments', () => {
		it('should successfully create a bundle config file when run from inside bundle directory', function () {
			this.timeout(25000);
			process.chdir('./bundles/lfg-streamtip');
			program.runWith('defaultconfig');
			assert.equal(fs.existsSync('../../cfg/lfg-streamtip.json'), true);
		});

		it('should print an error when in a folder with no package.json', function () {
			this.timeout(25000);
			mkdirp.sync('./bundles/not-a-bundle');
			process.chdir('./bundles/not-a-bundle');

			sinon.spy(console, 'error');
			program.runWith('defaultconfig');
			assert.equal('\u001b[31mError:\u001b[39m No bundle found in the current directory!',
				console.error.getCall(0).args[0]);
			console.error.restore();
		});
	});
});
