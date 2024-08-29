function getInstanceJs(parentClass, addonTriggers, C3) {
  return class extends parentClass {
    constructor(inst, properties) {
      super(inst);

      const properties = this._getInitProperties();
      if (properties) {
      }
    }

    _release() {
      super._release();
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

    _trigger(method) {
      super._trigger(method);
      // automactically dispatch events for addon triggers, how do you pass custom data?
      // const addonTrigger = addonTriggers.find((x) => x.method === method);
      // if (addonTrigger) {
      //   this._dispatchScriptEvent(addonTrigger.id);
      // }
    }

    // manually dispatch events to script interface with custom data
    _dispatchScriptEvent(eventName, data = null) {
      const event = new C3.Event(eventName, false);
      if (data) {
        Object.assign(event, data);
      }
      this.dispatchEvent(event);
    }
  };
}
