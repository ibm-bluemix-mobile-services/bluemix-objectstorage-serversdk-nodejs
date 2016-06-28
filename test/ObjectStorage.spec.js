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
var HttpClient = require('../lib/HttpClient').HttpClient

var credentials = {
    projectId: 'projectId',
    userId: 'userId',
    password: 'password',
    region: ObjectStorage.Region.DALLAS
};

var response = {};

describe('ObjectStorage', function() {
    beforeEach(function() {
        response = {};
    });

    describe('constructor', function() {
        it('should throw a Reference error when no credentials are passed and there ' +
            'is no VCAP_SERVICES or no Object Storage instance in VCAP_SERVICES', function() {
            try {
                var objectStorage = new ObjectStorage();
            }
            catch(err) {
                assert.equal(err.name, 'ReferenceError');
            }
        });
    });

    describe('constructor', function() {
        it('should initialize credentials and resource url correctly', function() {
            var objectStorage = new ObjectStorage(credentials);
            var authBody = objectStorage.client.getAuthBody();

            assert.equal(objectStorage.baseResourceUrl, credentials.region + credentials.projectId);
            assert.equal(authBody.auth.scope.project.id, credentials.projectId);
            assert.equal(authBody.auth.identity.password.user.id, credentials.userId);
            assert.equal(authBody.auth.identity.password.user.password, credentials.password);
        });
    });

    describe('constructor', function() {
        it('should initialize http client correctly', function(){
            var objectStorage = new ObjectStorage(credentials);
            assert(objectStorage.client != null, '');

            var client = new HttpClient(credentials);
            objectStorage = new ObjectStorage(credentials, client);
            assert.equal(objectStorage.client, client);
        });
    });

    describe('constructor', function() {
        it('should use cf environment for credentials when one or more credentials are not provided', function() {
            process.env.VCAP_SERVICES = JSON.stringify({
                'Object-Storage': [
                    {
                        credentials: {
                            projectId: 'projectId',
                            userId: 'userId',
                            password: 'password',
                            region: 'london'
                        }
                    }
                ]
            });
            var objectStorage = new ObjectStorage();
            var authBody = objectStorage.client.getAuthBody()

            assert.equal(authBody.auth.scope.project.id, credentials.projectId);
            assert.equal(authBody.auth.identity.password.user.id, credentials.userId);
            assert.equal(authBody.auth.identity.password.user.password, credentials.password);
        });
    });

    describe('listContainers', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'Test Body';
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

            objectStorage.listContainers()
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

    describe('listContainers', function() {
        it('should correctly parse body and produce an array of containers when response body is nonempty', function(done) {
            process.env.VCAP_SERVICES = JSON.stringify({
                'Object-Storage': [
                    {
                        credentials: {
                            projectId: 'projectId',
                            userId: 'userId',
                            password: 'password',
                            region: 'dallas'
                        }
                    }
                ]
            });
            response.body = 'stuff\nmiscellany\nthings\n';
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
            var objectStorage = new ObjectStorage();

            objectStorage.listContainers()
                .then(function(actualList){
                    assert.equal(actualList.length, expectedList.length);
                    actualList.forEach(function(item, index) {
                        assert.equal(item.containerName(), expectedList[index]);
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

    describe('listContainers', function() {
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

            objectStorage.listContainers()
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

    describe('createContainer', function() {
        it('should create a container object with the specified name', function(done) {
            var expectedName = 'test';
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);

            objectStorage.createContainer(expectedName)
                .then(function(container) {
                    assert.equal(container.containerName(), expectedName);

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('createContainer', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'Test Body';
            response.statusCode = 408;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExpired = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);

            objectStorage.createContainer()
                .then(function(list) {
                    HttpClient.prototype.isExpired = isExpired;
                    done(new Error());

                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExpired;
                    done();
                });
        });
    });

    describe('getContainer', function() {
        it('should create a container object with the specified name', function(done) {
            var expectedName = 'test';
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);

            objectStorage.getContainer(expectedName)
                .then(function(container) {
                    assert.equal(container.containerName(), expectedName);

                    HttpClient.prototype.send = send;
                    done();
                })
                .catch(function(err) {
                    HttpClient.prototype.send = send;
                    done(err);
                });
        });
    });

    describe('getContainer', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'Test Body';
            response.statusCode = 404;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExpired = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);

            objectStorage.getContainer()
                .then(function(list) {
                    HttpClient.prototype.isExpired = isExpired;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExpired;
                    done();
                });
        });
    });

    describe('deleteContainer', function() {
        it('should not produce an error', function(done) {
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);

            objectStorage.deleteContainer('test')
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

    describe('deleteContainer', function() {
        it('should reject when error caught from client', function(done) {
            response.body = 'Test Body';
            response.statusCode = 404;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExpired = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);

            objectStorage.deleteContainer('test')
                .then(function() {
                    HttpClient.prototype.isExpired = isExpired;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExpired;
                    done();
                });
        });
    });

    describe('metadata', function() {
        it('should parse headers and only return x-account-meta headers corresponding to account metadata', function(done) {
            response.headers = {
                'x-account-meta-this': 'this',
                'x-account-meta-that': 'that',
                'Content-Type': 'type'
            }
            var send = HttpClient.prototype.send;
            HttpClient.prototype.send = function(options) {
                var deferred = Q.defer();
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);
            var expectedMetadata = {
                'x-account-meta-this': 'this',
                'x-account-meta-that': 'that'
            };

            objectStorage.metadata()
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
            response.body = 'Test Body';
            response.statusCode = 500;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExpired = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);

            objectStorage.metadata()
                .then(function(actualMetadata) {
                    HttpClient.prototype.isExpired = isExpired;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExpired;
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

                assert.isOk(headers['X-Account-Meta-this']);
                assert.isOk(headers['X-Account-Meta-that']);
                assert.equal(headers['X-Account-Meta-this'], metadata['this']);
                assert.equal(headers['X-Account-Meta-that'], metadata['that']);
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);

            objectStorage.updateMetadata(metadata)
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
            response.body = 'Test Body';
            response.statusCode = 500;
            var metadata = {
                'this': 'this',
                'that': 'that'
            };

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExpired = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);

            objectStorage.updateMetadata(metadata)
                .then(function(actualMetadata) {
                    HttpClient.prototype.isExpired = isExpired;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExpired;
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

                assert.isOk(headers['X-Remove-Account-Meta-this']);
                assert.isOk(headers['X-Remove-Account-Meta-that']);
                assert.equal(headers['X-Remove-Account-Meta-this'], metadata['this']);
                assert.equal(headers['X-Remove-Account-Meta-that'], metadata['that']);
                deferred.resolve(response);

                return deferred.promise;
            };
            var objectStorage = new ObjectStorage(credentials);

            objectStorage.deleteMetadata(metadata)
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
            response.body = 'Test Body';
            response.statusCode = 500;
            var metadata = {
                'this': 'this',
                'that': 'that'
            };
            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            var isExpired = HttpClient.prototype.isExpired;
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var objectStorage = new ObjectStorage(credentials, client);

            objectStorage.deleteMetadata(metadata)
                .then(function(actualMetadata) {
                    HttpClient.prototype.isExpired = isExpired;
                    done(new Error());
                })
                .catch(function(err) {
                    HttpClient.prototype.isExpired = isExpired;
                    done();
                });
        });
    });
});