export const gbufferObjectSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};layout(std140) uniform ubTimeline{float uTimelineTime;float uTimelineDeltaTime;};
#ifdef USE_INSTANCING
in float vInstanceId;in vec4 vInstanceState;
#endif
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec3 opRe(vec3 u,float v){return u-v*round(u/v);}vec2 opRo(vec2 v,float o){return v*u(-o);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float x(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 o(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float u,float v,float x){float f=clamp(.5+.5*(v-u)/x,0.,1.);return mix(v,u,f)-x*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float dfRb(vec3 u,vec3 v,float x){vec3 f=abs(u)-v;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-x;}float dfBo(vec3 u,vec3 v){vec3 f=abs(u)-v;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float o(vec3 u,float v,float o){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 v,vec3 u,float f,vec2 m){v=opTr(v,vec3(m.xy,0));v.xy=opRo(v.xy,f);v.yz=opRo(v.yz,PI*.5);v=o(v,u);float z=o(v,1.,.1);return x(z,u);}vec2 opBu(vec3 u,float v){u/=1.4;vec3 f=u;f.yz=opRo(f.yz,-PI*.5);vec2 o=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*o.x+v)*cos(uTimelineTime*o.y+v))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,z),0);}vec2 opFl(vec3 v,float f){vec2 m=vec2(1e4,-1e4);v/=1.;v.y-=-.8;float z=.1;z=sin(uTimelineTime*1.4+.2+f)*.5;float r=-.1;r=cos(uTimelineTime*1.6+.1+f)*-.5;float d=v.y*sin(v.y*z),y=v.y*sin(v.y*r),s=sin(1.12*z)*.28,P=sin(1.12*r)*.28;mat2 e=u(-1.12*z),C=u(1.12*r);vec3 l=v;l=opTr(l,vec3(d,.28,y));float U=o(l,.015,.28);m=u(m,vec2(U,1));vec3 i=v;i=opTr(i,vec3(s,.56,P));i.yz=opRo(i.yz,PI*.5);i.xz*=e;i.yz*=C;i.xy=o(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 S=vec3(.08,.2,.2);i=o(i,S);float n=o(i,.4,.01);n=x(n,S);m=u(m,vec2(n,2));vec3 B=v;B=opTr(B,vec3(s,.59,P));float h=dfSp(B,.04);return u(m,vec2(h,3));}float opDb(float u,float v,float f,float m,float s,float x){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,s,smoothstep(.5,.75,u)),mix(s,x,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}float opTb(float u,float v,float f,float m){return mix(mix(v,f,smoothstep(0.,.5,u)),mix(f,m,smoothstep(.5,1.,u)),smoothstep(.5,1.,u));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS,uGM;float x(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.07+cos(v.y*3.+uTimelineTime*3.2)*.07+sin(v.z*3.5+uTimelineTime*3.)*.07;}float diMAt(vec3 u){return 1.-smoothstep(1.,1.8,length(u-uCP));}float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(opTr(u,uBPs[f].xyz),CS);v=opSm(v,m,MS);}v+=x(u)*diMAt(u);return v;}vec2 opMo(vec2 v,vec2 u,float f){return mix(v,u,f);}vec2 u(vec3 v,float u,float f){vec3 m=mod(v*f,2.)-1.;f*=3.;vec3 s=abs(1.-3.*abs(m));float z=(min(max(s.x,s.y),min(max(s.y,s.z),max(s.z,s.x)))-1.)/f;return vec2(max(u,z),f);}float dfMe(vec3 v){v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x;}
#pragma RAYMARCH_SCENE
vec3 x(vec3 v,mat4 u,vec3 f){return(u*vec4(v,1)).xyz*f;}bool n(vec3 v,vec3 u){return abs(v.x)<u.x*.5+1e-4&&abs(v.y)<u.y*.5+1e-4&&abs(v.z)<u.z*.5+1e-4;}void p(float v,float u){if(v<u)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
in vec2 vUv;in vec3 vLocalPosition,vWorldPosition;in mat4 vInverseWorldMatrix;
#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif
out vec4 outColor;void main(){vec4 u=texture(uDiffuseMap,vUv*uDiffuseMapUvScale),v=vec4(0);
#ifdef USE_VERTEX_COLOR
v=vVertexColor*uColor*u;
#else
v=uColor*u;
#endif
vec3 o=vWorldPosition,f=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float m=0.,r=0.;vec3 s=o;for(int i=0;i<64;i++){s=o+f*r;m=dfScene(x(s,vInverseWorldMatrix,uBoundsScale)).x;r+=m;if(!n(x(s,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||m<=1e-4)break;}if(m>1e-4)discard;vec4 i=uProjectionMatrix*uViewMatrix*vec4(s,1);gl_FragDepth=i.z/i.w*.5+.5;float z=v.w;
#ifdef USE_ALPHA_TEST
p(z,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;