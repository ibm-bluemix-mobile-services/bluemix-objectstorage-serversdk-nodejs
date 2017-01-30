var assert = require('chai').assert;
var Q = require('q');
var _ = require('lodash');
var ObjectStorage = require('../lib/LocalObjectStorage').ObjectStorage;
var credentials = require('./credentials.json');
var path = require('path');

describe('LocalObjectStorage', function() {
    before(function() {
        new ObjectStorage(credentials.baseDir).initAndEmpty();  //to empty the target fs
    });

    describe('constructor', function() {
        it('should initialize credentials and resource url correctly', function() {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            assert.equal(objectStorage.baseResourceUrl, credentials.baseDir + path.sep);
        });

        it('should return an error', function() {
            try {
                var objectStorage = new ObjectStorage();
            }
            catch(err) {
                assert.equal(err.name, 'ReferenceError');
            }
        });
    });

    describe('Use Containers', function() {
        it('should correctly parse body and produce an array of containers', function(done) {
            var expectedList = [];
            var objectStorage = new ObjectStorage(credentials.baseDir);

            objectStorage.listContainers()
                .then(function(actualList){
                    assert.equal(actualList.length, expectedList.length);
                    actualList.forEach(function(item, index) {
                        assert.equal(item.containerName(), expectedList[index]);
                    });
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
        it('should create a container object with the specified name', function(done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            var expectedName = 'test';
            objectStorage.createContainer(expectedName)
              .then(function(container) {
                  assert.equal(container.containerName(), expectedName);
                  done();
              })
              .catch(function(err) {
                  done(err);
              });
        });
        it('should get a container object with the specified name', function(done) {
            var expectedName = 'test';
            var objectStorage = new ObjectStorage(credentials.baseDir);

            objectStorage.getContainer(expectedName)
              .then(function(container) {
                  assert.equal(container.containerName(), expectedName);
                  done();
              })
              .catch(function(err) {
                  done(err);
              });
        });
        it('should not produce an error', function(done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);

            objectStorage.deleteContainer('test')
                .then(function() {
                    done();
                })
                .catch(function(err) {
                    done(err);
                });
        });
    });

    describe('Use metadata', function() {
        it('should return empty array if non already initialized', function (done) {
            var objectStorage = new ObjectStorage(credentials.baseDir);
            var expectedMetadata = {};

            objectStorage.metadata()
              .then(function (actualMetadata) {
                  assert.deepEqual(actualMetadata, expectedMetadata);
                  done();
              })
              .catch(function (err) {
                  done(err);
              });
        });
    });

    describe('Use metadata', function() {
        it('should append appropriate header key to each metadata key passed in', function(done) {
            var metadata = {
                'this': 'this',
                'that': 'that'
            };
            var objectStorage = new ObjectStorage(credentials.baseDir);

            objectStorage.updateMetadata(metadata)
              .then(function() {
                  done();
              })
              .catch(function(err) {
                  done(err);
              });
        });
    });

    describe('Use metadata', function() {
        it('should append appropriate header key to each metadata key passed in', function(done) {
            var metadata = {
                'this': 'this',
                'that': 'that'
            };
            var objectStorage = new ObjectStorage(credentials.baseDir);

            objectStorage.deleteMetadata(metadata)
                .then(function() {
                    done();
                })
                .catch(function(err) {
                    done();
                });
        });
    });
});