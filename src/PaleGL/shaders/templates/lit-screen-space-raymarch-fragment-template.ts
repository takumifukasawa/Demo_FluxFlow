export const litScreenSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
#define saturate(a)clamp(a,0.,1.)
float rand(vec2 v){return fract(sin(dot(v.xy,vec2(12.98,78.23)))*43.75);}vec3 hash3(vec3 v){return fract(sin(vec3(dot(v,vec3(127.1,311.7,114.5)),dot(v,vec3(269.5,183.3,191.9)),dot(v,vec3(419.2,371.9,514.1))))*43758.5433);}layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};layout(std140) uniform ubTimeline{float uTimelineTime;float uTimelineDeltaTime;};
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
#define OP_ID(p,r)round(p/r)
#define OP_RE(p,r)p-r*round(p/r)
#define OP_LI_RE(p,r,l)p-r*clamp(round(p/r),-l,l)
#define EPS.0001
#define OI 80
#define SI 80
vec2 o(vec2 u,vec2 d){return u.x<d.x?u:d;}mat2 o(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 v,float u){return v-u*round(v/u);}vec3 opLiRe(vec3 v,float u,vec3 f){return v-u*clamp(round(v/u),-f,f);}vec2 opRo(vec2 u,float v){return u*o(-v);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 u(vec3 u,vec3 v){return u/v;}float d(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 d(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float v,float u,float y){float f=clamp(.5+.5*(u-v)/y,0.,1.);return mix(u,v,f)-y*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float d){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-d;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float dfOc(vec3 v,float u){v=abs(v);return(v.x+v.y+v.z-u)*.577;}float dfCo(vec3 v,vec2 u){vec2 f=vec2(length(v.xz),-v.y);return length(f-u*max(dot(f,u),0.))*(f.x*u.y-f.y*u.x<0.?-1.:1.);}float d(vec3 v,float u,float d){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-d);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 v,vec3 f,float o,vec2 m){v=opTr(v,vec3(m.xy,0));v.xy=opRo(v.xy,o);v.yz=opRo(v.yz,PI*.5);v=u(v,f);float z=d(v,1.,.1);return d(z,f);}vec2 opBu(vec3 v,float u){v/=1.4;vec3 f=v;f.yz=opRo(f.yz,-PI*.5);vec2 d=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*d.x+u)*cos(uTimelineTime*d.y+u))*.3);float o=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(o,z),0);}vec2 opFl(vec3 v,float f){vec2 m=vec2(1e4,-1e4);v/=1.;v.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+f)*.5;float z=-.1;z=cos(uTimelineTime*1.6+.1+f)*-.5;float l=v.y*sin(v.y*r),y=v.y*sin(v.y*z),s=sin(1.12*r)*.28,P=sin(1.12*z)*.28;mat2 n=o(-1.12*r),x=o(1.12*z);vec3 p=v;p=opTr(p,vec3(l,.28,y));float G=d(p,.015,.28);m=o(m,vec2(G,1));vec3 i=v;i=opTr(i,vec3(s,.56,P));i.yz=opRo(i.yz,PI*.5);i.xz*=n;i.yz*=x;i.xy=d(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 S=vec3(.08,.2,.2);i=u(i,S);float O=d(i,.4,.01);O=d(O,S);m=o(m,vec2(O,2));vec3 c=v;c=opTr(c,vec3(s,.59,P));float h=dfSp(c,.04);return o(m,vec2(h,3));}float opDb(float v,float u,float f,float m,float o,float d){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,o,smoothstep(.5,.75,v)),mix(o,d,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float o){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,o,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;uniform vec3 uORo;float u(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.02+cos(v.y*3.+uTimelineTime*3.2)*.02+sin(v.z*3.5+uTimelineTime*3.)*.02;}float dfMC(vec3 v){return dfSp(v,FS);}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 v,float f){for(int o=0;o<BN;o++){vec3 m=opTr(v,uBPs[o].xyz);float d=dfSp(m,CS*uGS);f=opSm(f,d,MS);}f+=u(v)*diMAt(v)*uGS;return f;}float dfMBs(vec3 v){float u=dfSp(opTr(v,uCP),FS*uGS);return dfMB(v,u);}vec2 opMo(vec2 v,vec2 u,float f){return mix(v,u,f);}vec2 o(vec3 v,float u,float f){vec3 m=mod(v*f,2.)-1.;f*=3.;vec3 o=abs(1.-3.*abs(m));float d=(min(max(o.x,o.y),min(max(o.y,o.z),max(o.z,o.x)))-1.)/f;return vec2(max(u,d),f);}float dfMe(vec3 v,float u){v/=u;v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=o(v,m.x,m.y);m=o(v,m.x,m.y);m=o(v,m.x,m.y);return m.x*u;}vec3 opPrf(vec3 v,float u,float f){v=abs(v)-1.18;v=abs(v)-1.2;v.xz*=o(u+.1+uTimelineTime*.8+f);v.xy*=o(u+.8+sin(uTimelineTime)*.4+f);return v;}float dfPr(vec3 v,float u,float d){v/=d;vec3 f=v;f.xy*=o(uTimelineTime*.8+u);float m=dfTo(f,vec2(.8,.05));vec3 i=v;i.yz*=o(uTimelineTime*1.2+u);float z=dfTo(i,vec2(.8,.05)),s=dfOc(v,.6),y=opSm(opSm(m,z,.5),s,.5);return y*d;}
#pragma RAYMARCH_SCENE
vec3 n(vec3 v){vec3 f=vec3(0);for(int u=0;u<4;u++){vec3 o=.5773*(2.*vec3(u+3>>1&1,u>>1&1,u&1)-1.);f+=o*dfScene(v+o*1e-4).x;}return normalize(f);}vec3 d(vec2 v,vec3 u,float f,float d){vec2 o=v*2.-1.;float m=tan(f*3.141592/180.*.5);vec3 z=u,s=normalize(cross(z,vec3(0,1,0)));return normalize(m*d*s*o.x+normalize(cross(s,z))*m*o.y+u);}float n(float v,float u,float f){return(v+u)/(u-f);}float u(float v,float u,float f){float d=u*v;return-d/(f*(v-1.)-d);}void n(float v,float u){if(v<u)discard;}uniform float uMetallic,uRoughness;uniform int uShadingModelId;uniform vec4 uEmissiveColor;
#pragma APPEND_UNIFORMS
uniform sampler2D uDepthTexture;uniform float uTargetWidth,uTargetHeight;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
in vec2 vUv;in vec3 vWorldPosition;
#define SHADING_MODEL_NUM 3.
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 v(vec3 v,int u){float f=float(u)/SHADING_MODEL_NUM;return vec4(v*.5+.5,f);}layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 f=vec4(0,0,0,1);vec3 m=vec3(0,0,1),o=uViewPosition,z=d(vUv,uViewDirection,uFov,uAspect);vec2 i=vec2(0);float r=uNearClip;vec3 y=o;float s=EPS;for(int l=0;l<SI;l++){y=o+z*r;i=dfScene(y);r+=i.x;if(r>uFarClip||i.x<=s)break;}if(i.x>s)discard;float l=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,P=u(l,uNearClip,uFarClip),p=n((uViewMatrix*vec4(y,1)).z,uNearClip,uFarClip);if(p>=P)discard;vec4 O=uProjectionMatrix*uViewMatrix*vec4(y,1);gl_FragDepth=O.z/O.w*.5+.5;if(i.x>0.)m=n(y);
#ifdef USE_ALPHA_TEST
n(f.w,uAlphaTestThreshold);
#endif
f.xyz=pow(f.xyz,vec3(2.2));outGBufferA=vec4(f.xyz,1);outGBufferB=v(m,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(uEmissiveColor.xyz.xyz,1);}`;