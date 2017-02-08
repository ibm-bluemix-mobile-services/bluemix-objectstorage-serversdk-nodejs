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
  path = require('path');

/**
 * Constructor
 * @param name
 * @param objectStorageContainer
 * @constructor
 */
function ObjectStorageObject(name, objectStorageContainer) {
    this.name = name;
    this.baseResourceUrl = objectStorageContainer.baseResourceUrl + name;
    this.objectStorage = objectStorageContainer.objectStorage;
}

/**
 *  Load the content of this object.
 *
 *  @param {boolean} shouldCache.  A flag telling this object whether or not to cache the data internally.
 *  @param {boolean} binary. True if the content of this object is binary and should not be parsed
 *  @return promise
 */
ObjectStorageObject.prototype.load = function (shouldCache, binary) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;
    var self = this;

    if (fs.existsSync(resourceUrl)) {
        fs.readFile(resourceUrl, function (err, data) {
            if (!err) {
                var dataJson = JSON.parse(data);
                if (dataJson.contentType === 'binary') {
                    dataJson.data = new Buffer(dataJson.data, 'base64').toString('binary');
                } else {
                    dataJson.data = dataJson.data;
                }

                if (shouldCache) {
                    self.data = dataJson.data;
                }
                self.setContentType(dataJson.contentType);
                deferred.resolve(dataJson.data);
            } else if (!data) {
                deferred.resolve("");
            } else {
                deferred.reject(err);
            }
        });
    } else {
        deferred.reject(new Error(resourceUrl + ' is not found'));
    }

    return deferred.promise;
};

/**
 *  Retrieve the metadata for this object.
 *
 */
ObjectStorageObject.prototype.metadata = function () {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + '.json';
    var prefix = 'x-object';

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
 *  Create or Update the specified metadata for this object.
 *
 *  @param {object} metadata.  The metadata to update/create for this object.
 *  @return promise
 */
ObjectStorageObject.prototype.updateMetadata = function (metadata) {
    var deferred = Q.defer();
    var prefix = 'x-object';
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
 *  Delete the specified metadata for this object.
 *
 *  @param {object} metadata.  The metadata to delete for this object.
 *  @return promise
 */
ObjectStorageObject.prototype.deleteMetadata = function (metadata) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + '.json';
    var prefix = 'x-object';
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
ObjectStorageObject.prototype.objectName = function () {
    return this.name;
};

/**
 *  Set the Content-Type
 *
 * @param {string} contentType. The Content-Type of this object. e.g. 'image/jpeg'
 */
ObjectStorageObject.prototype.setContentType = function (contentType) {
    this.contentType = contentType;
}

/**
 *  Get the Content-Type of the object when we are loading
 *
 * @return Content-Type. The Content-Type of the object, e.g. image/png
 */
ObjectStorageObject.prototype.getContentType = function () {
    return this.contentType;
}

module.exports = {
    ObjectStorageObject: ObjectStorageObject
};