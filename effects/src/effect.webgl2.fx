#version 300 es

// Sample WebGL 2 shader. This just outputs a green color
// to indicate WebGL 2 is in use. Notice that WebGL 2 shaders
// must be written with '#version 300 es' as the very first line
// (no linebreaks or comments before it!) and have updated syntax.

in mediump vec2 vTex;
out lowp vec4 outColor;

#ifdef GL_FRAGMENT_PRECISION_HIGH
#define highmedp highp
#else
#define highmedp mediump
#endif

precision lowp float;

uniform lowp sampler2D samplerFront;
uniform mediump vec2 srcStart;
uniform mediump vec2 srcEnd;
uniform mediump vec2 srcOriginStart;
uniform mediump vec2 srcOriginEnd;
uniform mediump vec2 layoutStart;
uniform mediump vec2 layoutEnd;
uniform lowp sampler2D samplerBack;
uniform lowp sampler2D samplerDepth;
uniform mediump vec2 destStart;
uniform mediump vec2 destEnd;
uniform highmedp float seconds;
uniform mediump vec2 pixelSize;
uniform mediump float layerScale;
uniform mediump float layerAngle;
uniform mediump float devicePixelRatio;
uniform mediump float zNear;
uniform mediump float zFar;

//<-- UNIFORMS -->

void main(void)
{
	outColor = vec4(0.0, 1.0, 0.0, 1.0);
}
