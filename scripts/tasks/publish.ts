import * as Queue from 'async-promise-queue';
import { exec } from 'child_process';
import * as fs from 'fs-extra';
import { merge } from 'lodash';
import { cpus } from 'os';
import * as path from 'path';

import { PLUGIN_PATHS, ROOT } from '../build/helpers';
import { Logger } from '../logger';

// tslint:disable-next-line:no-var-requires
const MAIN_PACKAGE_JSON = require('../../package.json');
const VERSION = MAIN_PACKAGE_JSON.version;
const FLAGS = '--access public --tag beta';

const PACKAGE_JSON_BASE = {
  description: 'Ionic Native - Native plugins for ionic apps',
  module: 'index.js',
  typings: 'index.d.ts',
  author: 'ionic',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'https://github.com/ionic-team/ionic-native.git'
  }
};

const DIST = path.resolve(ROOT, 'dist/@ionic-native');

const PACKAGES = [];

const MIN_CORE_VERSION = '^5.1.0';
const RXJS_VERSION = '^6.3.0';

const PLUGIN_PEER_DEPENDENCIES = {
  '@awesome-cordova-plugins/core': MIN_CORE_VERSION,
  rxjs: RXJS_VERSION
};

function getPackageJsonContent(name: string, peerDependencies = {}, dependencies = {}) {
  return merge(PACKAGE_JSON_BASE, {
    name: '@awesome-cordova-plugins/' + name,
    dependencies,
    peerDependencies,
    version: VERSION
  });
}

function writePackageJson(data: any, dir: string) {
  const filePath = path.resolve(dir, 'package.json');
  fs.writeJSONSync(filePath, data);
  PACKAGES.push(dir);
}

function prepare() {
  // write @awesome-cordova-plugins/core package.json
  // writePackageJson(
  //   getPackageJsonContent('core', { rxjs: RXJS_VERSION }, { '@types/cordova': 'latest' }),
  //   path.resolve(DIST, 'core')
  // );

  // write plugin package.json files
  PLUGIN_PATHS.forEach((pluginPath: string) => {
    const pluginName = pluginPath.split(/[\/\\]+/).slice(-2)[0];
    const packageJsonContents = getPackageJsonContent(
      pluginName,
      PLUGIN_PEER_DEPENDENCIES
    );
    const dir = path.resolve(DIST, 'plugins', pluginName);

    writePackageJson(packageJsonContents, dir);
  });
}


async function publish(ignoreErrors = false) {
  Logger.profile('Publishing');
  // upload 1 package per CPU thread at a time
  const worker = Queue.async.asyncify((pkg: any) => {
    if (/google\-maps$/.test(pkg)) {
      new Promise<any>((resolve, reject) => {
        exec(`npm publish ${pkg} ${FLAGS}`, (err, stdout) => {
          if (stdout) {
            Logger.verbose(stdout.trim());
            resolve(stdout);
          }
          if (err) {
            if (!ignoreErrors) {
              if (
                err.message.includes(
                  'You cannot publish over the previously published version'
                )
              ) {
                Logger.verbose('Ignoring duplicate version error.');
                return resolve();
              }
              reject(err);
            }
          }
        });
      });
    } else {
      new Promise<any>((resolve, reject) => {
        Logger.verbose(`skip ${pkg}`);
        resolve(`skip ${pkg}`);
      });
    }
  });

  try {
    await Queue(worker, PACKAGES, cpus().length);
    Logger.info('Done publishing!');
  } catch (e) {
    Logger.error('Error publishing!');
    Logger.error(e);
  }
  Logger.profile('Publishing');
}

prepare();
publish();
