const C3 = globalThis.C3;

//<-- BEHAVIOR_INFO -->

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

C3.Behaviors[BEHAVIOR_INFO.id] = class extends globalThis.ISDKBehaviorBase {
  constructor(opts) {
    super(opts);
  }

  Release() {
    super.Release();
  }
};
const B_C = C3.Behaviors[BEHAVIOR_INFO.id];
B_C.Type = class extends globalThis.ISDKBehaviorTypeBase {
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
B_C.Acts = {};
B_C.Cnds = {};
B_C.Exps = {};
Object.keys(BEHAVIOR_INFO.Acts).forEach((key) => {
  const ace = BEHAVIOR_INFO.Acts[key];
  B_C.Acts[camelCasify(key)] = function (...args) {
    return ace.forward
      ? ace.forward(this).call(this, ...args)
      : ace.handler.call(this, ...args);
  };
});
Object.keys(BEHAVIOR_INFO.Cnds).forEach((key) => {
  const ace = BEHAVIOR_INFO.Cnds[key];
  B_C.Cnds[camelCasify(key)] = function (...args) {
    return ace.forward
      ? ace.forward(this).call(this, ...args)
      : ace.handler.call(this, ...args);
  };
  if (ace.isTrigger) {
    addonTriggers.push({
      method: B_C.Cnds[camelCasify(key)],
      id: key,
    });
  }
});
Object.keys(BEHAVIOR_INFO.Exps).forEach((key) => {
  const ace = BEHAVIOR_INFO.Exps[key];
  B_C.Exps[camelCasify(key)] = function (...args) {
    return ace.forward
      ? ace.forward(this).call(this, ...args)
      : ace.handler.call(this, ...args);
  };
});
//============ ACES ============

//<-- INSTANCE -->

B_C.Instance = getInstanceJs(
  globalThis.ISDKBehaviorInstanceBase,
  addonTriggers,
  C3
);
