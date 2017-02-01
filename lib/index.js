"use strict";

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
