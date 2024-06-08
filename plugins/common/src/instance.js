function getInstanceJs(parentClass, addonTriggers, C3) {
  return class extends parentClass {
    constructor() {
      super();

      const properties = this._getInitProperties();
      if (properties) {
      }
    }

    _saveToJson() {
      return {
        // data to be saved for savegames
      };
    }

    _loadFromJson(o) {
      // load state for savegames
    }
  };
}
