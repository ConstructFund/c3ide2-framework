function getInstanceJs() {
  function getNewLayerData({
    name = "",
    visible = true,
    backgroundColor = [0, 0, 0],
    transparent = true,
    parallaxX = 1,
    parallaxY = 1,
    opacity = 1,
    forceOwnTexture = true,
    useRenderCells = true,
    scaleRate = 1,
    blendMode = 0,
    isInteractive = true,
    zElevation = 0,
    renderAs3D = true,
    useCameraDistanceDrawOrder = false,
    subLayers = [],
  } = {}) {
    return [
      name,
      0,
      Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      visible,
      backgroundColor,
      transparent,
      parallaxX,
      parallaxY,
      opacity,
      forceOwnTexture,
      useRenderCells,
      scaleRate,
      blendMode,
      isInteractive,
      [],
      [],
      zElevation,
      renderAs3D,
      useCameraDistanceDrawOrder,
      subLayers,
    ];
  }

  const layoutMap = new WeakMap();
  function registerLayer(layer) {
    const layout = layer._layout;
    if (!layoutMap.has(layout)) layoutMap.set(layout, new Map());
    let layerMap = layoutMap.get(layout);
    if (!layerMap.has(layer._index)) layerMap.set(layer._index, layer);
  }

  let oldC3Layout = C3.Layout;
  C3.Layout = class extends oldC3Layout {
    constructor(...args) {
      super(...args);
      this._skymen_tempLayers = [];
      if (!layoutMap.has(this)) layoutMap.set(this, new Map());
    }

    _skymen_CreateLayer(options, temporary) {
      const layerData = getNewLayerData(options);
      if (this._allLayersFlat.find((x) => x._name === layerData[0]))
        throw "Layer with this name already exists on the layout";
      const layer = C3.New(C3.Layer, this, null, layerData);
      this._rootLayers.push(layer);
      this._allLayersFlat = [...this.allLayers()];
      for (let i = 0, len = this._allLayersFlat.length; i < len; ++i) {
        const layer = this._allLayersFlat[i];
        layer._SetIndex(i);
        this._layersByName.set(layer.GetName().toLowerCase(), layer);
        this._layersBySid.set(layer.GetSID(), layer);
      }
      layer._Init();
      if (temporary) {
        this._skymen_tempLayers.push(layer);
      }
    }

    _skymen_RemoveLayer(layer) {
      // Remove the layer from _allLayersFlat array
      this._allLayersFlat = this._allLayersFlat.filter((l) => l !== layer);

      // Remove the layer from _layersByName map
      this._layersByName.delete(layer.GetName().toLowerCase());

      // Remove the layer from _layersBySid map
      this._layersBySid.delete(layer.GetSID());

      // If the layer has a parent, remove it from the parent's _subLayers array
      if (layer._parentLayer) {
        layer._parentLayer._subLayers = layer._parentLayer._subLayers.filter(
          (l) => l !== layer
        );
      } else {
        // If the layer has no parent, it should be a root layer
        this._rootLayers = this._rootLayers.filter((l) => l !== layer);
      }

      // Update _layersByName and _layersBySid maps
      for (let i = 0, len = this._allLayersFlat.length; i < len; ++i) {
        const layer = this._allLayersFlat[i];
        layer._SetIndex(i);
      }
    }

    _skymen_MoveLayer(layer, parentLayer, id) {
      // Remove the old layer
      this._skymen_RemoveLayer(layer);

      // Change the parent of the layer
      layer._parentLayer = parentLayer;

      // Add it to its new parent's _subLayers at the specified position
      if (parentLayer) {
        parentLayer._subLayers.splice(id, 0, layer);
      } else {
        // If no parentLayer is specified, then it should be added to the root
        this._rootLayers.splice(id, 0, layer);
      }

      // Rebuild the _allLayersFlat array
      this._allLayersFlat = [...this.allLayers()];

      // Update _layersByName and _layersBySid maps
      for (let i = 0, len = this._allLayersFlat.length; i < len; ++i) {
        const layer = this._allLayersFlat[i];
        layer._SetIndex(i);
        this._layersByName.set(layer.GetName().toLowerCase(), layer);
        this._layersBySid.set(layer.GetSID(), layer);
      }
    }

    _skymen_MoveLayerToLayer(layer, otherLayer, before) {
      // If before is true, we want to move the layer before otherLayer, else after it
      const id = before ? otherLayer._index : otherLayer._index + 1;

      // Move the layer
      this._skymen_MoveLayer(layer, otherLayer._parentLayer, id);
    }

    async _StopRunning() {
      // Destroy all temporary layers
      for (let i = 0, len = this._skymen_tempLayers.length; i < len; ++i) {
        this._skymen_tempLayers[i]._skymen_Destroy();
      }
      await super._StopRunning();
    }
  };

  let oldC3Layer = C3.Layer;
  C3.Layer = class extends oldC3Layer {
    constructor(...args) {
      super(...args);
    }

    _skymen_Destroy() {
      this._layout._skymen_RemoveLayer(this);
    }

    _Init(...args) {
      super._Init(...args);
      registerLayer(this);
    }
  };

  let oldILayer = self.ILayer;
  self.ILayer = class ILayer extends oldILayer {
    constructor(layer) {
      super(layer);
      this._sdkLayer = layer;
    }

    get _realIndex() {
      return this._sdkLayer.GetIndex();
    }
  };

  function hackC3Runtime(runtime) {
    let oldFn = runtime._CreateChildInstancesFromData.bind(runtime);
    runtime._CreateChildInstancesFromData = function (
      parentInstance,
      parentWorldData,
      parentWorldInfo,
      layer,
      x,
      y,
      creatingHierarchy
    ) {
      const parentZIndex = parentWorldInfo.GetSceneGraphZIndexExportData();
      const childrenData = parentWorldInfo.GetSceneGraphChildrenExportData();
      parentInstance.GetWorldInfo().SetSceneGraphZIndex(parentZIndex);
      if (!childrenData) return;
      if (typeof x === "undefined") x = parentWorldData[0];
      if (typeof y === "undefined") y = parentWorldData[1];
      const sceneGraphSiblings = new Set();
      const parentX = parentWorldData[0];
      const parentY = parentWorldData[1];
      for (const childData of childrenData) {
        const childLayoutSID = childData[0];
        const childLayerIndex = childData[1];
        const childUID = childData[2];
        const childFlags = childData[3];
        const childIsInContainer = !!childData[4];
        const childZIndex = childData[5];
        const uniqueInstanceData = childData[6];
        let childInstData;
        if (uniqueInstanceData) childInstData = uniqueInstanceData;
        else {
          const layout = this._layoutManager.GetLayoutBySID(childLayoutSID);
          const l = layoutMap.get(layout).get(childLayerIndex);
          childInstData = l.GetInitialInstanceData(childUID);
        }
        const childObjectClass = this.GetObjectClassByIndex(childInstData[1]);
        const hasSibling = parentInstance.HasSibling(childObjectClass);
        const siblingProcessed = sceneGraphSiblings.has(childObjectClass);
        if (hasSibling && !siblingProcessed && childIsInContainer) {
          const childInst = parentInstance.GetSibling(childObjectClass);
          const childX = x + childInstData[0][0] - parentX;
          const childY = y + childInstData[0][1] - parentY;
          childInst.GetWorldInfo().SetXY(childX, childY);
          childInst.GetWorldInfo().SetSceneGraphZIndex(childZIndex);
          parentInstance.AddChild(childInst, {
            transformX: !!((childFlags >> 0) & 1),
            transformY: !!((childFlags >> 1) & 1),
            transformWidth: !!((childFlags >> 2) & 1),
            transformHeight: !!((childFlags >> 3) & 1),
            transformAngle: !!((childFlags >> 4) & 1),
            destroyWithParent: !!((childFlags >> 5) & 1),
            transformZElevation: !!((childFlags >> 6) & 1),
            transformOpacity: !!((childFlags >> 7) & 1),
            transformVisibility: !!((childFlags >> 8) & 1),
          });
          sceneGraphSiblings.add(childObjectClass);
        } else {
          const childX = x + childInstData[0][0] - parentX;
          const childY = y + childInstData[0][1] - parentY;
          const childInst = this.CreateInstanceFromData(
            childInstData,
            layer,
            false,
            childX,
            childY,
            false,
            true,
            parentInstance,
            creatingHierarchy
          );
          childInst.GetWorldInfo().SetSceneGraphZIndex(childZIndex);
          parentInstance.AddChild(childInst, {
            transformX: !!((childFlags >> 0) & 1),
            transformY: !!((childFlags >> 1) & 1),
            transformWidth: !!((childFlags >> 2) & 1),
            transformHeight: !!((childFlags >> 3) & 1),
            transformAngle: !!((childFlags >> 4) & 1),
            destroyWithParent: !!((childFlags >> 5) & 1),
            transformZElevation: !!((childFlags >> 6) & 1),
            transformOpacity: !!((childFlags >> 7) & 1),
            transformVisibility: !!((childFlags >> 8) & 1),
          });
        }
      }
    };
  }

  return class extends C3.SDKInstanceBase {
    constructor(inst, properties) {
      super(inst);

      if (properties) {
      }
      hackC3Runtime(this._runtime);
    }

    Release() {
      super.Release();
    }

    SaveToJson() {
      return {
        // data to be saved for savegames
      };
    }

    LoadFromJson(o) {
      // load state for savegames
    }

    GetScriptInterfaceClass() {
      return scriptInterface;
    }

    // ===== UTILS =====
    GetLayerFromLayout(layoutName, name) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return null;
      }
      return layout.GetLayer(name);
    }

    GetLayer(name) {
      const layout = this.GetRunningLayout();
      if (!layout) {
        return null;
      }
      return layout.GetLayer(name);
    }

    GetLayout(name) {
      if (name === "") return this.GetRunningLayout();
      return this._runtime._layoutManager._layoutsByName.get(
        name.toLowerCase()
      );
    }

    GetRunningLayout() {
      return this._runtime.GetMainRunningLayout();
    }

    CreateLayerOnLayout(
      layout,
      name,
      useRenderCells,
      renderAs3D,
      useCameraDistanceDrawOrder,
      temporary
    ) {
      layout._skymen_CreateLayer(
        {
          name,
          useRenderCells,
          renderAs3D,
          useCameraDistanceDrawOrder,
        },
        temporary
      );
    }

    // ===== ACES =====

    _CreateLayer(
      name,
      useRenderCells,
      renderAs3D,
      useCameraDistanceDrawOrder,
      temporary
    ) {
      const layout = this.GetRunningLayout();
      if (!layout) {
        return;
      }
      this.CreateLayerOnLayout(
        layout,
        name,
        useRenderCells,
        renderAs3D,
        useCameraDistanceDrawOrder,
        temporary
      );
    }
    _CreateLayerOnLayout(
      layoutName,
      name,
      useRenderCells,
      renderAs3D,
      useCameraDistanceDrawOrder
    ) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      this.CreateLayerOnLayout(
        layout,
        name,
        useRenderCells,
        renderAs3D,
        useCameraDistanceDrawOrder,
        false
      );
    }
    _DestroyLayer(name) {
      const layer = this.GetLayer(name);
      if (!layer) {
        return;
      }
      layer._skymen_Destroy();
    }
    _DestroyLayerOnLayout(layoutName, name) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      const layer = layout.GetLayer(name);
      if (!layer) {
        return;
      }
      layer._skymen_Destroy();
    }
    _MoveLayerToLayer(name, target, before) {
      const layer = this.GetLayer(name);
      if (!layer) {
        return;
      }
      const targetLayer = this.GetLayer(target);
      if (!targetLayer) {
        return;
      }
      const layout = this.GetRunningLayout();
      if (!layout) {
        return;
      }
      layout._skymen_MoveLayerToLayer(layer, targetLayer, before);
    }
    _SetLayerAsChildOfLayer(name, target, index) {
      const layer = this.GetLayer(name);
      if (!layer) {
        return;
      }
      const targetLayer = this.GetLayer(target);
      if (!targetLayer) {
        return;
      }
      const layout = this.GetRunningLayout();
      if (!layout) {
        return;
      }
      layout._skymen_MoveLayer(layer, targetLayer, index);
    }
    _SetLayerAsRoot(name, index) {
      const layer = this.GetLayer(name);
      if (!layer) {
        return;
      }
      const layout = this.GetRunningLayout();
      if (!layout) {
        return;
      }
      layout._skymen_MoveLayer(layer, null, index);
    }
    _SetLayerAsRootOnLayout(layoutName, name, index) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      const layer = layout.GetLayer(name);
      if (!layer) {
        return;
      }
      layout._skymen_MoveLayer(layer, null, index);
    }
    _SetLayerAsChildOfLayerOnLayout(layoutName, name, target, index) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      const layer = layout.GetLayer(name);
      if (!layer) {
        return;
      }
      const targetLayer = layout.GetLayer(target);
      if (!targetLayer) {
        return;
      }
      layout._skymen_MoveLayer(layer, targetLayer, index);
    }
    _IsLayerChildOfLayer(child, parent) {
      const layer = this.GetLayer(child);
      if (!layer) {
        return false;
      }
      const parentLayer = this.GetLayer(parent);
      if (!parentLayer) {
        return false;
      }
      return child._parentLayer === parentLayer;
    }

    _IsLayerSublayerOfLayer(child, parent, which) {
      //any sublayer
      if (which === 0) {
        return [...child.parentLayers()].includes(parent);
      }
      //only direct sublayers
      else if (which === 1) {
        return child.GetParentLayer() === parent;
      }
    }

    _IsLayerSublayerOfLayerOnLayout(childName, parentName, which, layoutName) {
      const child = this.GetLayerFromLayout(layoutName, childName);
      const parent = this.GetLayerFromLayout(layoutName, parentName);
      if (!child || !parent) return false;

      //any sublayer
      if (which === 0) {
        return [...child.parentLayers()].includes(parent);
      }
      //only direct sublayers
      else if (which === 1) {
        return child.GetParentLayer() === parent;
      }
    }

    _ObjectIsOnLayer_Parent(objectClass, layer, which, excludeSelf) {
      if (!layer) return false;

      const mySol = objectClass.GetCurrentSol();
      const myInstances = mySol.GetInstances();
      if (myInstances.length === 0) return false;
      const pickedInstances = new Set();

      for (let i = 0, len = myInstances.length; i < len; ++i) {
        const myInst = myInstances[i];
        const instLayer = myInst.GetWorldInfo().GetLayer();
        if (instLayer === layer) {
          if (excludeSelf === 0) {
            pickedInstances.add(myInst);
          }
        }
        //any parent layer
        else if (which === 0) {
          //console.log("Parent Layers", [...instLayer.parentLayers()])
          if ([...layer.parentLayers()].includes(instLayer)) {
            pickedInstances.add(myInst);
          }
        }
        //only direct parent layer
        else if (which === 1) {
          if (layer.GetParentLayer() === instLayer) {
            pickedInstances.add(myInst);
          }
        }
      }
      if (pickedInstances.size === 0) return false;
      mySol.SetSetPicked(pickedInstances);
      objectClass.ApplySolToContainer();
      return true;
    }

    _ObjectIsOnLayer_Sublayer(objectClass, layer, which, excludeSelf) {
      if (!layer) return false;

      const mySol = objectClass.GetCurrentSol();
      const myInstances = mySol.GetInstances();
      if (myInstances.length === 0) return false;
      const pickedInstances = new Set();

      for (let i = 0, len = myInstances.length; i < len; ++i) {
        const myInst = myInstances[i];
        const instLayer = myInst.GetWorldInfo().GetLayer();
        if (instLayer === layer) {
          if (excludeSelf === 0) {
            pickedInstances.add(myInst);
          }
        }
        //any sublayer
        else if (which === 0) {
          //cant be self because that was already checked : nice
          if ([...instLayer.parentLayers()].includes(layer)) {
            pickedInstances.add(myInst);
          }
        }
        //only direct sublayers
        else if (which === 1) {
          if (instLayer.GetParentLayer() === layer) {
            pickedInstances.add(myInst);
          }
        }
      }
      if (pickedInstances.size === 0) return false;
      mySol.SetSetPicked(pickedInstances);
      objectClass.ApplySolToContainer();
      return true;
    }

    _IsLayerRoot(layerName) {
      const layer = this.GetLayer(layerName);
      if (!layer) {
        return false;
      }
      return !layer._parentLayer;
    }
    _LayerExists(layer) {
      return !!this.GetLayer(layer);
    }
    _LayerHasChildren(layerName) {
      const layer = this.GetLayer(layerName);
      if (!layer) {
        return false;
      }
      return layer._subLayers.length > 0;
    }
    _IsLayerChildOfLayerOnLayout(layoutName, child, parent) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      const layer = layout.GetLayer(child);
      if (!layer) {
        return false;
      }
      const parentLayer = layout.GetLayer(parent);
      if (!parentLayer) {
        return false;
      }
      return layer._parentLayer === parentLayer;
    }
    _IsLayerRootOnLayout(layoutName, layerName) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      const layer = layout.GetLayer(layerName);
      if (!layer) {
        return false;
      }
      return !layer._parentLayer;
    }
    _LayerExistsOnLayout(layoutName, layer) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      return !!layout.GetLayer(layer);
    }
    _LayerHasChildrenOnLayout(layoutName, layerName) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return;
      }
      const layer = layout.GetLayer(layerName);
      if (!layer) {
        return false;
      }
      return layer._subLayers.length > 0;
    }
    _RootLayerCount() {
      layout = this.GetRunningLayout();
      if (!layout) {
        return 0;
      }
      return layout._rootLayers.length;
    }
    _SubLayerCount(layerName) {
      const layer = this.GetLayer(layerName);
      if (!layer) {
        return 0;
      }
      return layer._subLayers.length;
    }
    _SubLayerAt(layerName, index) {
      const layer = this.GetLayer(layerName);
      if (!layer) {
        return "";
      }
      if (index < 0 || index >= layer._subLayers.length) {
        return "";
      }
      return layer._subLayers[index]._name;
    }
    _RootLayerAt(index) {
      const layout = this.GetRunningLayout();
      if (!layout) {
        return "";
      }
      if (index < 0 || index >= layout._rootLayers.length) {
        return "";
      }
      return layout._rootLayers[index]._name;
    }
    _RootLayerCountOnLayout(layoutName) {
      const layout = this.GetLayout(layoutName);
      return layout._rootLayers.length;
    }
    _SubLayerCountOnLayout(layoutName, layerName) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return "";
      }
      const layer = layout.GetLayer(layerName);
      if (!layer) {
        return 0;
      }
      return layer._subLayers.length;
    }
    _SubLayerAtOnLayout(layoutName, layerName, index) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return "";
      }
      const layer = layout.GetLayer(layerName);
      if (!layer) {
        return "";
      }
      if (index < 0 || index >= layer._subLayers.length) {
        return "";
      }
      return layer._subLayers[index]._name;
    }
    _RootLayerAtOnLayout(layoutName, index) {
      const layout = this.GetLayout(layoutName);
      if (!layout) {
        return "";
      }
      if (index < 0 || index >= layout._rootLayers.length) {
        return "";
      }
      return layout._rootLayers[index]._name;
    }
  };
}
