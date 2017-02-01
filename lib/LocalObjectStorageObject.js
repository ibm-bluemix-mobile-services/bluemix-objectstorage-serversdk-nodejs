var Q = require('q'),
  _ = require('lodash'),
  fs = require('fs'),
  path = require('path');

/**
 * Constructor
 * @param name
 * @param objectStorageContainer
 * @constructor
 */
function ObjectStorageObject(name, objectStorageContainer) {
  this.name = name;
  this.baseResourceUrl = objectStorageContainer.baseResourceUrl + name;
  this.objectStorage = objectStorageContainer.objectStorage;
}

/**
 *  Load the content of this object.
 *
 *  @param {boolean} shouldCache.  A flag telling this object whether or not to cache the data internally.
 *  @param {boolean} binary. True if the content of this object is binary and should not be parsed
 *  @return promise
 */
ObjectStorageObject.prototype.load = function (shouldCache, binary) {
  var deferred = Q.defer();
  var resourceUrl = this.baseResourceUrl;
  var self = this;

  if (fs.existsSync(resourceUrl)) {
    fs.readFile(resourceUrl, function (err, data) {
      if (!err && data) {
        var dataJson = JSON.parse(data);
        if (shouldCache) {
          self.data = dataJson.data;
        }
        self.setContentType(dataJson.contentType);
        deferred.resolve(content);
      } else if (!data) {
        deferred.resolve("");
      } else {
        deferred.reject(err);
      }
    });
  } else {
    deferred.reject(new Error(resourceUrl + ' is not found'));
  }

  return deferred.promise;
};

/**
 *  Retrieve the metadata for this object.
 *
 */
ObjectStorageObject.prototype.metadata = function () {
  var deferred = Q.defer();
  var resourceUrl = this.baseResourceUrl;

  this.client.head(resourceUrl)
    .then(function (response) {
      var headers = response.headers;
      var accountMetadata = _.pickBy(headers, function (value, key) {
        return _.startsWith(key, 'x-object');
      });
      deferred.resolve(accountMetadata);
    })
    .catch(function (err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 *  Create or Update the specified metadata for this object.
 *
 *  @param {object} metadata.  The metadata to update/create for this object.
 *  @return promise
 */
ObjectStorageObject.prototype.updateMetadata = function (metadata) {
  var deferred = Q.defer();
  var prefix = 'X-Object-Meta-';
  var resourceUrl = this.baseResourceUrl;
  var headers = {};

  _.forIn(metadata, function (value, key) {
    var metadataKey = prefix + key;
    headers[metadataKey] = value;
  });

  this.client.post(resourceUrl, headers)
    .then(function (response) {
      deferred.resolve();
    })
    .catch(function (err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 *  Delete the specified metadata for this object.
 *
 *  @param {object} metadata.  The metadata to delete for this object.
 *  @return promise
 */
ObjectStorageObject.prototype.deleteMetadata = function (metadata) {
  var deferred = Q.defer();
  var prefix = 'X-Remove-Object-Meta-';
  var resourceUrl = this.baseResourceUrl;
  var headers = {};

  _.forIn(metadata, function (value, key) {
    var metadataKey = prefix + key;
    headers[metadataKey] = value;
  });

  this.client.post(resourceUrl, headers)
    .then(function (response) {
      deferred.resolve();
    })
    .catch(function (err) {
      deferred.reject(err);
    });

  return deferred.promise;
};

/**
 *  For the testing of things
 *
 */
ObjectStorageObject.prototype.objectName = function () {
  return this.name;
};

/**
 *  Set the Content-Type
 *
 * @param {string} contentType. The Content-Type of this object. e.g. 'image/jpeg'
 */
ObjectStorageObject.prototype.setContentType = function (contentType) {

  this.contentType = contentType;
}

/**
 *  Get the Content-Type of the object when we are loading
 *
 * @return Content-Type. The Content-Type of the object, e.g. image/png
 */
ObjectStorageObject.prototype.getContentType = function () {

  return this.contentType;
}

module.exports = {
  ObjectStorageObject: ObjectStorageObject
};