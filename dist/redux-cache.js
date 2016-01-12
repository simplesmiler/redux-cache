(function (exports) { 'use strict';

  var index = (function (module) {
  var exports = module.exports;
  (function (root, factory){
    'use strict';
    
    /*istanbul ignore next:cant test*/
    if (typeof module === 'object' && typeof module.exports === 'object') {
      module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define([], factory);
    } else {
      // Browser globals
      root.objectPath = factory();
    }
  })(this, function(){
    'use strict';
    var _hasOwnProperty = Object.prototype.hasOwnProperty
    
    function isEmpty(value){
      if (!value) {
        return true;
      }
      if (isArray(value) && value.length === 0) {
        return true;
      } else if (!isString(value)) {
        for (var i in value) {
          if (_hasOwnProperty.call(value, i)) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    
    function isNumber(value){
      return typeof value === 'number';
    }
    
    function isString(obj){
      return typeof obj === 'string';
    }
    
    function isArray(obj){
      return Array.isArray(obj)
    }
    
    function getKey(key){
      var intKey = parseInt(key);
      if (intKey.toString() === key) {
        return intKey;
      }
      return key;
    }
    
    var objectPathImmutable = function(obj) {
      var newOp = Object.keys(objectPathImmutable).reduce(function(proxy, prop) {
        /*istanbul ignore else*/
        if (typeof objectPathImmutable[prop] === 'function') {
          proxy[prop] = function() {
            var args = Array.prototype.slice.call(arguments).concat([obj])
            return objectPathImmutable(objectPathImmutable[prop].apply(objectPathImmutable, args))
          }
        }
        
        return proxy;
      }, {})
      
      newOp.value = function() {
        return obj
      }
      
      return newOp
    };
    
    function clone(obj, createIfEmpty, assumeArray) {
      if(obj == null) {
        if(createIfEmpty) {
          if(assumeArray) {
            return []
          }
          
          return {}
        }
        
        return obj
      } else if(isArray(obj)) {
        return obj.slice()
      }
      
      var res = {}
      for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
          res[key] = obj[key]
        }
      }
      
      return res
    }
    
    
    function changeImmutable(obj, path, changeCallback) {
      if (isNumber(path)) {
        path = [path]
      }
      if (isEmpty(path)) {
        return obj;
      }
      if (isString(path)) {
        return changeImmutable(obj, path.split('.').map(getKey), changeCallback);
      }
      var currentPath = path[0]
      var clonedObj = clone(obj, true, isNumber(currentPath))
      if (path.length === 1) {
        return changeCallback(clonedObj, currentPath)
      }
    
      clonedObj[currentPath] = changeImmutable(clonedObj[currentPath], path.slice(1), changeCallback)
      return clonedObj
    }
    
    objectPathImmutable.set = function(obj, path, value) {
      return changeImmutable(obj, path, function(clonedObj, finalPath) {
        clonedObj[finalPath] = value
        return clonedObj
      })
    }
    
    objectPathImmutable.push = function (obj, path /*, values */) {
      var values = Array.prototype.slice.call(arguments, 2)
      return changeImmutable(obj, path, function(clonedObj, finalPath) {
        if (!isArray(clonedObj[finalPath])) {
          clonedObj[finalPath] = values
        } else {
          clonedObj[finalPath] = clonedObj[finalPath].concat(values)
        }
        return clonedObj
      })
    }
    
    objectPathImmutable.del = function (obj, path, value, at){
      return changeImmutable(obj, path, function(clonedObj, finalPath) {
        if(Array.isArray(clonedObj)) {
          if(clonedObj[finalPath]) {
            clonedObj.splice(finalPath, 1)
          }
        } else {
          if(clonedObj.hasOwnProperty(finalPath)) {
            delete clonedObj[finalPath]
          }
        }
        return clonedObj
      })
    }
    
    objectPathImmutable.assign = function(obj, path, source) {
      return changeImmutable(obj, path, function(clonedObj, finalPath) {
        source = Object(source);
        var target = clone(clonedObj[finalPath], true)

        for (var key in source) {
          if (_hasOwnProperty.call(source, key)) {
            target[key] = source[key]
          }
        }

        clonedObj[finalPath] = target
        return clonedObj
      })
    }
    
    return objectPathImmutable
  })
  return module.exports;
  })({exports:{}});

  var actions = {
    update: update,
    invalidate: invalidate,
  };



  // === @SECTION: action types === //

  var UPDATE = 'simplesmiler/redux-cache/UPDATE';
  var INVALIDATE = 'simplesmiler/redux-cache/INVALIDATE';



  // === @SECTION: actions === //

  function update(subtype, id, data) {
    return {
      type: UPDATE,
      subtype: subtype,
      id: id,
      data: data,
    };
  }

  function invalidate(subtype, id, keys) {
    return {
      type: INVALIDATE,
      subtype: subtype,
      id: id,
      keys: keys,
    };
  }



  // === @SECTION: reducer factory === //

  function reducer(subtype) {
    var initialState = {};
    return reduce;

    function reduce(state, action) {
      // @NOTE: bootstrap state
      if (state === undefined) return initialState;

      // @NOTE: ignore actions for other subtypes
      if (action.subtype !== subtype) return state;

      // @NOTE: do stuff
      if (action.type === UPDATE) return reduceUpdate(state, action);
      if (action.type === INVALIDATE) return reduceInvalidate(state, action);

      // @NOTE: ignore foreign actions
      return state;
    }
  }



  // === @SECTION: shared reducers === //

  // @ASSERT: subtype is correct
  function reduceUpdate(state, action) {
    var valid = Object.keys(action.data).reduce(setToTrue, {});

    state = index.assign(state, [action.id], action.data);
    state = index.assign(state, [action.id, 'valid'], valid);

    return state;
  }

  // @ASSERT: subtype is correct
  function reduceInvalidate(state, action) {
    var valid = action.keys.reduce(setToFalse, {});

    state = index.assign(state, [action.id, 'valid'], valid);

    return state;
  }


  // === @SECTION: select === //

  function select(cache, id, keys) {
    var result = {
      id: id,
      ready: {},
    };

    var entity = cache[id];

    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      if (entity !== undefined && entity[key] !== undefined) {
        result[key] = entity[key];
        result.ready[key] = true;
      } else {
        result.ready[key] = false;
      }
    }

    return result;
  }




  // === @SECTION: exports === //

  // @NOTE: mutable
  function setToTrue(state, key) {
    state[key] = true;
    return state;
  }

  // @NOTE: mutable
  function setToFalse(state, key) {
    state[key] = false;
    return state;
  }

  exports.reducer = reducer;
  exports.select = select;
  exports.actions = actions;

})((this.ReduxCache = {}));