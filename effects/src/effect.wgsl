/////////////////////////////////////////////////////////
// Minimal sample WebGPU shader. This just outputs a blue
// color to indicate WebGPU is in use (rather than one of
// the WebGL shader variants).

%%FRAGMENTINPUT_STRUCT%%
/* input struct contains the following fields:
fn c3_getBackUV(fragPos : vec2<f32>, texBack : texture_2d<f32>) -> vec2<f32>
fn c3_getDepthUV(fragPos : vec2<f32>, texDepth : texture_depth_2d) -> vec2<f32>
*/
%%FRAGMENTOUTPUT_STRUCT%%

%%SAMPLERFRONT_BINDING%% var samplerFront : sampler;
%%TEXTUREFRONT_BINDING%% var textureFront : texture_2d<f32>;

//%//%SAMPLERBACK_BINDING%//% var samplerBack : sampler;
//%//%TEXTUREBACK_BINDING%//% var textureBack : texture_2d<f32>;

//%//%SAMPLERDEPTH_BINDING%//% var samplerDepth : sampler;
//%//%TEXTUREDEPTH_BINDING%//% var textureDepth : texture_depth_2d;

struct ShaderParams {

	alphaDither : f32;
	scale : f32;

};

%%SHADERPARAMS_BINDING%% var<uniform> shaderParams : ShaderParams;


%%C3PARAMS_STRUCT%%
/* c3Params struct contains the following fields:
srcStart: vec2<f32>,
srcEnd: vec2<f32>,
srcOriginStart: vec2<f32>,
srcOriginEnd: vec2<f32>,
layoutStart: vec2<f32>,
layoutEnd: vec2<f32>,
destStart: vec2<f32>,
destEnd: vec2<f32>,
devicePixelRatio: f32,
layerScale: f32,
layerAngle: f32,
seconds: f32,
zNear: f32,
zFar: f32,
isSrcTexRotated: u32
*/
// + the following functions

/*
fn c3_srcToNorm(p : vec2<f32>) -> vec2<f32>
fn c3_normToSrc(p : vec2<f32>) -> vec2<f32>
fn c3_srcOriginToNorm(p : vec2<f32>) -> vec2<f32>
fn c3_normToSrcOrigin(p : vec2<f32>) -> vec2<f32>
fn c3_clampToSrc(p : vec2<f32>) -> vec2<f32>
fn c3_clampToSrcOrigin(p : vec2<f32>) -> vec2<f32>
fn c3_getLayoutPos(p : vec2<f32>) -> vec2<f32>
fn c3_srcToDest(p : vec2<f32>) -> vec2<f32>
fn c3_clampToDest(p : vec2<f32>) -> vec2<f32>
fn c3_linearizeDepth(depthSample : f32) -> f32
*/

//%//%C3_UTILITY_FUNCTIONS%//%
/*
fn c3_premultiply(c : vec4<f32>) -> vec4<f32>
fn c3_unpremultiply(c : vec4<f32>) -> vec4<f32>
fn c3_grayscale(rgb : vec3<f32>) -> f32
fn c3_getPixelSize(t : texture_2d<f32>) -> vec2<f32>
fn c3_RGBtoHSL(color : vec3<f32>) -> vec3<f32>
fn c3_HSLtoRGB(hsl : vec3<f32>) -> vec3<f32>
*/

@fragment
fn main(input : FragmentInput) -> FragmentOutput
{
	var output : FragmentOutput;
	output.color = vec4<f32>(0.0f, 0.0f, 1.0f, 1.0f);
	return output;
}
