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
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 v,float u){return v-u*round(v/u);}vec2 opRo(vec2 v,float o){return v*u(-o);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float v(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 o(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float v,float u,float x){float f=clamp(.5+.5*(u-v)/x,0.,1.);return mix(u,v,f)-x*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float o){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-o;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float o(vec3 v,float u,float o){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float x,vec2 m){u=opTr(u,vec3(m.xy,0));u.xy=opRo(u.xy,x);u.yz=opRo(u.yz,PI*.5);u=o(u,f);float z=o(u,1.,.1);return v(z,f);}vec2 opBu(vec3 v,float u){v/=1.4;vec3 f=v;f.yz=opRo(f.yz,-PI*.5);vec2 o=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*o.x+u)*cos(uTimelineTime*o.y+u))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,z),0);}vec2 opFl(vec3 f,float m){vec2 x=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+m)*.5;float z=-.1;z=cos(uTimelineTime*1.6+.1+m)*-.5;float l=f.y*sin(f.y*r),y=f.y*sin(f.y*z),s=sin(1.12*r)*.28,P=sin(1.12*z)*.28;mat2 d=u(-1.12*r),n=u(1.12*z);vec3 i=f;i=opTr(i,vec3(l,.28,y));float U=o(i,.015,.28);x=u(x,vec2(U,1));vec3 D=f;D=opTr(D,vec3(s,.56,P));D.yz=opRo(D.yz,PI*.5);D.xz*=d;D.yz*=n;D.xy=o(D.xy);D=opTr(D,vec3(0,.2,sin(D.y*5.)*.105));D.yz=opRo(D.yz,PI*.5);vec3 e=vec3(.08,.2,.2);D=o(D,e);float G=o(D,.4,.01);G=v(G,e);x=u(x,vec2(G,2));vec3 p=f;p=opTr(p,vec3(s,.59,P));float t=dfSp(p,.04);return u(x,vec2(t,3));}float opDb(float v,float u,float f,float m,float s,float x){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,s,smoothstep(.5,.75,v)),mix(s,x,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float x){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,x,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
uniform vec3 uCP,uBPs[BN],uGPs[4];float v(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.07+cos(v.y*3.+uTimelineTime*3.2)*.07+sin(v.z*3.5+uTimelineTime*3.)*.07;}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 u,float f){for(int o=0;o<BN;o++){float x=dfSp(opTr(u,uBPs[o].xyz),CS);f=opSm(f,x,.25);}f+=v(u)*diMAt(u);return f;}vec2 opMo(vec2 v,vec2 u,float f){return mix(v,u,f);}vec2 u(vec3 v,float u,float f){vec3 m=mod(v*f,2.)-1.;f*=3.;vec3 o=abs(1.-3.*abs(m));float z=(min(max(o.x,o.y),min(max(o.y,o.z),max(o.z,o.x)))-1.)/f;return vec2(max(u,z),f);}float dfMe(vec3 v){v/=.5;float f=dfBo(v,vec3(1));vec2 o=vec2(f,1);o=u(v,o.x,o.y);o=u(v,o.x,o.y);o=u(v,o.x,o.y);return o.x;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 v,mat4 u,vec3 f){return(u*vec4(v,1)).xyz*f;}vec2 f(vec3 u,mat4 f,vec3 o){return dfScene(v(u,f,o));}vec3 n(vec3 v,mat4 u,vec3 o){vec3 m=vec3(f(v+vec3(1e-4,0,0),u,o).x-f(v+vec3(-1e-4,0,0),u,o).x,f(v+vec3(0,1e-4,0),u,o).x-f(v+vec3(0,-1e-4,0),u,o).x,f(v+vec3(0,0,1e-4),u,o).x-f(v+vec3(0,0,-1e-4),u,o).x);return normalize(m);}bool f(vec3 v,vec3 u){return abs(v.x)<u.x*.5+1e-4&&abs(v.y)<u.y*.5+1e-4&&abs(v.z)<u.z*.5+1e-4;}float x(float v,float u,float o){return(v+u)/(u-o);}float s(float v,float u,float f){float o=u*v;return-o/(f*(v-1.)-o);}void n(float v,float u){if(v<u)discard;}uniform vec4 uDiffuseColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uSpecularAmount,uAmbientAmount,uMetallic,uRoughness;uniform vec4 uEmissiveColor;uniform int uShadingModelId;
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
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 s(vec3 v,int u){float f=float(u)/SHADING_MODEL_NUM;return vec4(v*.5+.5,f);}
#ifdef USE_NORMAL_MAP
vec3 f(vec3 v,vec3 u,vec3 f,sampler2D m,vec2 o){vec3 z=texture(m,o).xyz;z=z*2.-1.;return normalize(mat3(normalize(u),normalize(f),normalize(v))*z);}
#endif
layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 u=vec4(0,0,0,1);vec2 o=vUv*uDiffuseMapUvScale;vec4 d=uDiffuseColor*texture(uDiffuseMap,o);vec3 m=vNormal;
#ifdef USE_NORMAL_MAP
m=f(vNormal,vTangent,vBinormal,uNormalMap,o);
#else
m=normalize(vNormal);
#endif

#ifdef USE_VERTEX_COLOR
d*=vVertexColor;
#endif
vec3 D=uEmissiveColor.xyz;
#ifdef USE_INSTANCING
D=vInstanceEmissiveColor.xyz;
#endif
vec3 z=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);vec2 r=vec2(0);float l=0.;vec3 U=z;for(int i=0;i<100;i++){U=z+y*l;r=f(U,vInverseWorldMatrix,uBoundsScale);l+=r.x;if(!f(v(U,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||r.x<=1e-4)break;}if(r.x>1e-4)discard;float i=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,P=s(i,uNearClip,uFarClip);vec4 G=uViewMatrix*vec4(U,1);float e=x(G.z,uNearClip,uFarClip);if(e>=P)discard;vec4 a=uProjectionMatrix*uViewMatrix*vec4(U,1);gl_FragDepth=a.z/a.w*.5+.5;if(r.x>0.)m=n(U,vInverseWorldMatrix,uBoundsScale);u=d;
#ifdef USE_ALPHA_TEST
n(u.w,uAlphaTestThreshold);
#endif
u.xyz=pow(u.xyz,vec3(2.2));outGBufferA=vec4(u.xyz,1);outGBufferB=s(m,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(D.xyz,1);}`;