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
var assert = require('chai').assert,
  Q = require('q'),
  fs = require('fs'),
  path = require('path'),
  ObjectStorage = require('../lib/LocalObjectStorage').ObjectStorage,
  ObjectStorageContainer = require('../lib/LocalObjectStorageContainer').ObjectStorageContainer,
  ObjectStorageObject = require('../lib/LocalObjectStorageObject').ObjectStorageObject;

var credentials = require('./credentials.json');

var binary1;
fs.readFile(path.resolve("./test/pb-apache.png"), function (err, data) {
    if (err) throw new Error(err);
    binary1 = data.toString('base64');
});
var binary2;
fs.readFile(path.resolve("./test/las-vegas-parano-gif-542ad8bb84cab.gif"), function (err, data) {
    if (err) throw new Error(err);
    binary2 = data.toString('base64');
});

describe('LocalObjectStorageObject', function () {

    before(function () {
        new ObjectStorage(credentials.baseDir).initAndEmpty().then(function () {
            done();
        }).catch(function (err) {
            done(err);
        });  //to empty the target fs
    });

    describe('constructor', function () {
        it('should correctly set object name, resource url, http client, and ObjectStorageContainer', function () {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            var objectStorageContainer = new ObjectStorageContainer('container0', objectStorage);
            var objectStorageObject = new ObjectStorageObject('object', objectStorageContainer);

            assert.strictEqual(objectStorageObject.objectStorage, objectStorage);
            assert.equal(objectStorageObject.objectName(), 'object');
            assert.equal(objectStorageObject.baseResourceUrl, objectStorageContainer.baseResourceUrl + 'object');
            assert.equal(objectStorageObject.client, objectStorage.client);
        });
    });

    describe('load', function () {
        it('should launch an error if object does not exists', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            var objectStorageContainer = new ObjectStorageContainer('container0', objectStorage);
            var objectStorageObject = new ObjectStorageObject('fake', objectStorageContainer);

            assert.equal(objectStorageObject.objectName(), 'fake');
            objectStorageObject.load().then(function (data) {
                done(new Error('Error has not been launched'));
            }).catch(function (err) {
                done();
            });
        });
    });

    describe('load', function () {
        it('should cache data when function parameter is true (binary1)', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container0').then(function (container) {
                container.createObject('test0', null, binary1)
                  .then(function (object) {
                      assert.equal(object.objectName(), 'test0');
                      object.load(true, true).then(function (data) {
                          assert.equal(data, binary1);
                          assert.equal(object.data, binary1);
                          done();
                      }).catch(done);
                  }).catch(done);
            }).catch(done);
        });
    });

    describe('load', function () {
        it('should cache data when function parameter is true (binary2)', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container0').then(function (container) {
                container.createObject('test1', null, binary2)
                  .then(function (object) {
                      assert.equal(object.objectName(), 'test1');
                      object.load(true, true).then(function (data) {
                          assert.equal(data, binary2);
                          assert.equal(object.data, binary2);
                          done();
                      }).catch(done);
                  }).catch(done);
            }).catch(done);
        });
    });

    describe('load', function () {
        it('should not cache data when function parameter is false (binary1)', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container0').then(function (container) {
                container.createObject('test2', null, binary1)
                  .then(function (object) {
                      assert.equal(object.objectName(), 'test2');
                      object.load(false, true).then(function (data) {
                          assert.equal(data, binary1);
                          assert.notOk(object.data);
                          done();
                      }).catch(done);
                  }).catch(done);
            }).catch(done);
        });
    });

    describe('load', function () {
        it('should not cache data when function parameter is false (binary2)', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container0').then(function (container) {
                container.createObject('test3', null, binary2)
                  .then(function (object) {
                      assert.equal(object.objectName(), 'test3');
                      object.load(false, true).then(function (data) {
                          assert.equal(data, binary2);
                          assert.notOk(object.data);
                          done();
                      }).catch(done);
                  }).catch(done);
            }).catch(done);
        });
    });

    describe('metadata', function () {
        it('should parse headers and only return x-object-meta headers corresponding to account metadata', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container1').then(function (container) {
                container.createObject('test1', null, binary1)
                  .then(function (object) {
                      assert.equal(object.objectName(), 'test1');
                      object.updateMetadata({this: 'this', that: 'that'}).then(function () {
                          object.metadata()
                            .then(function (metadata) {
                                assert.isDefined(metadata);
                                assert.isDefined(metadata.this);
                                assert.equal(metadata.this, 'this');
                                assert.isDefined(metadata.that);
                                assert.equal(metadata.that, 'that');
                                done();
                            })
                            .catch(done);
                      }).catch(done);
                  }).catch(done);
            }).catch(done);
        });
    });

    describe('deleteMetadata', function () {
        it('should append appropriate header key to each metadata key passed in', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container1').then(function (container) {
                container.createObject('test1', null, binary1)
                  .then(function (object) {
                      assert.equal(object.objectName(), 'test1');
                      object.updateMetadata({this: 'this', that: 'that'}).then(function () {
                          object.metadata()
                            .then(function (metadata) {
                                assert.isDefined(metadata);
                                assert.isDefined(metadata.this);
                                assert.equal(metadata.this, 'this');
                                assert.isDefined(metadata.that);
                                assert.equal(metadata.that, 'that');

                                object.deleteMetadata({this: 'this'}).then(function () {
                                    object.metadata()
                                      .then(function (metadata) {
                                          assert.isDefined(metadata);
                                          assert.isUndefined(metadata.this);
                                          assert.isDefined(metadata.that);
                                          assert.equal(metadata.that, 'that');
                                          done();
                                      }).catch(done);
                                }).catch(done);
                            }).catch(done);
                      }).catch(done);
                  }).catch(done);
            }).catch(done);
        });
    });

    describe('getContentType', function () {
        it('should correctly set the content type from the response header', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            objectStorage.createContainer('container1').then(function (container) {
                container.createObject('test1', null, binary1)
                  .then(function (object) {
                      object.load().then(function (data) {
                          assert.isDefined(object);
                          assert.equal(object.getContentType(), "binary");
                          done();
                      }).catch(done);
                  }).catch(done);
            });
        });
    });

});