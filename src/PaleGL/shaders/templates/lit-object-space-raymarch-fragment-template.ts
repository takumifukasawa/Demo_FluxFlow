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
vec2 o(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 o(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 v,float u){return v-u*round(v/u);}vec3 opLiRe(vec3 v,float u,vec3 f){return v-u*clamp(round(v/u),-f,f);}
#define OP_ID(p,r)round(p/r)
#define OP_RE(p,r)p-r*round(p/r)
#define OP_LI_RE(p,r,l)p-r*clamp(round(p/r),-l,l)
#define EPS.0001
#define OI 80
#define SI 80
vec2 opRo(vec2 u,float v){return u*o(-v);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 u(vec3 u,vec3 v){return u/v;}float v(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 u(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float v,float u,float y){float f=clamp(.5+.5*(u-v)/y,0.,1.);return mix(u,v,f)-y*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float d){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-d;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float dfOc(vec3 v,float u){v=abs(v);return(v.x+v.y+v.z-u)*.577;}float o(vec3 v,float u,float d){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-d);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 f,vec3 d,float m,vec2 l){f=opTr(f,vec3(l.xy,0));f.xy=opRo(f.xy,m);f.yz=opRo(f.yz,PI*.5);f=u(f,d);float x=o(f,1.,.1);return v(x,d);}vec2 opBu(vec3 v,float u){v/=1.4;vec3 f=v;f.yz=opRo(f.yz,-PI*.5);vec2 d=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*d.x+u)*cos(uTimelineTime*d.y+u))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),y=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,y),0);}vec2 opFl(vec3 f,float d){vec2 m=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+d)*.5;float y=-.1;y=cos(uTimelineTime*1.6+.1+d)*-.5;float x=f.y*sin(f.y*r),z=f.y*sin(f.y*y),s=sin(1.12*r)*.28,P=sin(1.12*y)*.28;mat2 n=o(-1.12*r),e=o(1.12*y);vec3 l=f;l=opTr(l,vec3(x,.28,z));float p=o(l,.015,.28);m=o(m,vec2(p,1));vec3 i=f;i=opTr(i,vec3(s,.56,P));i.yz=opRo(i.yz,PI*.5);i.xz*=n;i.yz*=e;i.xy=u(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 S=vec3(.08,.2,.2);i=u(i,S);float U=o(i,.4,.01);U=v(U,S);m=o(m,vec2(U,2));vec3 D=f;D=opTr(D,vec3(s,.59,P));float G=dfSp(D,.04);return o(m,vec2(G,3));}float opDb(float v,float u,float f,float m,float s,float d){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,s,smoothstep(.5,.75,v)),mix(s,d,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float d){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,d,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;uniform vec3 uORo;float v(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.02+cos(v.y*3.+uTimelineTime*3.2)*.02+sin(v.z*3.5+uTimelineTime*3.)*.02;}float dfMC(vec3 v){return dfSp(v,FS);}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 u,float f){for(int m=0;m<BN;m++){vec3 d=opTr(u,uBPs[m].xyz);float s=dfSp(d,CS*uGS);f=opSm(f,s,MS);}f+=v(u)*diMAt(u)*uGS;return f;}float dfMBs(vec3 v){float u=dfSp(opTr(v,uCP),FS*uGS);return dfMB(v,u);}vec2 opMo(vec2 v,vec2 u,float f){return mix(v,u,f);}vec2 u(vec3 v,float u,float f){vec3 d=mod(v*f,2.)-1.;f*=3.;vec3 m=abs(1.-3.*abs(d));float s=(min(max(m.x,m.y),min(max(m.y,m.z),max(m.z,m.x)))-1.)/f;return vec2(max(u,s),f);}float dfMe(vec3 v,float d){v/=d;v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x*d;}vec3 opPrf(vec3 v,float u,float d){v=abs(v)-1.18;v=abs(v)-1.2;v.xz*=o(u+.1+uTimelineTime*.8+d);v.xy*=o(u+.8+sin(uTimelineTime)*.4+d);return v;}float dfPr(vec3 v,float u,float d){v/=d;vec3 f=v;f.xy*=o(uTimelineTime*.8+u);float m=dfTo(f,vec2(.8,.05));vec3 i=v;i.yz*=o(uTimelineTime*1.2+u);float s=dfTo(i,vec2(.8,.05)),x=dfOc(v,.6),y=opSm(opSm(m,s,.5),x,.5);return y*d;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 v,mat4 u,vec3 d){return(u*vec4(v,1)).xyz*d;}vec2 o(vec3 u,mat4 f,vec3 d,float m){vec3 o=mix(v(u,f,d),u,m);return dfScene(o);}vec3 u(vec3 v,mat4 u,vec3 f,float d){vec3 m=vec3(0);for(int s=0;s<4;s++){vec3 y=.5773*(2.*vec3(s+3>>1&1,s>>1&1,s&1)-1.);m+=y*o(v+y*1e-4,u,f,d).x;}return normalize(m);}bool n(vec3 v,vec3 u){return abs(v.x)<u.x*.5+1e-4&&abs(v.y)<u.y*.5+1e-4&&abs(v.z)<u.z*.5+1e-4;}float n(float v,float u,float d){return(v+u)/(u-d);}float d(float v,float u,float f){float d=u*v;return-d/(f*(v-1.)-d);}void d(float v,float u){if(v<u)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic,uRoughness;uniform vec4 uEmissiveColor;uniform int uShadingModelId;
#pragma APPEND_UNIFORMS
uniform float uIsPerspective,uUseWorld;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
struct DirectionalLight{vec3 direction;float intensity;vec4 color;};uniform DirectionalLight uDirectionalLight;struct Surface{vec3 worldNormal;vec3 worldPosition;vec4 diffuseColor;};struct Camera{vec3 worldPosition;};in vec2 vUv;in vec3 vNormal,vWorldPosition;in mat4 vInverseWorldMatrix;
#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif
#define SHADING_MODEL_NUM 3.
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 s(vec3 v,int u){float f=float(u)/SHADING_MODEL_NUM;return vec4(v*.5+.5,f);}
#ifdef USE_NORMAL_MAP
vec3 d(vec3 v,vec3 u,vec3 f,sampler2D m,vec2 d){vec3 o=texture(m,d).xyz;o=o*2.-1.;return normalize(mat3(normalize(u),normalize(f),normalize(v))*o);}
#endif
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 f=vec4(0,0,0,1);vec2 m=vUv*uDiffuseMapUvScale;vec4 y=uDiffuseColor*texture(uDiffuseMap,m);vec3 i=vNormal;
#ifdef USE_NORMAL_MAP
i=d(vNormal,vTangent,vBinormal,uNormalMap,m);
#else
i=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
y*=vVertexColor;
#endif
vec3 l=uEmissiveColor.xyz;
#ifdef USE_INSTANCING
l=vInstanceEmissiveColor.xyz;
#endif
vec3 x=vWorldPosition,z=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);vec2 r=vec2(0);float e=0.;vec3 p=x;float S=EPS;for(int U=0;U<OI;U++){p=x+z*e;r=o(p,vInverseWorldMatrix,uBoundsScale,uUseWorld);e+=r.x;if(!n(v(p,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||r.x<=S)break;}if(r.x>S)discard;float U=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,P=d(U,uNearClip,uFarClip);vec4 D=uViewMatrix*vec4(p,1);float G=n(D.z,uNearClip,uFarClip);if(G>=P)discard;vec4 a=uProjectionMatrix*uViewMatrix*vec4(p,1);gl_FragDepth=a.z/a.w*.5+.5;if(r.x>0.)i=u(p,vInverseWorldMatrix,uBoundsScale,uUseWorld);f=y;
#ifdef USE_ALPHA_TEST
d(f.w,uAlphaTestThreshold);
#endif
f.xyz=pow(f.xyz,vec3(2.2));outGBufferA=vec4(f.xyz,1);outGBufferB=s(i,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(l.xyz,1);}`;