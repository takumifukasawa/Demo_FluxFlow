export const litObjectSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};layout(std140) uniform ubTimeline{float uTimelineTime;float uTimelineDeltaTime;};
#ifdef USE_INSTANCING
in float vInstanceId;in vec4 vInstanceState,vInstanceColor,vInstanceEmissiveColor;
#endif
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float n(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float v,float u,float x){float f=clamp(.5+.5*(u-v)/x,0.,1.);return mix(u,v,f)-x*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float x){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-x;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float n(vec3 v,float u,float o){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float x,vec2 m){u=opTr(u,vec3(m.xy,0));u.xy=v(u.xy,x);u.yz=v(u.yz,PI*.5);u=o(u,f);float z=n(u,1.,.1);return n(z,f);}vec2 opBu(vec3 u,float o){u/=1.4;vec3 f=u;f.yz=v(f.yz,-PI*.5);vec2 m=vec2(10,.6);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTimelineTime*m.x+o)*cos(uTimelineTime*m.y+o))*.3);float x=opWi(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(x,z),0);}vec2 opFl(vec3 f,float m){vec2 x=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+m)*.5;float z=-.1;z=cos(uTimelineTime*1.6+.1+m)*-.5;float l=f.y*sin(f.y*r),y=f.y*sin(f.y*z),s=sin(1.12*r)*.28,P=sin(1.12*z)*.28;mat2 d=u(-1.12*r),e=u(1.12*z);vec3 i=f;i=opTr(i,vec3(l,.28,y));float U=n(i,.015,.28);x=u(x,vec2(U,1));vec3 p=f;p=opTr(p,vec3(s,.56,P));p.yz=v(p.yz,PI*.5);p.xz*=d;p.yz*=e;p.xy=n(p.xy);p=opTr(p,vec3(0,.2,sin(p.y*5.)*.105));p.yz=v(p.yz,PI*.5);vec3 C=vec3(.08,.2,.2);p=o(p,C);float D=n(p,.4,.01);D=n(D,C);x=u(x,vec2(D,2));vec3 G=f;G=opTr(G,vec3(s,.59,P));float t=dfSp(G,.04);return u(x,vec2(t,3));}float opDb(float v,float u,float f,float m,float x,float o){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,x,smoothstep(.5,.75,v)),mix(x,o,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float x){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,x,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
uniform vec3 uCP,uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float x=dfSp(opTr(u,uBPs[f].xyz),CS);v=opSm(v,x,.25);}float f=sin(u.x*4.+uTimelineTime*3.4)*.07+cos(u.y*3.+uTimelineTime*3.2)*.07+sin(u.z*3.5+uTimelineTime*3.)*.07;v+=f*(1.-smoothstep(1.,1.8,length(u-uCP)));return v;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}vec2 o(vec3 u,float v,float f){vec3 m=mod(u*f,2.)-1.;f*=3.;vec3 s=abs(1.-3.*abs(m));float x=(min(max(s.x,s.y),min(max(s.y,s.z),max(s.z,s.x)))-1.)/f;return vec2(max(v,x),f);}float dfMe(vec3 v){v/=.5;float u=dfBo(v,vec3(1));vec2 f=vec2(u,1);f=o(v,f.x,f.y);f=o(v,f.x,f.y);f=o(v,f.x,f.y);return f.x;}
#pragma RAYMARCH_SCENE
vec3 u(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}vec2 v(vec3 v,mat4 f,vec3 m){return dfScene(u(v,f,m));}vec3 x(vec3 u,mat4 f,vec3 m){vec3 x=vec3(v(u+vec3(1e-4,0,0),f,m).x-v(u+vec3(-1e-4,0,0),f,m).x,v(u+vec3(0,1e-4,0),f,m).x-v(u+vec3(0,-1e-4,0),f,m).x,v(u+vec3(0,0,1e-4),f,m).x-v(u+vec3(0,0,-1e-4),f,m).x);return normalize(x);}bool x(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}float s(float u,float v,float f){return(u+v)/(v-f);}float p(float u,float v,float f){float x=v*u;return-x/(f*(u-1.)-x);}void p(float u,float v){if(u<v)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic,uRoughness;uniform vec4 uEmissiveColor;uniform int uShadingModelId;
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
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 s(vec3 u,int v){float f=float(v)/SHADING_MODEL_NUM;return vec4(u*.5+.5,f);}
#ifdef USE_NORMAL_MAP
vec3 n(vec3 v,vec3 u,vec3 f,sampler2D x,vec2 m){vec3 o=texture(x,m).xyz;o=o*2.-1.;return normalize(mat3(normalize(u),normalize(f),normalize(v))*o);}
#endif
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 f=vec4(0,0,0,1);vec2 m=vUv*uDiffuseMapUvScale;vec4 o=uDiffuseColor*texture(uDiffuseMap,m);vec3 z=vNormal;
#ifdef USE_NORMAL_MAP
z=n(vNormal,vTangent,vBinormal,uNormalMap,m);
#else
z=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
o*=vVertexColor;
#endif
vec3 U=uEmissiveColor.xyz;
#ifdef USE_INSTANCING
U=vInstanceEmissiveColor.xyz;
#endif
vec3 d=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);vec2 r=vec2(0);float l=0.;vec3 i=d;for(int D=0;D<100;D++){i=d+y*l;r=v(i,vInverseWorldMatrix,uBoundsScale);l+=r.x;if(!x(u(i,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||r.x<=1e-4)break;}if(r.x>1e-4)discard;float D=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,P=p(D,uNearClip,uFarClip);vec4 G=uViewMatrix*vec4(i,1);float C=s(G.z,uNearClip,uFarClip);if(C>=P)discard;vec4 a=uProjectionMatrix*uViewMatrix*vec4(i,1);gl_FragDepth=a.z/a.w*.5+.5;if(r.x>0.)z=x(i,vInverseWorldMatrix,uBoundsScale);f=o;
#ifdef USE_ALPHA_TEST
p(f.w,uAlphaTestThreshold);
#endif
f.xyz=pow(f.xyz,vec3(2.2));outGBufferA=vec4(f.xyz,1);outGBufferB=s(z,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(U.xyz,1);}`;