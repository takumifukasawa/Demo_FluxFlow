export const litObjectSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};
#ifdef USE_INSTANCING
in float vInstanceId;
#endif
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float f){return v*u(-f);}vec3 n(vec3 u,vec3 v){return u-v;}float s(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float f=PI/10.-atan(u.x,u.y),n=PI*2./10.;f=floor(f/n)*n;return v(u,-f);}float n(vec3 u,float v,float f){vec2 n=vec2(length(u.xz)-2.*v+.05,abs(u.y)-f);return min(max(n.x,n.y),0.)+length(max(n,0.))-.05;}
#define GLOBAL_SIZE 1
vec2 s(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float o=.1;o=sin(uTime*2.4+.2)*.5;float r=-.1;r=cos(uTime*2.6+.1)*-.5;float x=f.y*sin(f.y*o),y=f.y*sin(f.y*r),z=sin(1.12*o)*.28,e=sin(1.12*r)*.28;mat2 d=u(-1.12*o),t=u(1.12*r);vec3 l=f;l=n(l,vec3(x,.28,y));float U=n(l,.015,.28);m=u(m,vec2(U,1));vec3 i=f;i=n(i,vec3(z,.56,e));i.yz=v(i.yz,PI*.5);i.xz*=d;i.yz*=t;i.xy=n(i.xy);i=n(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 p=vec3(.08,.2,.2);i/=p;float G=n(i,.4,.01);G=s(G,p);m=u(m,vec2(G,2));vec3 D=f;D=n(D,vec3(z,.59,e));float w=length(D)-.04;return u(m,vec2(w,3));}
#pragma RAYMARCH_SCENE
vec3 s(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}vec2 u(vec3 u,mat4 v,vec3 f){return dfScene(s(u,v,f));}vec3 v(vec3 v,mat4 f,vec3 e){vec3 n=vec3(u(v+vec3(1e-4,0,0),f,e).x-u(v+vec3(-1e-4,0,0),f,e).x,u(v+vec3(0,1e-4,0),f,e).x-u(v+vec3(0,-1e-4,0),f,e).x,u(v+vec3(0,0,1e-4),f,e).x-u(v+vec3(0,0,-1e-4),f,e).x);return normalize(n);}bool e(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}float e(float u,float v,float f){return(u+v)/(v-f);}float f(float u,float v,float f){float e=v*u;return-e/(f*(u-1.)-e);}void f(float u,float v){if(u<v)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic,uRoughness;uniform vec4 uEmissiveColor;uniform int uShadingModelId;
#pragma APPEND_UNIFORMS
#ifdef USE_NORMAL_MAP
uniform sampler2D uNormalMap;uniform float uNormalStrength;
#endif
layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 e(vec3 u,vec3 v,vec3 f,sampler2D m,vec2 e){vec3 n=texture(m,e).xyz;n=n*2.-1.;return normalize(mat3(normalize(v),normalize(f),normalize(u))*n);}
#endif
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 i=vec4(0,0,0,1);vec2 n=vUv*uDiffuseMapUvScale;vec4 x=uDiffuseColor*texture(uDiffuseMap,n);vec3 m=vNormal;
#ifdef USE_NORMAL_MAP
m=e(vNormal,vTangent,vBinormal,uNormalMap,n);
#else
m=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
x*=vVertexColor;
#endif
x=vec4(1);vec3 d=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);vec2 l=vec2(0);float r=0.;vec3 z=d;for(int o=0;o<100;o++){z=d+y*r;l=u(z,vInverseWorldMatrix,uBoundsScale);r+=l.x;if(!e(s(z,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||l.x<=1e-4)break;}if(l.x>1e-4)discard;float U=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,p=f(U,uNearClip,uFarClip);vec4 o=uViewMatrix*vec4(z,1);float G=e(o.z,uNearClip,uFarClip);if(G>=p)discard;vec4 D=uProjectionMatrix*uViewMatrix*vec4(z,1);gl_FragDepth=D.z/D.w*.5+.5;if(l.x>0.)m=v(z,vInverseWorldMatrix,uBoundsScale);i=x;
#ifdef USE_ALPHA_TEST
f(i.w,uAlphaTestThreshold);
#endif
i.xyz=pow(i.xyz,vec3(2.2));outGBufferA=vec4(i.xyz,1);outGBufferB=t(m,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(uEmissiveColor.xyz.xyz,1);}`;