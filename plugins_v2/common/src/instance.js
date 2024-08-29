function getInstanceJs(parentClass, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

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

    _getDebuggerProperties() { 
      return [
        {
          title: "Behavior.Test",
          properties: [
            // {
            //   name: "$enabled",
            //   value: this.enabled
            // }
          ]
        }
      ];
    }
  };
}
