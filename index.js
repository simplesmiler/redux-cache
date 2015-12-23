import immutable from 'object-path-immutable';

export { reducer };
export var actions = {
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

  state = immutable.assign(state, [action.id], action.data);
  state = immutable.assign(state, [action.id, 'valid'], valid);

  return state;
}

// @ASSERT: subtype is correct
function reduceInvalidate(state, action) {
  var valid = action.keys.reduce(setToFalse, {});

  state = immutable.assign(state, [action.id, 'valid'], valid);

  return state;
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
