// WARNING: DO NOT EDIT THIS FILE, IT IS AUTOGENERATED
module.exports = {
  addonType: "effect",
  id: "effect_id",
  name: "My Effect",
  version: "1.0.0.0",
  category:
    // "blend",
    // "distortion",
    // "normal-mapping",
    // "tiling",
    // "other",
    "color",
  author: "skymen",
  website: "https://www.construct.net",
  documentation: "https://www.construct.net",
  description: "Description",
  supportedRenderers: ["webgl", "webgl2", "webgpu"],
  blendsBackground: false,
  usesDepth: false,
  crossSampling: false,
  preservesOpaqueness: true,
  animated: false,
  mustPredraw: false,
  extendBox: {
    horizontal: 0,
    vertical: 0,
  },
  isDeprecated: false,
  parameters: [
    /*
    {
      type:
        "float"
        "percent"
        "color"
      ,
      id: "property_id",
      value: 0,
      uniform: "uPropertyId",
      // precision: "lowp" // defaults to lowp if omitted
      interpolatable: true,
      name: "Property Name",
      desc: "Property Description",
    }
    */
    {
      type: "float",
      id: "property_id",
      value: 0,
      uniform: "uPropertyId",
      // precision: "lowp" // defaults to lowp if omitted
      interpolatable: true,
      name: "Property Name",
      desc: "Property Description",
    },
  ],
};