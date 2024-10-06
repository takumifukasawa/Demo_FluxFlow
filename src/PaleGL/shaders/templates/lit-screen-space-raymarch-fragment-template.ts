export const litScreenSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
#define PI 3.14
#define PI2 6.28
vec3 u(vec3 u){return u-4.*round(u/4.);}
#pragma RAYMARCH_SCENE
vec3 v(vec3 u){vec3 v=vec3(dfScene(u+vec3(1e-4,0,0)).x-dfScene(u+vec3(-1e-4,0,0)).x,dfScene(u+vec3(0,1e-4,0)).x-dfScene(u+vec3(0,-1e-4,0)).x,dfScene(u+vec3(0,0,1e-4)).x-dfScene(u+vec3(0,0,-1e-4)).x);return normalize(v);}vec3 u(vec2 u,vec3 v,float o,float G){vec2 n=u*2.-1.;float f=tan(o*3.141592/180.*.5);vec3 d=v,x=normalize(cross(d,vec3(0,1,0)));return normalize(f*G*x*n.x+normalize(cross(x,d))*f*n.y+v);}float u(float u,float v,float o){return(u+v)/(v-o);}float v(float u,float v,float o){float d=v*u;return-d/(o*(u-1.)-d);}void u(float u,float v){if(u<v)discard;}uniform float uMetallic,uRoughness;uniform int uShadingModelId;
#pragma APPEND_UNIFORMS
layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};uniform sampler2D uDepthTexture;uniform float uTargetWidth,uTargetHeight;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
in vec2 vUv;in vec3 vWorldPosition;
#define SHADING_MODEL_NUM 3.
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 v(vec3 u,int v){float o=float(v)/SHADING_MODEL_NUM;return vec4(u*.5+.5,o);}layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 o=vec4(0,0,0,1);vec3 d=vec3(0,0,1),x=uViewPosition,f=u(vUv,uViewDirection,uFov,uAspect);vec2 n=vec2(0);float m=uNearClip;vec3 G=x;for(int r=0;r<100;r++){G=x+f*m;n=dfScene(G);m+=n.x;if(m>uFarClip||n.x<=1e-4)break;}if(n.x>1e-4)discard;float l=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,p=v(l,uNearClip,uFarClip),i=u((uViewMatrix*vec4(G,1)).z,uNearClip,uFarClip);if(i>=p)discard;vec4 r=uProjectionMatrix*uViewMatrix*vec4(G,1);gl_FragDepth=r.z/r.w*.5+.5;if(n.x>0.)d=v(G);
#ifdef USE_ALPHA_TEST
u(o.w,uAlphaTestThreshold);
#endif
o.xyz=pow(o.xyz,vec3(2.2));outGBufferA=vec4(o.xyz,1);outGBufferB=v(d,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(vec4(1).xyz,1);}`;