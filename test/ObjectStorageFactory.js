var assert = require('chai').assert;

var ObjectStorageFactory = require('../lib/ObjectStorageFactory').ObjectStorageFactory;

var credentials = require('./credentials.json');

describe('ObjectStorageFactory', function() {
  describe('constructor', function() {
    it('should correctly return a Local ObjectStorage', function() {
      var options = {
        baseDir: "/tmp/gniiii"
      };
      var objectStorage = new ObjectStorageFactory(options).objStorage;

      assert.equal(objectStorage.baseResourceUrl, "/tmp/gniiii/");
    });

    it('should correctly return an ObjectStorage', function() {
      var options = {
        credentials: credentials
      };
      var objectStorage = new ObjectStorageFactory(options).objStorage;

      var authBody = objectStorage.client.getAuthBody();
      assert.equal(objectStorage.baseResourceUrl, credentials.region + credentials.projectId);
      assert.equal(authBody.auth.scope.project.id, credentials.projectId);
      assert.equal(authBody.auth.identity.password.user.id, credentials.userId);
      assert.equal(authBody.auth.identity.password.user.password, credentials.password);
    });
  });

});