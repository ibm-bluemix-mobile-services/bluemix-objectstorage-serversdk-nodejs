"use strict";

const util = require('util');

/**
 * Return the right ObjectStorage implementation
 * @param credentials
 * @constructor
 */
function ObjectStorageFactory(options) {
  const isLocal = !options || !options.credentials;

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
    const baseDir = options.baseDir?options.baseDir:'/tmp/localObjectStorage';

    var ObjectStorage = require('./LocalObjectStorage').ObjectStorage;
    this.objStorage = new ObjectStorage(baseDir);
    this.objStorage.listContainers()
      .then(containersList => {
      server.log(['info', 'objectStorage'], 'Test list conteneurs' + util.inspect(containersList));
  })
  .catch(err => server.log(['error', 'objectStorage'], 'Erreur: '+err));
  }
}

module.exports = ObjectStorageFactory;
