/*
 *     Copyright 2016 IBM Corp.
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
var Q = require('q');
var _ = require('lodash');
var ObjectStorageObject = require('./ObjectStorageObject').ObjectStorageObject;

function ObjectStorageContainer(name, objectStorage) {
    this.name = name;
    this.baseResourceUrl = objectStorage.baseResourceUrl + '/' + name;
    this.client = objectStorage.client;
    this.objectStorage = objectStorage;
}

/**
 *  List all objects in this container.
 *
 * @return promise
 */
ObjectStorageContainer.prototype.listObjects = function() {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;
    var self = this;

    this.client.get(resourceUrl)
        .then(function(response) {
            var objectList = [];
            var body = response.body;
            var list = _.split(body, '\n');

            _.forEach(list, function(name) {
                if (name && name.length !== 0) {
                    var object = new ObjectStorageObject(name, self);
                    objectList.push(object);
                }
            });
            deferred.resolve(objectList);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Retrieve the specified object.
 *
 *  @param {string} objectName  The name of the object to retrieve.
 *  @return promise
 */
ObjectStorageContainer.prototype.getObject = function(objectName) {
    var deferred = Q.defer();
    var self = this;
    var resourceUrl = this.baseResourceUrl + '/' + objectName;

    this.client.get(resourceUrl)
        .then(function(response) {
            var object = new ObjectStorageObject(objectName, self);
            deferred.resolve(object);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Create a new object with the specified name.
 *
 *  @param {string} objectName.  The name of the object to create.
 *  @param {buffer} data. The content of the object to store
 *  @param {boolean} binary. True if the content is binary and should not be parsed
 *  @return promise
 */
ObjectStorageContainer.prototype.createObject = function(objectName, data, binary) {
    var deferred = Q.defer();
    var self = this;
    var resourceUrl = this.baseResourceUrl + '/' + objectName;

    this.client.put(resourceUrl, data, binary)
        .then(function(res) {
            var object = new ObjectStorageObject(objectName, self);
            deferred.resolve(object);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Delete the specified object.
 *
 *  @param {string} objectName.  The name of the object to delete.
 *  @return promise
 */
ObjectStorageContainer.prototype.deleteObject = function(objectName) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + '/' + objectName;

    this.client.delete(resourceUrl)
        .then(function(response) {
            deferred.resolve();
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Retrieve the metadata for this container.
 *
 * @return promise
 */
ObjectStorageContainer.prototype.metadata = function() {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;

    this.client.head(resourceUrl)
        .then(function(response) {
            var headers = response.headers;
            var accountMetadata = _.pickBy(headers, function(value, key) {
                return _.startsWith(key, 'x-container');
            });
            deferred.resolve(accountMetadata);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Create or Update the specified metadata for this container.
 *
 *  @param {object} metadata.  The metadata to update/create for this container.
 *  @return promise
 */
ObjectStorageContainer.prototype.updateMetadata = function(metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Container-Meta-';
    var resourceUrl = this.baseResourceUrl;
    var headers = {};

    _.forIn(metadata, function(value, key) {
        var metadataKey = prefix + key;
        headers[metadataKey] = value;
    });

    this.client.post(resourceUrl, headers)
        .then(function(response) {
            deferred.resolve();
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Delete the specified metadata for this container.
 *
 *  @param {object} metadata.  The metadata to delete for this container.
 *  @return promise
 */
ObjectStorageContainer.prototype.deleteMetadata = function(metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Remove-Container-Meta-';
    var resourceUrl = this.baseResourceUrl;
    var headers = {};

    _.forIn(metadata, function(value, key) {
        var metadataKey = prefix + key;
        headers[metadataKey] = value;
    });

    this.client.post(resourceUrl, headers)
        .then(function(response) {
            deferred.resolve();
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  For the testing of things
 *
 */
ObjectStorageContainer.prototype.containerName = function() {
    return this.name;
};

module.exports = {
    ObjectStorageContainer: ObjectStorageContainer
};