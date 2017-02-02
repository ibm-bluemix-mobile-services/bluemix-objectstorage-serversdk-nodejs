/*
 *     Copyright 2017 Loïc Cotonéa
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 */

var util = require('util');

/**
 * Return the right ObjectStorage implementation
 * @param credentials
 * @constructor
 */
function ObjectStorageFactory(options) {
  var isLocal = !options || !options.credentials;

  if (!isLocal) {
    var serviceCredentials = options.credentials
    // Bluemix environnement
    var ObjectStorage = require('./ObjectStorage').ObjectStorage;
    if (serviceCredentials.region.toUpperCase() === 'LONDON') {
      serviceCredentials.region = ObjectStorage.Region.LONDON;
    } else {
      serviceCredentials.region = ObjectStorage.Region.DALLAS;
    }

    this.objStorage = new ObjectStorage(serviceCredentials);

  } else {
    // Local environment
    console.log('/!\\ /!\\ /!\\   LOCAL ENVIRONMENT HAS ENABLED - NOT FOR PRODUCTION!!!!   /!\\ /!\\ /!\\')
    var baseDir = options.baseDir ? options.baseDir : '/tmp/localObjectStorage';

    var ObjectStorage = require('./LocalObjectStorage').ObjectStorage;
    this.objStorage = new ObjectStorage(baseDir);
    this.objStorage.listContainers()
      .then(function (containersList) {
        server.log(['info', 'objectStorage'], 'Test list conteneurs' + util.inspect(containersList));
      })
      .catch(function (err) {
        throw err;
      });
  }
}

module.exports = ObjectStorageFactory;
