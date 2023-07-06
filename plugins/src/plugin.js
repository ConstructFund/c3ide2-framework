const C3 = self.C3;

//<-- PLUGIN_INFO -->

const parentClass = {
  object: {
    scripting: self.IInstance,
    instance: C3.SDKInstanceBase,
    plugin: C3.SDKPluginBase,
  },
  world: {
    scripting: self.IWorldInstance,
    instance: C3.SDKWorldInstanceBase,
    plugin: C3.SDKPluginBase,
  },
  dom: {
    scripting: self.IDOMInstance,
    instance: C3.SDKDOMInstanceBase,
    plugin: C3.SDKDOMPluginBase,
  },
};

C3.Plugins[PLUGIN_INFO.id] = class extends (
  parentClass[PLUGIN_INFO.type].plugin
) {
  constructor(opts) {
    if (PLUGIN_INFO.hasDomSide) {
      super(opts, PLUGIN_INFO.id);
    } else {
      super(opts);
    }
  }

  Release() {
    super.Release();
  }
};
const P_C = C3.Plugins[PLUGIN_INFO.id];
P_C.Type = class extends C3.SDKTypeBase {
  constructor(objectClass) {
    super(objectClass);
  }

  Release() {
    super.Release();
  }

  OnCreate() {}
};

//====== SCRIPT INTERFACE ======
const map = new WeakMap();

//<-- SCRIPT_INTERFACE -->

const scriptInterface = getScriptInterface(
  parentClass[PLUGIN_INFO.type].scripting,
  map
);

// extend script interface with plugin actions
Object.keys(PLUGIN_INFO.Acts).forEach((key) => {
  const ace = PLUGIN_INFO.Acts[key];
  if (!ace.autoScriptInterface) return;
  scriptInterface.prototype[key] = function (...args) {
    const sdkInst = map.get(this);
    P_C.Acts[key].call(sdkInst, ...args);
  };
});

const addonTriggers = [];

// extend script interface with plugin conditions
Object.keys(BEHAVIOR_INFO.Cnds).forEach((key) => {
  const ace = BEHAVIOR_INFO.Cnds[key];
  if (!ace.autoScriptInterface || ace.isStatic || ace.isLooping) return;
  if (ace.isTrigger) {
    scriptInterface.prototype[key] = function (callback, ...args) {
      const callbackWrapper = () => {
        const sdkInst = map.get(this);
        if (B_C.Cnds[key].call(sdkInst, ...args)) {
          callback();
        }
      };
      this.addEventListener(key, callbackWrapper, false);
      return () => this.removeEventListener(key, callbackWrapper, false);
    };
  } else {
    scriptInterface.prototype[key] = function (...args) {
      const sdkInst = map.get(this);
      return B_C.Cnds[key].call(sdkInst, ...args);
    };
  }
});

// extend script interface with plugin expressions
Object.keys(PLUGIN_INFO.Exps).forEach((key) => {
  const ace = PLUGIN_INFO.Exps[key];
  if (!ace.autoScriptInterface) return;
  scriptInterface.prototype[key] = function (...args) {
    const sdkInst = map.get(this);
    return P_C.Exps[key].call(sdkInst, ...args);
  };
});
//====== SCRIPT INTERFACE ======

//============ ACES ============
P_C.Acts = {};
P_C.Cnds = {};
P_C.Exps = {};
Object.keys(PLUGIN_INFO.Acts).forEach((key) => {
  const ace = PLUGIN_INFO.Acts[key];
  P_C.Acts[key] = function (...args) {
    if (ace.forward) ace.forward(this).call(this, ...args);
    else if (ace.handler) ace.handler.call(this, ...args);
  };
});
Object.keys(BEHAVIOR_INFO.Cnds).forEach((key) => {
  const ace = BEHAVIOR_INFO.Cnds[key];
  B_C.Cnds[key] = function (...args) {
    if (ace.forward) return ace.forward(this).call(this, ...args);
    if (ace.handler) return ace.handler.call(this, ...args);
  };
  if (ace.isTrigger && ace.autoScriptInterface) {
    addonTriggers.push({
      method: key,
      id: key,
    });
  }
});
Object.keys(PLUGIN_INFO.Exps).forEach((key) => {
  const ace = PLUGIN_INFO.Exps[key];
  P_C.Exps[key] = function (...args) {
    if (ace.forward) return ace.forward(this).call(this, ...args);
    if (ace.handler) return ace.handler.call(this, ...args);
  };
});
//============ ACES ============

//<-- INSTANCE -->

P_C.Instance = getInstanceJs(
  parentClass[PLUGIN_INFO.type].instance,
  scriptInterface,
  addonTriggers,
  C3
);
