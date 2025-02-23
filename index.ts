interface State
{
  set?: Function;
  [key: string]: any;
}
export const newState = () =>
{
  const state: State = {
    data: {},
    watch: {},
    once: {},
    until: {},
    when: {},
    and: {},
    or: { thisisor: 1},
    isValuesToCheckAgainst: [],
    is: function (is) {
      this.conditionToSet += '_cvid_' + this.isValuesToCheckAgainst.length;
      this.isValuesToCheckAgainst = [...this.isValuesToCheckAgainst, is];
      return this;
    },
    conditionToSet: '',
    lastAccessedValue: null,
  };

  Object.defineProperty(state.or, 'more', {
    get: function ()
    {
      console.log(state.conditionToSet);
      if (state.conditionToSet.indexOf('_cvid_') > -1) {
        state.conditionToSet += '_omore_';
        return state;
      } else {
        throw new Error('You must use the is() method before using the "more"');
      }
    }
  });

  Object.defineProperty(state.or, 'less', {
    get: function ()
    {
      if (state.conditionToSet.indexOf('_cvid_') > -1) {
        state.conditionToSet += '_oless_';
        return state;
      } else {
        throw new Error('You must use the is() method before using the "less"');
      }
    }
  });

  function setStateMembers(payl) {
    Object.keys(payl).forEach(key => {
      const altkey = `_${key}`;
      if (this[key]) return;
      this.data[altkey] = { value: payl[key] };
      this.watch[key] = {};
  
      Object.defineProperty(state, key, {
        set: (v) => {
          const was = this.data[altkey].value;
          this.data[altkey].value = v;
  
          // always run
          const watchers = this.watch[`get_${key}`];
          const oncers = this.once[key];
          const cond_watchers = this.until[key];
          if (watchers && watchers.length) {
            watchers.forEach(entry => {
              let conditionResult = entry.condition ? entry.condition.split('_ncd_').reduce((result, cd) =>
              {
                let [condition, checkValueId] = cd.split('_cvid_');
                let orMore = false;
                let orLess = false;
                if (checkValueId) {
                  if (checkValueId.indexOf('_omore_') > -1) {
                    orMore = true;
                    checkValueId = checkValueId.replace('_omore_', '');
                  }
                  if (checkValueId.indexOf('_oless_') > -1) { 
                    orLess = true;
                    checkValueId = checkValueId.replace('_oless_', '');
                  }
                }
                
                let checkValue = entry.isValues[checkValueId];
                
                const operator = condition[0] === '&' ? 'and' : condition[0] === '|' ? 'or' : 'none';
                if (checkValueId) {
                  /*
                  If is() method provided with a function we run the function and return early before value checking
                  */
                  if (checkValue.call) {
                    return checkValue(this.data[`_${condition}`]?.value);
                  }
                  if (orMore) {
                    switch (operator) {
                      case 'none':
                        return result && !!(this.data[`_${condition}`]?.value >= checkValue);
                      case 'and':
                        return result && !!((this.data[`_${condition.slice(1)}`]?.value) >= checkValue);
                      case 'or':
                        return result || !!((this.data[`_${condition.slice(1)}`]?.value) >= checkValue);
                    }
                  } else if (orLess) { 
                    switch (operator) {
                      case 'none':
                        return result && !!(this.data[`_${condition}`]?.value <= checkValue);
                      case 'and':
                        return result && !!((this.data[`_${condition.slice(1)}`]?.value) <= checkValue);
                      case 'or':
                        return result || !!((this.data[`_${condition.slice(1)}`]?.value) <= checkValue);
                    }
                  } else {
                    switch (operator) {
                      case 'none':
                        return result && !!(this.data[`_${condition}`]?.value === checkValue);
                      case 'and':
                        checkValue
                        console.log(this.data[`_${condition.slice(1)}`]?.value);
                        console.log(!!((this.data[`_${condition.slice(1)}`]?.value) === checkValue));
                        result;
                        return result && !!((this.data[`_${condition.slice(1)}`]?.value) === checkValue);
                      case 'or':
                        return result || !!((this.data[`_${condition.slice(1)}`]?.value) === checkValue);
                    }
                  }
                } else {
                  switch (operator) {
                    case 'none':
                      return result && !!this.data[`_${condition}`]?.value;
                    case 'and':
                      return result && !!(this.data[`_${condition.slice(1)}`]?.value);
                    case 'or':
                      return result || !!(this.data[`_${condition.slice(1)}`]?.value);
                  }
                }
              }, true) : true;
  
              if (conditionResult) {
                entry.fn(v, was, this.data);
              }
            });
          }
          if (oncers && oncers.length) {
            oncers.forEach(cb => cb(v, was, this.data));
            this.data[altkey].once = [];
          }
          if (cond_watchers && cond_watchers.length) {
            const remaining_watchers = cond_watchers.filter(cb => cb(v, was, this.data));
            this.data[altkey].once = remaining_watchers;
          }
  
        },
        get: () => {
          if (this.conditionToSet) {
            throw new Error('You should you one of the following after declaring a "when statement": and, or, watch');
          }
          this.lastAccessedValue = altkey;
          return this.data[altkey].value;
        }
      });
  
      /*********
       * WATCH *
       *********/
      Object.defineProperty(this.watch, key, {
        set: (_fn) => {
          const setWatcher = (fn) => {
            const condition = this.conditionToSet;
            const isValues = this.isValuesToCheckAgainst.slice();
            this.conditionToSet = '';
            this.isValuesToCheckAgainst = [];
            this.data[altkey].watch = [...(this.data[altkey].watch || []), { condition, fn, isValues }];
          };
          if (_fn) { setWatcher(_fn); }
        },
        get: () => {
          const setWatcher = (fn) => {
            const condition = this.conditionToSet;
            const isValues = this.isValuesToCheckAgainst.slice();
            this.conditionToSet = '';
            this.isValuesToCheckAgainst = [];
            this.data[altkey].watch = [...(this.data[altkey].watch || []), { condition, fn, isValues }];
          };
          return (_fn) => { if (_fn.call) { setWatcher(_fn); } };
        }
      });
  
      Object.defineProperty(this.watch, `get_${key}`, {
        get: () => {
          return this.data[altkey].watch;
        }
      });
  
      /********
       * ONCE *
       ********/
      Object.defineProperty(this.once, key, {
        set: (fn) => {
          this.data[altkey].once = [...(this.data[altkey].once || []), fn];
        },
        get: () => {
          this.lastAccessedValue = altkey;
          return this.data[altkey].once;
        }
      });
      /*********
       * UNTIL *
       *********/
      Object.defineProperty(this.until, key, {
        set: (fn) => {
          this.data[altkey].until = [...(this.data[altkey].onchange || []), fn];
        },
        get: () => {
          this.lastAccessedValue = altkey;
          return this.data[altkey].until;
        }
      });
  
      /********
       * WHEN *
       ********/
      Object.defineProperty(this.when, key, {
        get: () => {
          this.lastAccessedValue = altkey;
          this.conditionToSet = key;
          return this;
        }
      });
      /********
       * AND *
       ********/
      Object.defineProperty(this.and, key, {
        get: () => {
          this.lastAccessedValue = altkey;
          this.conditionToSet += '_ncd_&' + key;
          return this;
        }
      });
      /********
       * OR *
       ********/
      Object.defineProperty(this.or, key, {
        get: () => {
          this.lastAccessedValue = altkey;
          this.conditionToSet += '_ncd_|' + key;
          return this;
        }
      });

    });
  }
  
  Object.defineProperty(state, "set", {
    set: (payl) => setStateMembers.call(state, payl),
    get: () => (payl) => {
      return setStateMembers.call(state, payl);
    }
  });
  /********************
   * when.watch ERROR *
   ********************/
  Object.defineProperty(state.when, 'watch', {
    get: () => {
      throw new Error('You should specify a state member to check after "when" before calling watch');
    }
  });
  /********************
   * when.and ERROR *
   ********************/
  Object.defineProperty(state.when, 'and', {
    get: () => {
      throw new Error('You should specify a state member to check after "when" before calling "and"');
    }
  });
  /********************
   * when.or ERROR *
   ********************/
  Object.defineProperty(state.when, 'or', {
    get: () => {
      const trace = console.trace();
      throw new Error('You should specify a state member to check after "when" before calling "or"');
    }
  });

  return state;
};

const globalState = newState();

export default globalState;
