export const litObjectSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#ifdef USE_INSTANCING
in float vInstanceId;in vec4 vInstanceState;
#endif
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 n(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float s(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float o){float f=clamp(.5+.5*(v-u)/o,0.,1.);return mix(v,u,f)-o*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float n(vec3 u,float v,float o){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWing(vec3 u,vec3 f,float x,vec2 m){u=n(u,vec3(m.xy,0));u.xy=v(u.xy,x);u.yz=v(u.yz,PI*.5);u=o(u,f);float z=n(u,1.,.1);return s(z,f);}vec2 opButterfly(vec3 u,float o){vec3 f=u;f.yz=v(f.yz,-PI*.5);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTime*10.+o)*cos(uTime*6.+o))*.3);float z=opWing(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),x=opWing(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(z,x),0);}vec2 opFlower(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float z=.1;z=sin(uTime*2.4+.2)*.5;float r=-.1;r=cos(uTime*2.6+.1)*-.5;float x=f.y*sin(f.y*z),y=f.y*sin(f.y*r),P=sin(1.12*z)*.28,e=sin(1.12*r)*.28;mat2 d=u(-1.12*z),t=u(1.12*r);vec3 l=f;l=n(l,vec3(x,.28,y));float U=n(l,.015,.28);m=u(m,vec2(U,1));vec3 i=f;i=n(i,vec3(P,.56,e));i.yz=v(i.yz,PI*.5);i.xz*=d;i.yz*=t;i.xy=n(i.xy);i=n(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 C=vec3(.08,.2,.2);i=o(i,C);float D=n(i,.4,.01);D=s(D,C);m=u(m,vec2(D,2));vec3 G=f;G=n(G,vec3(P,.59,e));float p=dfSp(G,.04);return u(m,vec2(p,3));}
#define BN 16
#define CS.25
uniform vec3 uCP,uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float z=dfSp(n(u,uBPs[f].xyz),CS);v=opSm(v,z,.25);}return v;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}
#pragma RAYMARCH_SCENE
vec3 o(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}vec2 s(vec3 u,mat4 v,vec3 f){return dfScene(o(u,v,f));}vec3 u(vec3 u,mat4 v,vec3 f){vec3 o=vec3(s(u+vec3(1e-4,0,0),v,f).x-s(u+vec3(-1e-4,0,0),v,f).x,s(u+vec3(0,1e-4,0),v,f).x-s(u+vec3(0,-1e-4,0),v,f).x,s(u+vec3(0,0,1e-4),v,f).x-s(u+vec3(0,0,-1e-4),v,f).x);return normalize(o);}bool e(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}float e(float u,float v,float f){return(u+v)/(v-f);}float v(float u,float v,float f){float o=v*u;return-o/(f*(u-1.)-o);}void f(float u,float v){if(u<v)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic,uRoughness;uniform vec4 uEmissiveColor;uniform int uShadingModelId;
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
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 i=vec4(0,0,0,1);vec2 z=vUv*uDiffuseMapUvScale;vec4 x=uDiffuseColor*texture(uDiffuseMap,z);vec3 m=vNormal;
#ifdef USE_NORMAL_MAP
m=e(vNormal,vTangent,vBinormal,uNormalMap,z);
#else
m=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
x*=vVertexColor;
#endif
x=vec4(1);vec3 d=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);vec2 r=vec2(0);float l=0.;vec3 U=d;for(int D=0;D<100;D++){U=d+y*l;r=s(U,vInverseWorldMatrix,uBoundsScale);l+=r.x;if(!e(o(U,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||r.x<=1e-4)break;}if(r.x>1e-4)discard;float D=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,n=v(D,uNearClip,uFarClip);vec4 G=uViewMatrix*vec4(U,1);float C=e(G.z,uNearClip,uFarClip);if(C>=n)discard;vec4 P=uProjectionMatrix*uViewMatrix*vec4(U,1);gl_FragDepth=P.z/P.w*.5+.5;if(r.x>0.)m=u(U,vInverseWorldMatrix,uBoundsScale);i=x;
#ifdef USE_ALPHA_TEST
f(i.w,uAlphaTestThreshold);
#endif
i.xyz=pow(i.xyz,vec3(2.2));outGBufferA=vec4(i.xyz,1);outGBufferB=t(m,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(uEmissiveColor.xyz.xyz,1);}`;