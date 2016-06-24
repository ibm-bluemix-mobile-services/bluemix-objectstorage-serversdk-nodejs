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
var HttpClient = require('../lib/HttpClient').HttpClient;

var credentials = {
    projectId: 'projectId',
    userId: 'userId',
    password: 'password'
};
var response = {};

describe('HttpClient', function() {

    beforeEach(function() {
        response = {};

    });
    describe('constructor', function() {
        it('should correctly set authBody properties', function() {
            var expectedAuthBody = {
                auth: {
                    identity: {
                        methods: [
                            "password"
                        ],
                        password: {
                            user: {
                                id: 'userId',
                                password: 'password'
                            }
                        }
                    },
                    scope: {
                        project: {
                            id: 'projectId'
                        }
                    }
                }
            };
            var client = new HttpClient(credentials);
            var actualAuthBody = client.getAuthBody();

            assert.deepEqual(expectedAuthBody, actualAuthBody);
        });
    });

    describe('constructor', function() {
        it('should set token with empty token body and nonempty expiration', function() {
            var client = new HttpClient(credentials);
            var token = client.getToken();

            assert(token.expiration);
            assert(token.token.length === 0);
        });
    });

    describe('setToken', function() {
        it('should correctly set token body and expiration', function() {
            var expectedExpiration = new Date().toString();
            var expectedToken = 'abcdef';
            var expectedBody = JSON.stringify({
                token: {
                    expires_at: expectedExpiration
                }
            });
            response.headers = {
                'x-subject-token': expectedToken
            };
            response.body = expectedBody;
            var expected = {
                token: expectedToken,
                expiration: expectedExpiration
            };
            var client = new HttpClient(credentials);
            client.setToken(response);
            var token = client.getToken();

            assert.deepEqual(expected, token);
        });
    });

    describe('isExpired', function() {
        it('should return true when current time is greater than token expiration', function() {
            var expiration = new Date().toString();
            var expectedToken = 'abcdef';
            var expectedBody = JSON.stringify({
                token: {
                    expires_at: expiration
                }
            });
            response.headers = {
                'x-subject-token': expectedToken
            };
            response.body = expectedBody;
            var client = new HttpClient(credentials);
            client.setToken(response);
            var token = client.getToken();

            assert(client.isExpired(token));
        });
    });

    describe('isExpired', function() {
        it('should return true when current time is within 10 minutes of token expiration', function() {
            var date = new Date();
            var expiration = (new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 5)).toString();
            var expectedToken = 'abcdef';
            var expectedBody = JSON.stringify({
                token: {
                    expires_at: expiration
                }
            });
            response.headers = {
                'x-subject-token': expectedToken
            };
            response.body = expectedBody;
            var client = new HttpClient(credentials);
            client.setToken(response);
            var token = client.getToken();

            assert(client.isExpired(token));
        });
    });

    describe('isExpired', function() {
        it('should return false when current time is not within 10 minutes of token expiration', function() {
            var date = new Date();
            var expiration = (new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 30)).toString();
            var expectedToken = 'abcdef';
            var expectedBody = JSON.stringify({
                token: {
                    expires_at: expiration
                }
            });
            response.headers = {
                'x-subject-token': expectedToken
            };
            response.body = expectedBody;
            var client = new HttpClient(credentials);

            client.setToken(response);
            var token = client.getToken();

            assert(!client.isExpired(token));
        });
    });

    describe('refreshToken', function() {
        it('should do nothing if token has not expired', function(done) {
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var expiration = new Date().toString();
            var expectedToken = 'abcdef';
            var expectedBody = JSON.stringify({
                token: {
                    expires_at: expiration
                }
            });
            response.headers = {
                'x-subject-token': expectedToken
            };
            response.body = expectedBody;
            var client = new HttpClient(credentials);
            client.setToken(response);
            var tokenBeforeRefresh = client.getToken();

            client.refreshToken()
                .then(function() {
                    var tokenAfterRefresh = client.getToken();

                    assert.deepEqual(tokenBeforeRefresh, tokenAfterRefresh);
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

    describe('refreshToken', function() {
        it('should correctly update token when token has expired', function(done) {
            HttpClient.prototype.isExpired = function(token) {
                return true;
            };
            var date = new Date();
            var expiration = (new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 5)).toString();
            var token = 'abcdef';
            var body = JSON.stringify({
                token: {
                    expires_at: expiration
                }
            });
            response.headers = {
                'x-subject-token': token
            };
            response.body = body;
            var expectedToken = {
                token: token,
                expiration: expiration
            }

            var request = function(options, callback) {
                callback(null, response, response.body);
            };
            var client = new HttpClient(credentials, request);
            client.refreshToken()
                .then(function() {
                    var actualToken = client.getToken();

                    assert.deepEqual(expectedToken, actualToken);
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

    describe('refreshToken', function() {
        it('should reject on error', function(done) {
            HttpClient.prototype.isExpired = function(token) {
                return true;
            };

            var request = function(options, callback) {
                callback('Test Error', {}, {});
            };
            var client = new HttpClient(credentials, request);
            client.refreshToken()
                .then(function() {
                    done('Expected an error, but did not receive one');
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should resolve promise on status 200', function(done) {
            response.statusCode = 200

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    assert.strictEqual(200, response.statusCode);
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

    describe('send', function() {
        it('should resolve promise on status 201', function(done) {
            response.statusCode = 201;
            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    assert.strictEqual(201, response.statusCode);
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

    describe('send', function() {
        it('should resolve promise on status 204', function(done) {
            response.statusCode = 204;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    assert.strictEqual(204, response.statusCode);
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

    describe('send', function() {
        it('should reject promise on status 404', function(done) {
            response.body = 'Test Body';
            response.statusCode = 404;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {

                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done('failed to reject upon status 404');
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should reject promise on status 408', function(done) {
            response.body = 'Test Body';
            response.statusCode = 408;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done('failed to reject upon status 408');
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should reject promise on status 409', function(done) {
            response.body = 'Test Body';
            response.statusCode = 409;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done('failed to reject upon status 408');
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should reject promise on status 411', function(done) {
            response.body = 'Test Body';
            response.statusCode = 411;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done('failed to reject upon status 411');
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should reject promise on status 422', function(done) {
            response.body = 'Test Body';
            response.statusCode = 422;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done('failed to reject upon status 422');
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should reject upon error from request', function(done) {

            var request = function(option, callback) {
                callback(new Error(), response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done(new Error());
                })
                .catch(function(err) {
                    done();
                });
        });
    });

    describe('send', function() {
        it('should reject upon unacceptable status code', function(done) {
            response.body = 'Test Body';
            response.statusCode = 500;

            var request = function(option, callback) {
                callback(null, response, response.body);
            };
            HttpClient.prototype.isExpired = function(token) {
                return false;
            };
            var client = new HttpClient(credentials, request);
            var options = {
                url: '',
                method: 'GET',
                headers: {}
            };
            client.send(options)
                .then(function(response) {
                    done(new Error());
                })
                .catch(function(err) {
                    done();
                });
        });
    });
});