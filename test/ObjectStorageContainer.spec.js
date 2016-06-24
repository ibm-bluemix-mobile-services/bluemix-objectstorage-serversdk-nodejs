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
var _ = require('lodash');
var ObjectStorage = require('../lib/ObjectStorage').ObjectStorage;
var ObjectStorageContainer = require('../lib/ObjectStorageContainer').ObjectStorageContainer;
var HttpClient = require('../lib/HttpClient').HttpClient;

var credentials = {
    projectId: 'projectId',
    userId: 'userId',
    password: 'password',
    region: ObjectStorage.Region.DALLAS
};

var response = {};

describe('ObjectStorageContainer', function() {

    beforeEach(function() {
        response = {};
    });

    describe('constructor', function() {
        it('should correctly set container name, resource url, http client, and ObjectStorage', function() {
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);

            assert.strictEqual(objectStorageContainer.objectStorage, objectStorage);
            assert.equal(objectStorageContainer.containerName(), 'test');
            assert.equal(objectStorageContainer.baseResourceUrl, objectStorage.baseResourceUrl + '/' + 'test');
            assert.equal(objectStorageContainer.client, objectStorage.client);
        });
    });

    describe('listObjects', function() {
        it('should correctly parse body and produce an array of objects when response body is nonempty', function(done) {
            response.body = 'stuff\nmiscellany\nthings\n'
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var expectedList = [];
            var body = response.body;
            var list = _.split(body, '\n');

            _.forEach(list, function(name) {
                if (name && name.length !== 0) {
                    expectedList.push(name);
                }
            });
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);

            objectStorageContainer.listObjects()
                .then(function(actualList){
                    assert.equal(actualList.length, expectedList.length);

                    actualList.forEach(function(item, index) {
                        assert.equal(item.objectName(), expectedList[index]);
                    });
                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('listObjects', function() {
        it('should produce an empty array when response body is empty', function(done) {
            response.body = '';
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var expectedList = [];
            var body = response.body;
            var list = _.split(body, '\n');

            _.forEach(list, function(name) {
                if (name && name.length !== 0) {
                    expectedList.push(name);
                }
            });
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);

            objectStorageContainer.listObjects()
                .then(function(actualList){
                    assert.equal(actualList.length, expectedList.length);
                    assert.equal(actualList.length, 0);

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('listObjects', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 404;

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

            objectStorageContainer.listObjects()
                .then(function(list) {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('createObject', function() {
        it('should create a new ObjectStorageObject with the specified name', function(done) {
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);

            objectStorageContainer.createObject('test')
                .then(function(object) {
                    assert.equal(object.objectName(), 'test');

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('createObject', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 408;

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

            objectStorageContainer.createObject()
                .then(function(object) {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('getObject', function() {
        it('should create a ObjectStorageObject object with the specified name', function(done) {
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);

            objectStorageContainer.getObject('test')
                .then(function(object) {
                    assert.equal(object.objectName(), 'test');

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('getObject', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 404;

            var request = function(options, callback) {
                callback(null, response, response.body);
            };
            var isExp = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {

                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);
            var objectStorageContainer = new ObjectStorageContainer('test', objectStorage);

            objectStorageContainer.getObject()
                .then(function(object) {
                    HttpClient.prototype.isExpired = isExp;
                    done(new Error());
                })
                .catch(function(err) {

                    HttpClient.prototype.isExpired = isExp;
                    done();
                });
        });
    });

    describe('deleteObject', function() {
        it('should not produce an error', function(done) {
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);

            objectStorageContainer.deleteObject('test')
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

    describe('deleteObject', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'test body';
            response.statusCode = 404;

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

            objectStorageContainer.deleteObject('object')
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

    describe('metadata', function() {
        it('should parse headers and only return x-container-meta headers corresponding to account metadata', function(done) {
            response.headers = {
                'x-container-meta-this': 'this',
                'x-container-meta-that': 'that',
                'Content-Type': 'type'
            };
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var expectedMetadata = {
                'x-container-meta-this': 'this',
                'x-container-meta-that': 'that'
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);

            objectStorageContainer.metadata()
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
            response.statusCode = 500;

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

            objectStorageContainer.metadata()
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

                assert.isOk(headers['X-Container-Meta-this']);
                assert.isOk(headers['X-Container-Meta-that']);
                assert.equal(headers['X-Container-Meta-this'], metadata['this']);
                assert.equal(headers['X-Container-Meta-that'], metadata['that']);
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);

            objectStorageContainer.updateMetadata(metadata)
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

            objectStorageContainer.updateMetadata(metadata)
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

                assert.isOk(headers['X-Remove-Container-Meta-this']);
                assert.isOk(headers['X-Remove-Container-Meta-that']);
                assert.equal(headers['X-Remove-Container-Meta-this'], metadata['this']);
                assert.equal(headers['X-Remove-Container-Meta-that'], metadata['that']);
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var objectStorageContainer = new ObjectStorageContainer('container', objectStorage);

            objectStorageContainer.deleteMetadata(metadata)
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

            objectStorageContainer.deleteMetadata(metadata)
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
});