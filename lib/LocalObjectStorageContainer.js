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
  fs = require('fs'),
  path = require('path'),
  ObjectStorageObject = require('./LocalObjectStorageObject').ObjectStorageObject;

/**
 * Constructor
 * @param name
 * @param objectStorage
 * @constructor
 */
function LocalObjectStorageContainer(name, objectStorage) {
    this.name = name;
    this.baseResourceUrl = objectStorage.baseResourceUrl + name;

    if (this.baseResourceUrl.indexOf(path.sep, this.baseResourceUrl.length - path.sep.length) === -1) {
        this.baseResourceUrl += path.sep;
    }
    this.objectStorage = objectStorage;
}

/**
 *  List all objects in this container.
 *
 * @return promise
 */
LocalObjectStorageContainer.prototype.listObjects = function () {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;
    var self = this;

    fs.readdir(resourceUrl, function (err, files) {
        if (err) deferred.reject(err);

        var objectList = [];
        _.forEach(files, function (name) {
            if (name && name.length !== 0) {
                var fileInfo = fs.statSync(resourceUrl + name);
                if (fileInfo.isFile()) {
                    var object = new ObjectStorageObject(name, self);
                    objectList.push(object);
                }
            }
        });
        deferred.resolve(objectList);
    });

    return deferred.promise;
};

/**
 *  Retrieve the specified object.
 *
 *  @param {string} objectName  The name of the object to retrieve.
 *  @return promise
 */
LocalObjectStorageContainer.prototype.getObject = function (objectName) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + objectName;
    var self= this;

    if (fs.existsSync(resourceUrl)) {
        var object = new ObjectStorageObject(objectName, self);
        deferred.resolve(object);
    } else {
        deferred.reject(new Error(resourceUrl + ' is not found'));
    }

    return deferred.promise;
};

/**
 *  Create a new object with the specified name.
 *
 *  @param {string} objectName.  The name of the object to create.
 *  @param {buffer} data. The content of the object to store
 *  @param {boolean} binary. True if the content is binary and should not be parsed ---- NOT USED INTO THIS IMPLEMENTATION
 *  @return promise
 */
LocalObjectStorageContainer.prototype.createObject = function (objectName, data, binary) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + '/' + objectName;
    var contentType = binary ? "binary" : "text";

    var fileData;
    if (data) {
        if (data instanceof Buffer) {
            fileData = data.toString('base64');
        } else {
            fileData = new Buffer(data).toString('base64');
        }
    } else if (binary) {
        if (binary instanceof Buffer) {
            binary = data.toString('base64');
        } else {
            fileData = new Buffer(binary).toString('base64');
        }
    } else {
        filedata = '';
    }
    var jsonData = {
        contentType: contentType,
        data: fileData
    };
    var self = this;

    // write datas
    fs.writeFile(resourceUrl, JSON.stringify(jsonData), function (err) {
        if (err) deferred.reject(err);
        var object = new ObjectStorageObject(objectName, self);
        deferred.resolve(object);
    });

    return deferred.promise;
};

/**
 *  Delete the specified object.
 *
 *  @param {string} objectName.  The name of the object to delete.
 *  @return promise
 */
LocalObjectStorageContainer.prototype.deleteObject = function (objectName) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + '/' + objectName;

    if (fs.existsSync(resourceUrl)) {
        fs.unlink(resourceUrl, function (err) {
            if (err) deferred.reject(err);
            deferred.resolve();
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
};

/**
 *  Retrieve the metadata for this container.
 *
 * @return promise
 */
LocalObjectStorageContainer.prototype.metadata = function () {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + path.sep + '.json';
    var prefix = 'X-Container-Meta-';

    fs.readFile(resourceUrl, function (err, data) {
        if (!err && data) {
            var metadata = JSON.parse(data);
            var headers = {};
            // add prefix
            for (var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    var metadataKey = key.substring(prefix.length, key.length);
                    headers[metadataKey] = metadata[key];
                }
            }
            deferred.resolve(headers);
        } else if (!data) {
            deferred.resolve({});
        } else {
            deferred.reject(err);
        }
    });

    return deferred.promise;
};

/**
 *  Create or Update the specified metadata for this container.
 *
 *  @param {object} metadata.  The metadata to update/create for this container.
 *  @return promise
 */
LocalObjectStorageContainer.prototype.updateMetadata = function (metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Container-Meta-';
    var resourceUrl = this.baseResourceUrl + path.sep + '.json';
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
 *  Delete the specified metadata for this container.
 *
 *  @param {object} metadata.  The metadata to delete for this container.
 *  @return promise
 */
LocalObjectStorageContainer.prototype.deleteMetadata = function (metadata) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + path.sep + '.json';
    var prefix = 'X-Container-Meta-';
    var headers = {};
    var self = this;

    self.metadata().then(function (containerMetadata) {
        _.forIn(containerMetadata, function (value, key) {
            _.forIn(metadata, function (valueToRemove, keyToRemove) {
                if (key === keyToRemove && value === valueToRemove) {
                    // delete
                } else {
                    var metadataKey = prefix + key;
                    headers[metadataKey] = value;
                }
            });
            // write datas
            fs.writeFile(resourceUrl, JSON.stringify(headers), function (err) {
                if (err) deferred.reject(err);
                deferred.resolve();
            });
        });
    }).catch(function (err) {
        deferred.reject(err);
    });

    return deferred.promise;
};

/**
 *  For the testing of things
 *
 */
LocalObjectStorageContainer.prototype.containerName = function () {
    return this.name;
};

module.exports = {
    ObjectStorageContainer: LocalObjectStorageContainer
};