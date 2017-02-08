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
var Q = require('q'),
  _ = require('lodash'),
  ObjectStorageContainer = require('./LocalObjectStorageContainer').ObjectStorageContainer,
  fs = require('fs'),
  path = require('path'),
  rimraf = require('rimraf');

/**
 * Constructor
 * @param baseDir
 * @constructor
 */
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
/**
 * Not compliant with bluemix-objectsotrage-serversdk-nodejs API
 * !!FOR DEVELOPMENT USE ONLY!!
 */
ObjectStorage.prototype.initAndEmpty = function () {
    var deferred = Q.defer();

    rimraf(this.baseResourceUrl, function (err) {
        if (err) deferred.reject(err);
        deferred.resolve();
    });

    return deferred.promise;
};

/**
 *  List all containers associated with this project id
 *
 * @return promise
 */
ObjectStorage.prototype.listContainers = function () {
    var deferred = Q.defer();
    var self = this;
    var resourceUrl = this.baseResourceUrl;

    fs.readdir(resourceUrl, function (err, files) {
        if (err || !files) deferred.reject(err);
        var containersList = [];

        _.forEach(files, function (file) {
            if (fs.exists(path.format({
                  dir: self.baseDir,
                  base: file
              }))) {
                var fileInfo = fs.statSync(path.format({
                    dir: self.baseDir,
                    base: file
                }));
                if (fileInfo.isDirectory()) {
                    var container = new ObjectStorageContainer(file, self);
                    containersList.push(container);
                }
            }
        });
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

    if (fs.existsSync(resourceUrl)) {
        var container = new ObjectStorageContainer(containerName, self);
        deferred.resolve(container);
    } else {
        fs.mkdir(resourceUrl, function (err) {
            if (err) deferred.reject(err);
            var container = new ObjectStorageContainer(containerName, self);
            deferred.resolve(container);
        });
    }
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

    fs.stat(resourceUrl, function (err, stats) {
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

    rimraf(resourceUrl, function (err) {
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

    fs.readFile(resourceUrl, function (err, data) {
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
    var headers = {};
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
      .then(function (data) {
          for (var key in headers) {
              data[key] = headers[key];
          }
          headers = data;
      });

    // write datas
    fs.writeFile(resourceUrl, JSON.stringify(headers), function (err) {
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
      .then(function (data) {
          for (var key in headers) {
              delete data[key];
          }
          headers = data;
      });

    // write datas
    fs.writeFile(resourceUrl, JSON.stringify(headers), function (err) {
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