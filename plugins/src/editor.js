const SDK = self.SDK;

//<-- PLUGIN_INFO -->

let app = null;

SDK.Plugins[PLUGIN_INFO.id] = class extends SDK.IPluginBase {
  constructor() {
    super(PLUGIN_INFO.id);
    SDK.Lang.PushContext("plugins." + PLUGIN_INFO.id.toLowerCase());
    this._info.SetName(self.lang(".name"));
    this._info.SetDescription(self.lang(".description"));
    this._info.SetVersion(PLUGIN_INFO.version);
    this._info.SetCategory(PLUGIN_INFO.category);
    this._info.SetAuthor(PLUGIN_INFO.author);
    this._info.SetPluginType(PLUGIN_INFO.type);
    this._info.SetHelpUrl(self.lang(".help-url"));
    if (PLUGIN_INFO.info && PLUGIN_INFO.info.Set)
      Object.keys(PLUGIN_INFO.info.Set).forEach((key) => {
        const value = PLUGIN_INFO.info.Set[key];
        const fn = this._info[`Set${key}`];
        if (fn && value !== null && value !== undefined)
          fn.call(this._info, value);
      });
    if (PLUGIN_INFO.info && PLUGIN_INFO.info.AddCommonACEs)
      Object.keys(PLUGIN_INFO.info.AddCommonACEs).forEach((key) => {
        if (PLUGIN_INFO.info.AddCommonACEs[key])
          this._info[`AddCommon${key}ACEs`]();
      });
    SDK.Lang.PushContext(".properties");
    this._info.SetProperties(
      (PLUGIN_INFO.properties || []).map(
        (prop) =>
          new SDK.PluginProperty(prop.type, prop.id, prop.value, prop.options)
      )
    );
    SDK.Lang.PopContext(); // .properties
    SDK.Lang.PopContext();
  }
};
const P_C = SDK.Plugins[PLUGIN_INFO.id];
P_C.Register(PLUGIN_INFO.id, P_C);

P_C.Type = class extends SDK.ITypeBase {
  constructor(sdkPlugin, iObjectType) {
    super(sdkPlugin, iObjectType);
  }
};

P_C.Instance = class extends SDK.IInstanceBase {
  constructor(sdkType, inst) {
    super(sdkType, inst);
  }

  Release() {}

  OnCreate() {}

  OnPlacedInLayout() {}

  OnPropertyChanged(id, value) {}

  LoadC2Property(name, valueString) {
    return false; // not handled
  }
};
