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
var request = require('request');
var Q = require('q');
var _ = require('lodash');
var cfenv = require('cfenv');
var ObjectStorageContainer = require('./ObjectStorageContainer').ObjectStorageContainer;
var HttpClient = require('./HttpClient').HttpClient;

function ObjectStorage(creds, httpClient) {
    if (creds && creds.projectId && creds.userId && creds.password && creds.region) {
        this.baseResourceUrl = creds.region + creds.projectId;
        this.client = httpClient ? httpClient : new HttpClient(creds, request);
    }
    else {
        var appEnv = cfenv.getAppEnv();
        var serviceInstances = appEnv.services['Object-Storage'] || {};
        var serviceInstance = serviceInstances[0] || {};
        var serviceCredentials = serviceInstance.credentials;

        if (!serviceCredentials) {
            throw new ReferenceError('No credentials for Object Storage instance found');
        }
        this.baseResourceUrl = ((serviceCredentials.region === 'dallas') ? ObjectStorage.Region.DALLAS : ObjectStorage.Region.LONDON) + serviceCredentials.projectId;
        this.client = new HttpClient(serviceCredentials, request);
    }
}

/**
 *  List all containers associated with this project id
 *
 * @return promise
 */
ObjectStorage.prototype.listContainers = function() {
    var deferred = Q.defer();
    var self = this;
    var resourceUrl = this.baseResourceUrl;

    this.client.get(resourceUrl)
        .then(function(response) {
            var containersList = [];
            var body = response.body;
            var list = _.split(body, '\n');

            _.forEach(list, function(name) {
                if (name && name.length !== 0) {
                    var container = new ObjectStorageContainer(name, self);
                    containersList.push(container);
                }
            });
            deferred.resolve(containersList);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Create a new container with the specified name.
 *
 *  @param {string} containerName  The name of the container to create.
 *  @return promise
 */
ObjectStorage.prototype.createContainer = function(containerName) {
    var deferred = Q.defer();
    var self = this;
    var resourceUrl = this.baseResourceUrl + '/' + containerName;

    this.client.put(resourceUrl)
        .then(function(response) {
            var container = new ObjectStorageContainer(containerName, self);
            deferred.resolve(container);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Retrieve the specified container.
 *
 *  @param {string} containerName  The name of the container to retrieve.
 *  @return promise
 */
ObjectStorage.prototype.getContainer = function(containerName) {
    var deferred = Q.defer();
    var self = this;
    var resourceUrl = this.baseResourceUrl + '/' + containerName;

    this.client.get(resourceUrl)
        .then(function(response) {
            var container = new ObjectStorageContainer(containerName, self);
            deferred.resolve(container);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Delete the specified container.
 *
 *  @param {string} containerName.  The name of the container to delete.
 *  @return promise
 */
ObjectStorage.prototype.deleteContainer = function(containerName) {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl + '/' + containerName;

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
 *  Retrieve the metadata for this account.
 *
 * @return promise
 */
ObjectStorage.prototype.metadata = function() {
    var deferred = Q.defer();
    var resourceUrl = this.baseResourceUrl;

    this.client.head(resourceUrl)
        .then(function(response) {
            var headers = response.headers;
            var accountMetadata = _.pickBy(headers, function(value, key) {
                return _.startsWith(key, 'x-account');
            });
            deferred.resolve(accountMetadata);
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

/**
 *  Create or Update the specified metadata.
 *
 *  @param {object} metadata.  The metadata to update/create.
 *  @return promise
 */
ObjectStorage.prototype.updateMetadata = function(metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Account-Meta-';
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
 *  Delete the specified metadata.
 *
 *  @param {object} metadata.  The metadata to delete.
 *  @return promise
 */
ObjectStorage.prototype.deleteMetadata = function(metadata) {
    var deferred = Q.defer();
    var prefix = 'X-Remove-Account-Meta-';
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

ObjectStorage.Region = {
    DALLAS: 'https://dal.objectstorage.open.softlayer.com:443/v1/AUTH_',
    LONDON: 'https://lon.objectstorage.open.softlayer.com:443/v1/AUTH_'
};

module.exports = {
    ObjectStorage: ObjectStorage
};