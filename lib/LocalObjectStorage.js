const Q = require('q'),
  _ = require('lodash');
ObjectStorageContainer = require('./ObjectStorageContainer').ObjectStorageContainer,
  fs = require('fs'),
  path = require('path'),
  rimraf = require('rimraf');

function ObjectStorage(baseDir) {
  if (!baseDir || typeof baseDir !== "string") {
    throw new ReferenceError('No baseDir for Local Object Storage instance found');
  }

  this.baseResourceUrl = baseDir;
  if (this.baseResourceUrl.indexOf(path.sep, this.baseResourceUrl.length - path.sep.length) === -1) {
    this.baseResourceUrl += path.sep;
  }
  if (!fs.existsSync(this.baseResourceUrl)) {
    fs.mkdirSync(this.baseResourceUrl);
  }
}

ObjectStorage.prototype.initAndEmpty = function () {
  rimraf(this.baseResourceUrl, (err) => {
    if (err) throw err;
  });
}

/**
 *  List all containers associated with this project id
 *
 * @return promise
 */
ObjectStorage.prototype.listContainers = function () {
  let deferred = Q.defer();
  let self = this;
  let resourceUrl = this.baseResourceUrl;

  fs.readdir(resourceUrl, (err, files) => {
    if (err) deferred.reject(err);
    let containersList = [];
    for (let file of files) {
      let fileInfo = fs.statSync(path.format({
        dir: self.baseDir,
        base: file
      }));
      if (fileInfo.isDirectory()) {
        let container = new ObjectStorageContainer(file, self);
        containersList.push(container);
      }
    }
    deferred.resolve(containersList);
  });
  return deferred.promise;
};

/**
 *  Create a new container with the specified name.
 *
 *  @param {string} containerName  The name of the container to create.
 *  @return promise
 */
ObjectStorage.prototype.createContainer = function (containerName) {
  var deferred = Q.defer();
  var self = this;
  var resourceUrl = this.baseResourceUrl + containerName + path.sep;

  fs.mkdir(resourceUrl, (err) => {
    if (err) deferred.reject(err);
    var container = new ObjectStorageContainer(containerName, self);
    deferred.resolve(container);
  });

  return deferred.promise;
};

/**
 *  Retrieve the specified container.
 *
 *  @param {string} containerName  The name of the container to retrieve.
 *  @return promise
 */
ObjectStorage.prototype.getContainer = function (containerName) {
  var deferred = Q.defer();
  var self = this;
  var resourceUrl = this.baseResourceUrl + containerName + path.sep;

  fs.stat(resourceUrl, (err, stats) => {
    if (err) deferred.reject(err);
    deferred.resolve(new ObjectStorageContainer(containerName, self));
  });

  return deferred.promise;
};

/**
 *  Delete the specified container.
 *
 *  @param {string} containerName.  The name of the container to delete.
 *  @return promise
 */
ObjectStorage.prototype.deleteContainer = function (containerName) {
  var deferred = Q.defer();
  var resourceUrl = this.baseResourceUrl + containerName + path.sep;

  rimraf(resourceUrl, (err) => {
    if (err) deferred.reject(err);
    deferred.resolve();
  });

  return deferred.promise;
};

/**
 *  Retrieve the metadata for this account.
 *
 * @return promise
 */
ObjectStorage.prototype.metadata = function () {
  var deferred = Q.defer();
  var resourceUrl = this.baseResourceUrl + '.json';

  fs.readFile(resourceUrl, (err, data) => {
    if (!err && data) {
      deferred.resolve(data.toJSON());
    } else if (!data) {
      deferred.resolve({});
    } else {
      deferred.reject(err);
    }
  });

  return deferred.promise;
};

/**
 *  Create or Update the specified metadata.
 *
 *  @param {object} metadata.  The metadata to update/create.
 *  @return promise
 */
ObjectStorage.prototype.updateMetadata = function (metadata) {
  var deferred = Q.defer();
  var prefix = 'X-Account-Meta-';
  var resourceUrl = this.baseResourceUrl + '.json';
  var headers = [];
  var self = this;

  // add prefix
  for (var key in metadata) {
    if (metadata.hasOwnProperty(key)) {
      var metadataKey = prefix + key;
      headers[metadataKey] = metadata[key];
    }
  }

  // merge datas
  self.metadata()
    .then(data => {
      for (var key in headers) {
        data[key] = headers[key];
      }
      headers = data;
    });

  // write datas
  fs.writeFile(resourceUrl, JSON.stringify(headers), (err) => {
    if (err) deferred.reject(err);
    deferred.resolve();
  });

  return deferred.promise;
};

/**
 *  Delete the specified metadata.
 *
 *  @param {object} metadata.  The metadata to delete.
 *  @return promise
 */
ObjectStorage.prototype.deleteMetadata = function (metadata) {
  var deferred = Q.defer();
  var prefix = 'X-Remove-Account-Meta-';
  var resourceUrl = this.baseResourceUrl;
  var headers = {};
  var metadataKey = prefix + key;
  var self = this;

  // add prefix
  for (var key in metadata) {
    if (metadata.hasOwnProperty(key)) {
      var metadataKey = prefix + key;
      headers[metadataKey] = metadata[key];
    }
  }

  _.forIn(metadata, function (value, key) {
    var metadataKey = prefix + key;
    headers[metadataKey] = value;
  });

  // merge datas
  self.metadata()
    .then(data => {
      for (var key in headers) {
        delete data[key];
      }
      headers = data;
    });

  // write datas
  fs.writeFile(resourceUrl, JSON.stringify(headers), (err) => {
    if (err) deferred.reject(err);
    deferred.resolve();
  });

  return deferred.promise;
};

ObjectStorage.Region = {
  DALLAS: 'https://dal.objectstorage.open.softlayer.com:443/v1/AUTH_',
  LONDON: 'https://lon.objectstorage.open.softlayer.com:443/v1/AUTH_'
};

module.exports = {
  ObjectStorage: ObjectStorage
};