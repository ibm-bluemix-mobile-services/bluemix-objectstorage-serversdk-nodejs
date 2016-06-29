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
var assert = require('chai').assert;
var Q = require('q');
var ObjectStorage = require('../lib/ObjectStorage').ObjectStorage;
var ObjectStorageContainer = require('../lib/ObjectStorageContainer').ObjectStorageContainer;
var ObjectStorageObject = require('../lib/ObjectStorageObject').ObjectStorageObject;
var HttpClient = require('../lib/HttpClient').HttpClient;

var credentials = {
    projectId: 'projectId',
    userId: 'userId',
    password: 'password',
    region: ObjectStorage.Region.DALLAS
};

var response = {};

describe('ObjectStorageObject', function() {

    beforeEach(function() {
        response = {};
    });

    describe('constructor', function() {
        it('should correctly set object name, resource url, http client, and ObjectStorageContainer', function() {
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            assert.strictEqual(objectStorageObject.objectStorage, objectStorage);
            assert.equal(objectStorageObject.objectName(), 'object');
            assert.equal(objectStorageObject.baseResourceUrl, objectStorageContainer.baseResourceUrl + '/' + 'object');
            assert.equal(objectStorageObject.client, objectStorage.client);
        });
    });

    describe('load', function() {
        it('should cache data when function parameter is true', function(done) {
            response.body = 'gobbledygook';
            response.headers = { 'content-type': 'something' };
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            objectStorageObject.load(true)
                .then(function(actualData){
                    var cachedData = objectStorageObject.data;

                    assert.equal(actualData, cachedData);
                    assert.equal(actualData, response.body);

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('load', function() {
        it('should not cache data when function parameter is false', function(done) {
            response.body = 'gobbledygook';
            response.headers = { 'content-type': 'something' };
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);
            var objectStorageObject = new ObjectStorageObject('test', objectStorageContainer);

            objectStorageObject.load(false)
                .then(function(actualData){
                    var cachedData = objectStorageObject.data;

                    assert.notOk(cachedData);
                    assert.equal(actualData, response.body);

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('load', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 422;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExp = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            objectStorageObject.load()
                .then(function(data) {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('metadata', function() {
        it('should parse headers and only return x-object-meta headers corresponding to account metadata', function(done) {
            response.headers = {
                'x-object-meta-this': 'this',
                'x-object-meta-that': 'that',
                'Content-Type': 'type'
            }
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var expectedMetadata = {
                'x-object-meta-this': 'this',
                'x-object-meta-that': 'that'
            };
            var containerName = 'container';
            var objectName = 'test';
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer(containerName, objectStorage);
            var objectStorageObject = new ObjectStorageObject(objectName, objectStorageContainer);

            objectStorageObject.metadata()
                .then(function(actualMetadata) {
                    assert.deepEqual(actualMetadata, expectedMetadata);

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('metadata', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 411;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExp = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            objectStorageObject.metadata()
                .then(function(metadata) {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('updateMetadata', function() {
        it('should append appropriate header key to each metadata key passed in', function(done) {
            var metadata = {
                'this': 'this',
                'that': 'that'
            };
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                var headers = options.headers;

                assert.isOk(headers['X-Object-Meta-this']);
                assert.isOk(headers['X-Object-Meta-that']);
                assert.equal(headers['X-Object-Meta-this'], metadata['this']);
                assert.equal(headers['X-Object-Meta-that'], metadata['that']);
                deferred.resolve(response);

                return deferred.promise;
            };
            var containerName = 'container';
            var objectName = 'test';
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer(containerName, objectStorage);
            var objectStorageObject = new ObjectStorageObject(objectName, objectStorageContainer);

            objectStorageObject.updateMetadata(metadata)
                .then(function() {
                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('updateMetadata', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 500;
            var metadata = {
                'this': 'this',
                'that': 'that'
            };

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExp = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            objectStorageObject.updateMetadata(metadata)
                .then(function() {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('deleteMetadata', function() {
        it('should append appropriate header key to each metadata key passed in', function(done) {
            var metadata = {
                'this': 'this',
                'that': 'that'
            };
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                var headers = options.headers;

                assert.isOk(headers['X-Remove-Object-Meta-this']);
                assert.isOk(headers['X-Remove-Object-Meta-that']);
                assert.equal(headers['X-Remove-Object-Meta-this'], metadata['this']);
                assert.equal(headers['X-Remove-Object-Meta-that'], metadata['that']);
                deferred.resolve(response);

                return deferred.promise;
            };
            var containerName = 'container';
            var objectName = 'test';
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer(containerName, objectStorage);
            var objectStorageObject = new ObjectStorageObject(objectName, objectStorageContainer);

            objectStorageObject.deleteMetadata(metadata)
                .then(function() {
                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('deleteMetadata', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 500;
            var metadata = {
                'this': 'this',
                'that': 'that'
            };

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExp = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            objectStorageObject.deleteMetadata(metadata)
                .then(function() {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('getContentType', function() {
        it('should correctly set the content type from the response header', function(done) {
            response.body = 'test body';
            response.statusCode = 200;
            response.headers = { 'content-type': 'image/jpeg' };

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExp = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            objectStorageObject.load()
                .then(function(data) {
                    HttpClient.prototype.isExpired = isExp;
                    var contentType = objectStorageObject.getContentType();
                    assert.equal(contentType, response.headers['content-type']);
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done(err);
                });
        });
    });
});