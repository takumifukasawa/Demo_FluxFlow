export const litObjectSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#ifdef USE_INSTANCING
in float vInstanceId;
#endif
uniform vec3 uBPs[16],uBSs[16];
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),z=cos(u);return mat2(z,v,-v,z);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 n(vec3 u,vec3 v){return u-v;}vec3 s(vec3 u,vec3 v){return u/v;}float e(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 e(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float z){float f=clamp(.5+.5*(v-u)/z,0.,1.);return mix(v,u,f)-z*f*(1.-f);}float e(vec3 u,float v,float o){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWing(vec3 u,vec3 f,float z,vec2 o){u=n(u,vec3(o.xy,0));u.xy=v(u.xy,z);u.yz=v(u.yz,PI*.5);u=s(u,f);float x=e(u,1.,.1);return e(x,f);}vec2 opButterfly(vec3 u,float o){vec3 f=u;f.yz=v(f.yz,-PI*.5);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTime*10.+o)*cos(uTime*6.+o))*.3);float z=opWing(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),n=opWing(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(z,n),0);}vec2 opFlower(vec3 f){vec2 z=vec2(1e4,-1e4);f.y-=-.8;float o=.1;o=sin(uTime*2.4+.2)*.5;float m=-.1;m=cos(uTime*2.6+.1)*-.5;float x=f.y*sin(f.y*o),y=f.y*sin(f.y*m),l=sin(1.12*o)*.28,P=sin(1.12*m)*.28;mat2 d=u(-1.12*o),r=u(1.12*m);vec3 U=f;U=n(U,vec3(x,.28,y));float t=e(U,.015,.28);z=u(z,vec2(t,1));vec3 i=f;i=n(i,vec3(l,.56,P));i.yz=v(i.yz,PI*.5);i.xz*=d;i.yz*=r;i.xy=e(i.xy);i=n(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 D=vec3(.08,.2,.2);i=s(i,D);float G=e(i,.4,.01);G=e(G,D);z=u(z,vec2(G,2));vec3 p=f;p=n(p,vec3(l,.59,P));float w=length(p)-.04;return u(z,vec2(w,3));}
#pragma RAYMARCH_SCENE
vec3 n(vec3 u,mat4 v,vec3 o){return(v*vec4(u,1)).xyz*o;}vec2 s(vec3 u,mat4 v,vec3 f){return dfScene(n(u,v,f));}vec3 u(vec3 u,mat4 v,vec3 f){vec3 o=vec3(s(u+vec3(1e-4,0,0),v,f).x-s(u+vec3(-1e-4,0,0),v,f).x,s(u+vec3(0,1e-4,0),v,f).x-s(u+vec3(0,-1e-4,0),v,f).x,s(u+vec3(0,0,1e-4),v,f).x-s(u+vec3(0,0,-1e-4),v,f).x);return normalize(o);}bool o(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}float o(float u,float v,float o){return(u+v)/(v-o);}float v(float u,float v,float f){float o=v*u;return-o/(f*(u-1.)-o);}void f(float u,float v){if(u<v)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic,uRoughness;uniform vec4 uEmissiveColor;uniform int uShadingModelId;
#pragma APPEND_UNIFORMS
#ifdef USE_NORMAL_MAP
uniform sampler2D uNormalMap;uniform float uNormalStrength;
#endif
uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
struct DirectionalLight{vec3 direction;float intensity;vec4 color;};uniform DirectionalLight uDirectionalLight;struct Surface{vec3 worldNormal;vec3 worldPosition;vec4 diffuseColor;};struct Camera{vec3 worldPosition;};in vec2 vUv;in vec3 vNormal;
#ifdef USE_NORMAL_MAP
in vec3 vTangent,vBinormal;
#endif
in vec3 vWorldPosition;in mat4 vInverseWorldMatrix;
#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif
#define SHADING_MODEL_NUM 3.
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 t(vec3 u,int v){float f=float(v)/SHADING_MODEL_NUM;return vec4(u*.5+.5,f);}
#ifdef USE_NORMAL_MAP
vec3 e(vec3 u,vec3 v,vec3 f,sampler2D o,vec2 m){vec3 z=texture(o,m).xyz;z=z*2.-1.;return normalize(mat3(normalize(v),normalize(f),normalize(u))*z);}
#endif
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 i=vec4(0,0,0,1);vec2 z=vUv*uDiffuseMapUvScale;vec4 x=uDiffuseColor*texture(uDiffuseMap,z);vec3 U=vNormal;
#ifdef USE_NORMAL_MAP
U=e(vNormal,vTangent,vBinormal,uNormalMap,z);
#else
U=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
x*=vVertexColor;
#endif
x=vec4(1);vec3 d=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);vec2 m=vec2(0);float r=0.;vec3 l=d;for(int G=0;G<100;G++){l=d+y*r;m=s(l,vInverseWorldMatrix,uBoundsScale);r+=m.x;if(!o(n(l,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||m.x<=1e-4)break;}if(m.x>1e-4)discard;float G=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,P=v(G,uNearClip,uFarClip);vec4 D=uViewMatrix*vec4(l,1);float w=o(D.z,uNearClip,uFarClip);if(w>=P)discard;vec4 c=uProjectionMatrix*uViewMatrix*vec4(l,1);gl_FragDepth=c.z/c.w*.5+.5;if(m.x>0.)U=u(l,vInverseWorldMatrix,uBoundsScale);i=x;
#ifdef USE_ALPHA_TEST
f(i.w,uAlphaTestThreshold);
#endif
i.xyz=pow(i.xyz,vec3(2.2));outGBufferA=vec4(i.xyz,1);outGBufferB=t(U,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(uEmissiveColor.xyz.xyz,1);}`;