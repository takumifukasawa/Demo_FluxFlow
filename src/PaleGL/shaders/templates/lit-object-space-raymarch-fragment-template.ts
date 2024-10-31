export const litObjectSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
#define saturate(a)clamp(a,0.,1.)
float rand(vec2 v){return fract(sin(dot(v.xy,vec2(12.98,78.23)))*43.75);}vec3 hash3(vec3 v){return fract(sin(vec3(dot(v,vec3(127.1,311.7,114.5)),dot(v,vec3(269.5,183.3,191.9)),dot(v,vec3(419.2,371.9,514.1))))*43758.5433);}layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};layout(std140) uniform ubTimeline{float uTimelineTime;float uTimelineDeltaTime;};
#ifdef USE_INSTANCING
in float vInstanceId;in vec4 vInstanceColor,vInstanceEmissiveColor,vInstanceState;
#endif
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
#define OP_ID(p,r)round(p/r)
#define OP_RE(p,r)p-r*round(p/r)
#define OP_LI_RE(p,r,l)p-r*clamp(round(p/r),-l,l)
#define EPS.0001
#define OI 80
#define SI 80
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 v,float u){return v-u*round(v/u);}vec3 opLiRe(vec3 v,float u,vec3 f){return v-u*clamp(round(v/u),-f,f);}vec2 opRo(vec2 v,float d){return v*u(-d);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float v(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 o(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float v,float u,float z){float f=clamp(.5+.5*(u-v)/z,0.,1.);return mix(u,v,f)-z*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float d){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-d;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float dfOc(vec3 v,float u){v=abs(v);return(v.x+v.y+v.z-u)*.577;}float dfCo(vec3 v,vec2 u){vec2 f=vec2(length(v.xz),-v.y);return length(f-u*max(dot(f,u),0.))*(f.x*u.y-f.y*u.x<0.?-1.:1.);}float o(vec3 v,float u,float d){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-d);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float d,vec2 m){u=opTr(u,vec3(m.xy,0));u.xy=opRo(u.xy,d);u.yz=opRo(u.yz,PI*.5);u=o(u,f);float z=o(u,1.,.1);return v(z,f);}vec2 opBu(vec3 v,float u){v/=1.4;vec3 f=v;f.yz=opRo(f.yz,-PI*.5);vec2 d=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*d.x+u)*cos(uTimelineTime*d.y+u))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,z),0);}vec2 opFl(vec3 f,float d){vec2 m=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+d)*.5;float z=-.1;z=cos(uTimelineTime*1.6+.1+d)*-.5;float x=f.y*sin(f.y*r),y=f.y*sin(f.y*z),s=sin(1.12*r)*.28,S=sin(1.12*z)*.28;mat2 n=u(-1.12*r),e=u(1.12*z);vec3 l=f;l=opTr(l,vec3(x,.28,y));float p=o(l,.015,.28);m=u(m,vec2(p,1));vec3 i=f;i=opTr(i,vec3(s,.56,S));i.yz=opRo(i.yz,PI*.5);i.xz*=n;i.yz*=e;i.xy=o(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 P=vec3(.08,.2,.2);i=o(i,P);float U=o(i,.4,.01);U=v(U,P);m=u(m,vec2(U,2));vec3 D=f;D=opTr(D,vec3(s,.59,S));float G=dfSp(D,.04);return u(m,vec2(G,3));}float opDb(float v,float u,float f,float m,float d,float z){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,d,smoothstep(.5,.75,v)),mix(d,z,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float d){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,d,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.4
#define CS.25
#define MS.35
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;uniform vec3 uORo;uniform float uMR;float v(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.025+.025+(cos(v.y*3.+uTimelineTime*3.2)*.025+.025)+(sin(v.z*3.5+uTimelineTime*3.)*.025+.025)+.01;}float dfMC(vec3 v){return dfSp(v,FS);}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 u,float f){for(int m=0;m<BN;m++){vec3 d=opTr(u,uBPs[m].xyz);float z=dfSp(d,CS*uGS);f=opSm(f,z,MS);}f+=v(u)*diMAt(u)*uGS;return f;}float dfMBs(vec3 v){float u=dfSp(opTr(v,uCP),FS*uGS);return dfMB(v,u);}vec2 opMo(vec2 v,vec2 u,float f){return mix(v,u,f);}vec2 u(vec3 v,float u,float f){vec3 d=mod(v*f,2.)-1.;f*=3.;vec3 m=abs(1.-3.*abs(d));float z=(min(max(m.x,m.y),min(max(m.y,m.z),max(m.z,m.x)))-1.)/f;return vec2(max(u,z),f);}float dfMe(vec3 v,float d){v/=d;v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x*d;}vec3 opPrf(vec3 v,float f,float d){v=abs(v)-1.18;v=abs(v)-1.2;v.xz*=u(f+.1+uTimelineTime*.8+d);v.xy*=u(f+.8+sin(uTimelineTime)*.4+d);return v;}float dfPr(vec3 v,float f,float d){v/=d;vec3 m=v;m.xy*=u(uTimelineTime*.8+f);float z=dfTo(m,vec2(.8,.05));vec3 i=v;i.yz*=u(uTimelineTime*1.2+f);float o=dfTo(i,vec2(.8,.05)),x=dfOc(v,.6),s=opSm(opSm(z,o,.5),x,.5);return s*d;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 v,mat4 u,vec3 d){return(u*vec4(v,1)).xyz*d;}vec2 o(vec3 u,mat4 f,vec3 d,float m){vec3 z=mix(v(u,f,d),u,m);return dfScene(z);}vec3 u(vec3 v,mat4 u,vec3 f,float d){vec3 m=vec3(0);for(int i=0;i<4;i++){vec3 z=.5773*(2.*vec3(i+3>>1&1,i>>1&1,i&1)-1.);m+=z*o(v+z*1e-4,u,f,d).x;}return normalize(m);}bool n(vec3 v,vec3 u){return abs(v.x)<u.x*.5+1e-4&&abs(v.y)<u.y*.5+1e-4&&abs(v.z)<u.z*.5+1e-4;}float n(float v,float u,float d){return(v+u)/(u-d);}float d(float v,float u,float f){float d=u*v;return-d/(f*(v-1.)-d);}void d(float v,float u){if(v<u)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic;uniform sampler2D uMetallicMap;uniform vec4 uMetallicMapTiling;uniform float uRoughness;uniform sampler2D uRoughnessMap;uniform vec4 uRoughnessMapTiling,uEmissiveColor;uniform int uShadingModelId;
#pragma APPEND_UNIFORMS
uniform float uIsPerspective,uUseWorld;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
struct DirectionalLight{vec3 direction;float intensity;vec4 color;};uniform DirectionalLight uDirectionalLight;struct Surface{vec3 worldNormal;vec3 worldPosition;vec4 diffuseColor;};struct Camera{vec3 worldPosition;};in vec2 vUv;in vec3 vNormal,vLocalPosition;in mat4 vWorldMatrix;in vec3 vWorldPosition;in mat4 vInverseWorldMatrix;
#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif
#define SHADING_MODEL_NUM 3.
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 x(vec3 v,int u){float f=float(u)/SHADING_MODEL_NUM;return vec4(v*.5+.5,f);}
#ifdef USE_NORMAL_MAP
vec3 d(vec3 v,vec3 u,vec3 f,sampler2D d,vec2 m){vec3 z=texture(d,m).xyz;z=z*2.-1.;return normalize(mat3(normalize(u),normalize(f),normalize(v))*z);}
#endif
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 f=vec4(0,0,0,1);vec2 z=vUv*uDiffuseMapUvScale;vec4 m=uDiffuseColor*texture(uDiffuseMap,z);vec3 i=vNormal;
#ifdef USE_NORMAL_MAP
i=d(vNormal,vTangent,vBinormal,uNormalMap,z);
#else
i=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
m*=vVertexColor;
#endif
vec3 r=uEmissiveColor.xyz;
#ifdef USE_INSTANCING
r=vInstanceEmissiveColor.xyz;
#endif
vec3 s=vWorldPosition,P=s,y=uIsPerspective>.5?normalize(s-uViewPosition):normalize(-uViewPosition);vec2 l=vec2(0);float U=0.;vec3 p=P;float S=EPS;mat4 D=vInverseWorldMatrix;for(int G=0;G<OI;G++){p=P+y*U;l=o(p,D,uBoundsScale,uUseWorld);U+=l.x;if(!n(v(p,D,uBoundsScale),uBoundsScale))break;if(l.x<=S)break;}if(l.x>S)discard;float G=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,a=d(G,uNearClip,uFarClip);vec4 O=uViewMatrix*vec4(p,1);float e=n(O.z,uNearClip,uFarClip);if(e>=a)discard;vec4 c=uProjectionMatrix*uViewMatrix*vec4(p,1);gl_FragDepth=c.z/c.w*.5+.5;if(l.x>0.)i=u(p,D,uBoundsScale,uUseWorld);f=m;
#ifdef USE_INSTANCING
float t=1.-sin(vInstanceId*1e2)*.3;f.xyz*=t;r.xyz*=t;
#endif

#ifdef USE_ALPHA_TEST
d(f.w,uAlphaTestThreshold);
#endif
f.xyz=pow(f.xyz,vec3(2.2));float I=uMetallic;I*=texture(uMetallicMap,z*uMetallicMapTiling.xy).x;float C=uRoughness;C*=texture(uRoughnessMap,z*uRoughnessMapTiling.xy).x;outGBufferA=vec4(f.xyz,1);outGBufferB=x(i,uShadingModelId);outGBufferC=vec4(I,C,0,1);outGBufferD=vec4(r.xyz,1);}`;