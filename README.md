
[![Build Status](https://travis-ci.org/ibm-bluemix-mobile-services/bluemix-objectstorage-serversdk-nodejs.svg?branch=master)](https://travis-ci.org/ibm-bluemix-mobile-services/bluemix-objectstorage-serversdk-nodejs.svg?branch=master)

# BluemixObjectStorage



## Installation
```sh
npm install --save bluemix-objectstorage
```

## Usage

```javascript
var ObjectStorage = require('bluemix-objectstorage').ObjectStorage;
```

### ObjectStorage

Use an `ObjectStorage` instance to connect to the IBM Object Storage service and manage containers.

Pass in a credentials object containing projectId, userId, password, and region to the `ObjectStorage` constructor in order to establish a connection with the IBM Object Storage service on Bluemix

```javascript
var credentials = {
    projectId: 'project-id',
    userId: 'user-id',
    password: 'password',
    region: ObjectStorage.Region.DALLAS
};
var objStorage = new ObjectStorage(credentials);
```
> Note: If a credentials object is not passed into the `ObjectStorage` constructor, then the constructor will attempt to read the appropriate values from `VCAP_SERVICES`. If no entry for Object Storage can be found in `VCAP_SERVICES`, then an error will be thrown.


#### Retrieve a list of existing containers

```javascript
objstorage.listContainers()
    .then(function(containerList) {
        // containerList - an array of ObjectStorageContainers
        // containerList may be empty
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
}
```

#### Create a new container

```javascript
objstorage.createContainer('container-name')
    .then(function(container) {
        // container - the ObjectStorageContainer that was created
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
}
```

#### Retrieve an existing container

```javascript
objstorage.getContainer('container-name')
    .then(function(container) {
        // container - the specified ObjectStorageContainer fetched from the IBM Object Storage service
    })
    .catch(function(err) {
        // ResourceNotFoundError if the specified container does not exist
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
}
```

#### Delete an existing container

```javascript
objstorage.deleteContainer('container-name')
    .then(function() {
        // if the promise resolved, then the operation was successful
    })
    .catch(function(err) {
        // ResourceNotFoundError if the specified container does not exist
        // DeleteConflictError if the container is not empty before attempting to delete
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```
> Note: A container **MUST** be empty in order for it to be deleted.


#### Update/Create account metadata

```javascript
var metadata = {
    'some-key': 'some-value',
    'another-key': 'another-value'
};
objstorage.updateMetadata(metadata)
    .then(function() {
        // if the promise resolved, then the operation was successful
        // verify by retrieving metadata
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
}
```

#### Retrieve account metadata

```javascript
objstorage.metadata()
    .then(function(metadata) {
        // metadata - an object containing account metadata
        // keys are of the form 'x-account-meta-{name}'
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Delete account metadata

```javascript
var metadata = {
    'some-key': 'some-value',
    'another-key': 'another-value'
};
objstorage.deleteMetadata(metadata)
    .then(function() {
        // if the promise resolved, then the operation was successful
        // verify by retrieving metadata
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

### ObjectStorageContainer

Use `ObjectStorageContainer` instance to manage objects inside of particular container

#### Create a new object or update an existing one

```javascript
container.createObject('object-name', data)
    .then(function(object) {
        // object - the ObjectStorageObject that was created
    })
    .catch(function(err) {
        // TimeoutError if the request timed out
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Retrieve an existing object

```javascript
container.getObject('object-name')
    .then(function(object) {
        // object - the specified ObjectStorageObject that was fetched from the container
    })
    .catch(function(err) {
        // ResourceNotFoundError if the specified container does not exist
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Retrieve a list of existing objects

```javascript
container.listObjects()
    .then(function(objectList) {
        // objectList - the list of ObjectStorageObjects in this container
        // objectList may be empty
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Delete an existing object

```javascript
container.deleteObject('object-name')
    .then(function() {
        // if the promise resolved, then the request was successful
    })
    .catch(function(err) {
        // ResourceNotFoundError if the specified container does not exist
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Update/Create container metadata

```javascript
var metadata = {
    'some-key': 'some-value',
    'another-key': 'another-value'
};
container.updateMetadata(metadata)
    .then(function() {
        // if the promise resolved, then the operation was successful
        // verify by retrieving metadata
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
}
```

#### Retrieve container metadata

```javascript
container.metadata()
    .then(function(metadata) {
        // metadata - an object containing container metadata
        // keys are of the form 'x-container-meta-{name}'
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Delete container metadata

```javascript
var metadata = {
    'some-key': 'some-value',
    'another-key': 'another-value'
};
container.deleteMetadata(metadata)
    .then(function() {
        // if the promise resolved, then the operation was successful
        // verify by retrieving metadata
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

### ObjectStorageObject

Use `ObjectStorageObject` instance to load object content on demand

#### Load the object content

```javascript
object.load(false)
    .then(function(content) {
        // content - the content of the ObjectStorageObject
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Update/Create object metadata

```javascript
var metadata = {
    'some-key': 'some-value',
    'another-key': 'another-value'
};
object.updateMetadata(metadata)
    .then(function() {
        // if the promise resolved, then the operation was successful
        // verify by retrieving metadata
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
}
```

#### Retrieve object metadata

```javascript
object.metadata()
    .then(function(metadata) {
        // metadata - an object containing object metadata
        // keys are of the form 'x-object-meta-{name}'
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

#### Delete object metadata

```javascript
var metadata = {
    'some-key': 'some-value',
    'another-key': 'another-value'
};
object.deleteMetadata(metadata)
    .then(function() {
        // if the promise resolved, then the operation was successful
        // verify by retrieving metadata
    })
    .catch(function(err) {
        // AuthTokenError if there was a problem refreshing authentication token
        // ServerError if any unexpected status codes were returned from the request
    });
```

## License

Copyright 2016 IBM Corp.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.