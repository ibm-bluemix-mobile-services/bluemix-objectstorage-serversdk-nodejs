var assert = require('chai').assert,
  path = require('path'),
  _ = require('lodash'),
  async = require('async'),
  ObjectStorage = require('../lib/LocalObjectStorage').ObjectStorage,
  ObjectStorageContainer = require('../lib/LocalObjectStorageContainer').ObjectStorageContainer;

var credentials = require('./credentials.json');

describe('LocalObjectStorageContainer', function () {

  before(function () {
    new ObjectStorage(credentials.baseDir).initAndEmpty().then(function () {
      done();
    }).catch(function (err) {
      done(err);
    });  //to empty the target fs
  });

  describe('constructor', function () {
    it('should correctly set container name, resource url, http client, and ObjectStorage', function () {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      var objectStorageContainer = new ObjectStorageContainer('container0', objectStorage);

      assert.strictEqual(objectStorageContainer.objectStorage, objectStorage);
      assert.equal(objectStorageContainer.containerName(), 'container0');
      assert.equal(objectStorageContainer.baseResourceUrl, objectStorage.baseResourceUrl + 'container0' + path.sep);
      assert.equal(objectStorageContainer.client, objectStorage.client);
    });
  });

  describe('createObject', function () {
    it('should create a new ObjectStorageObject with the specified name', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container0').then(function (container) {
        container.createObject('test0')
          .then(function (object) {
            assert.equal(object.objectName(), 'test0');
            done();
          })
          .catch(function (err) {
            done(err);
          });
      }).catch(function (err) {
        done(err);
      });
    });
  });

  describe('create and list objects', function () {
    it('should correctly parse body and produce an array of objects when response body is nonempty', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      var expectedList = ['titi', 'toto', 'tata'];
      objectStorage.createContainer('container1').then(function (container) {
        async.eachSeries(expectedList, function (item, callback) {
            container.createObject(item, 'data of ' + item).then(function (objectStorage) {
              done();
            }).catch(function (err) {
              done(err);
            });
          },
          function done() {
            container.listObjects()
              .then(function (actualList) {
                assert.equal(actualList.length, expectedList.length);

                _.forEach(actualList, function (item, index) {
                  assert.equal(item.objectName(), expectedList[index]);
                });
                done();
              })
              .catch(done);
          }
        )
        ;
      }).catch(done);
    });
  });

  describe('listObjects', function () {
    it('should produce an empty array when response body is empty', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container2').then(function (container) {
        container.listObjects()
          .then(function (objList) {
            assert.equal(objList.length, 0);
            container.createObject('test0', 'stttuuuuuuuffffffffiiiiinngggggggg')
              .then(function (object) {
                assert.equal(object.objectName(), 'test0');
                container.listObjects()
                  .then(function (objList2) {
                    assert.equal(objList2.length, 1);
                    done();
                  })
                  .catch(done);
              })
              .catch(done);
          }).catch(done);
      }).catch(done);
    });
  });

  describe('getObject', function () {
    it('should create a ObjectStorageObject object with the specified name', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container3').then(function (container) {
        container.createObject('test0', 'stttuuuuuuuffffffffiiiiinngggggggg')
          .then(function (object) {
            assert.equal(object.objectName(), 'test0');
            done();
          })
        ;
      }).catch(done);
    });
  });

  describe('deleteObject', function () {
    it('should not produce an error', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container5').then(function (container) {
        container.deleteObject('test')
          .then(function () {
            done();
          })
          .catch(done);
      }).catch(done);
    });
  });

  describe('deleteObject', function () {
    it('should delete without error', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container4').then(function (container) {
        container.createObject('test0', 'stttuuuuuuuffffffffiiiiinngggggggg')
          .then(function (object) {
            container.deleteObject('test0')
              .then(function () {
                done();
              })
              .catch(done);
          })
        ;
      }).catch(done);
    });
  });

  describe('metadata', function () {
    it('should parse headers and only return x-container-meta headers corresponding to account metadata', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container4').then(function (container) {
        container.updateMetadata({this: 'this', that: 'that'})
          .then(function () {
            container.metadata()
              .then(function (metadata) {
                assert.isDefined(metadata);
                assert.isDefined(metadata.this);
                assert.equal(metadata.this, 'this');
                assert.isDefined(metadata.that);
                assert.equal(metadata.that, 'that');
                done();
              })
              .catch(done);
          });
      }).catch(done);
    });
  });

  describe('deleteMetadata', function () {
    it('should append appropriate header key to each metadata key passed in', function (done) {
      var objectStorage = new ObjectStorage(credentials.baseDir);
      objectStorage.createContainer('container5').then(function (container) {
        container.updateMetadata({this: 'this', that: 'that'})
          .then(function () {
            container.deleteMetadata({this: 'this'}).then(function () {
              container.metadata()
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
    });
  });
});