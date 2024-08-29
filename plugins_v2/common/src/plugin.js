const C3 = globalThis.C3;

//<-- PLUGIN_INFO -->

const camelCasedMap = new Map();

function camelCasify(str) {
  // If the string is already camelCased, return it
  if (camelCasedMap.has(str)) {
    return camelCasedMap.get(str);
  }
  // Replace any non-valid JavaScript identifier characters with spaces
  let cleanedStr = str.replace(/[^a-zA-Z0-9$_]/g, " ");

  // Split the string on spaces
  let words = cleanedStr.split(" ").filter(Boolean);

  // Capitalize the first letter of each word except for the first one
  for (let i = 1; i < words.length; i++) {
    words[i] = words[i].charAt(0).toUpperCase() + words[i].substring(1);
  }

  // Join the words back together
  let result = words.join("");

  // If the first character is a number, prepend an underscore
  if (!isNaN(parseInt(result.charAt(0)))) {
    result = "_" + result;
  }

  camelCasedMap.set(str, result);

  return result;
}

const parentClass = {
  object: {
    instance: globalThis.ISDKInstanceBase,
    plugin: globalThis.ISDKPluginBase,
  },
  world: {
    instance: globalThis.ISDKWorldInstanceBase,
    plugin: globalThis.ISDKPluginBase,
  },
  dom: {
    instance: globalThis.ISDKDOMInstanceBase,
    plugin: globalThis.ISDKDOMPluginBase,
  },
};

C3.Plugins[PLUGIN_INFO.id] = class extends (
  parentClass[PLUGIN_INFO.type].plugin
) {
  Release() {
    super.Release();
  }
};
const P_C = C3.Plugins[PLUGIN_INFO.id];
P_C.Type = class extends globalThis.ISDKObjectTypeBase {
  constructor(objectClass) {
    super(objectClass);
  }

  Release() {
    super.Release();
  }

  OnCreate() { }
};

const addonTriggers = [];

//============ ACES ============
P_C.Acts = {};
P_C.Cnds = {};
P_C.Exps = {};
Object.keys(PLUGIN_INFO.Acts).forEach((key) => {
  const ace = PLUGIN_INFO.Acts[key];
  P_C.Acts[camelCasify(key)] = function (...args) {
    return ace.forward
      ? ace.forward(this).call(this, ...args)
      : ace.handler.call(this, ...args);
  };
});
Object.keys(PLUGIN_INFO.Cnds).forEach((key) => {
  const ace = PLUGIN_INFO.Cnds[key];
  P_C.Cnds[camelCasify(key)] = function (...args) {
    return ace.forward
      ? ace.forward(this).call(this, ...args)
      : ace.handler.call(this, ...args);
  };
  if (ace.isTrigger) {
    addonTriggers.push({
      method: P_C.Cnds[camelCasify(key)],
      id: key,
    });
  }
});
Object.keys(PLUGIN_INFO.Exps).forEach((key) => {
  const ace = PLUGIN_INFO.Exps[key];
  P_C.Exps[camelCasify(key)] = function (...args) {
    return ace.forward
      ? ace.forward(this).call(this, ...args)
      : ace.handler.call(this, ...args);
  };
});
//============ ACES ============

//<-- INSTANCE -->

P_C.Instance = class extends parentClass[PLUGIN_INFO.type].instance {
  constructor() {
    if(PLUGIN_INFO.hasDomSide && PLUGIN_INFO.hasWrapperExtension) {
      super({ 
        domComponentId: PLUGIN_INFO.id,
        wrapperComponentId: PLUGIN_INFO.id
      });
      this._isWrapperExtensionAvailable = this.IsWrapperExtension
    }
    else if (PLUGIN_INFO.hasDomSide) {
      super({ domComponentId: PLUGIN_INFO.id});
    } 
    else if (PLUGIN_INFO.hasWrapperExtension) {
      super({ wrapperComponentId: PLUGIN_INFO.id});
      this._isWrapperExtensionAvailable = this.IsWrapperExtensionAvailable();
    }
    else {
      super();
    }
  }

  _release() {
    super._release();
  }

  _trigger(method) {
    super._trigger(method);
    // automactically dispatch events for addon triggers, how do you pass custom data?
    // const addonTrigger = addonTriggers.find((x) => x.method === method);
    // if (addonTrigger) {
    //   this._dispatchScriptEvent(addonTrigger.id);
    // }
  }

  _dispatchScriptEvent(eventName, data = null) {
    const event = new C3.Event(eventName, false);
    if (data) {
      Object.assign(event, data);
    }
    this.dispatchEvent(event);
  }
};

P_C.Instance = getInstanceJs(P_C.Instance, addonTriggers, C3);
