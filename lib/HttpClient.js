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
var log4js = require('log4js');

var logger = log4js.getLogger('HttpClient');

function HttpClient(credentials, request) {
    this.request = request;
    this.authBody = {
        auth: {
            identity: {
                methods: [
                    'password'
                ],
                password: {
                    user: {
                        id: credentials.userId,
                        password: credentials.password
                    }
                }
            },
            scope: {
                project: {
                    id: credentials.projectId
                }
            }
        }
    };

    this.authToken = {
        token: '',
        expiration: (new Date()).toString()
    };
}

HttpClient.prototype.setToken = function(response) {
    var body = JSON.parse(response.body);
    this.authToken.token = response.headers['x-subject-token'];
    this.authToken.expiration = body.token.expires_at;
};

HttpClient.prototype.getToken = function() {
    return this.authToken;
};

HttpClient.prototype.refreshToken = function() {
    var deferred = Q.defer();

    if (this.isExpired(this.authToken)) {
        var options = {
            url: 'https://identity.open.softlayer.com/v3/auth/tokens',
            method: 'POST',
            headers: {
                Accept: 'application/json'
            },
            body: JSON.stringify(this.authBody)
        };
        var self = this;
        self.request(options, function(err, response, body) {
            if (err) {
                logger.error('Error received while requesting authorization token');
                logger.error(err.message);
                deferred.reject(new AuthTokenError());
            }
            else {
                self.setToken(response);
                deferred.resolve();
            }
        });
    }
    else {
        deferred.resolve();
    }

    return deferred.promise;
};

HttpClient.prototype.isExpired = function(authToken) {
    var now = Date.now();
    var expiration = new Date(authToken.expiration);
    var refreshLimit = new Date(expiration.getFullYear(), expiration.getMonth(), expiration.getDate(), expiration.getHours(), expiration.getMinutes() - 10).getTime();

    return (now >= refreshLimit);
};

HttpClient.prototype.get = function(resourceUrl, nullEncoding) {
    var options = {
        url: resourceUrl,
        method: 'GET',
        headers: {}
    };
    if (nullEncoding) {
        options.encoding = null;
    }
    return this.send(options);
};

HttpClient.prototype.put = function(resourceUrl, data, nullEncoding) {
    var options = {
        url: resourceUrl,
        method: 'PUT',
        headers: {},
        body: data
    };
    if (nullEncoding) {
        options.encoding = null;
        options.headers['X-Detect-Content-Type'] = true;
    }

    return this.send(options);
};

HttpClient.prototype.delete = function(resourceUrl) {
    var options = {
        url: resourceUrl,
        method: 'DELETE',
        headers: {}
    };

    return this.send(options);
};

HttpClient.prototype.post = function(resourceUrl, headers) {
    var options = {
        url: resourceUrl,
        method: 'POST',
        headers: headers
    };

    return this.send(options);
};

HttpClient.prototype.head = function(resourceUrl) {
    var options = {
        url: resourceUrl,
        method: 'HEAD',
        headers: {}
    };

    return this.send(options);
};

HttpClient.prototype.send = function(options) {
    var deferred = Q.defer();
    var self = this;
    var requestOptions = options;

    this.refreshToken()
        .then(function() {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.headers['X-Auth-Token'] = self.authToken.token;

            self.request(requestOptions, function(error, response, body) {
                if (error) {
                    logger.error('Error caught making request to object storage');
                    logger.error(error.message);
                    deferred.reject(error);
                }
                else {
                    var status = response.statusCode;
                    switch (status) {
                        case 200:
                        case 201:
                        case 204:
                            deferred.resolve(response);
                            break;
                        case 404:
                            deferred.reject(new ResourceNotFoundError());
                            break;
                        case 408:
                            deferred.reject(new TimeoutError());
                            break;
                        case 409:
                            deferred.reject(new DeleteConflictError());
                            break;
                        case 411:
                        case 416:
                        case 422:
                            deferred.reject(new BadRequestError());
                            break;
                        default:
                            logger.error('Unexpected status code returned from request to object storage');
                            logger.error('status :: ' + status);
                            logger.error('body :: ' + body);
                            deferred.reject(new ServerError());
                    }
                }
            });
        })
        .catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};

HttpClient.prototype.getAuthBody = function() {
    return this.authBody;
};

function ResourceNotFoundError(message) {
    this.name = 'ResourceNotFoundError';
    this.message = message || 'Unable to locate specified resource';
}

function TimeoutError(message) {
    this.name = 'TimeoutError';
    this.message = message || 'The request timed out'
}

ResourceNotFoundError.prototype = Error.prototype;

function BadRequestError(message) {
    this.name = 'BadRequestError';
    this.message = message || 'Bad request';
}

BadRequestError.prototype = Error.prototype;

function DeleteConflictError(message) {
    this.name = 'DeleteConflictError';
    this.message = message || 'There was a conflict deleting the container. Containers must be empty before deletion';
}

DeleteConflictError.prototype = Error.prototype;

function ServerError(message) {
    this.name = 'ServerError';
    this.message = message || 'A server error occurred';
}

ServerError.prototype = Error.prototype;

function AuthTokenError(message) {
    this.name = 'AuthTokenError';
    this.message = message || 'An error occurred retrieving the authentication token';
}

AuthTokenError.prototype = Error.prototype;

module.exports = {
    HttpClient: HttpClient
};