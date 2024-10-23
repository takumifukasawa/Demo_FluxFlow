export const gbufferScreenSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};layout(std140) uniform ubTimeline{float uTimelineTime;float uTimelineDeltaTime;};
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 o(vec2 u,vec2 x){return u.x<x.x?u:x;}mat2 o(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec3 opRe(vec3 u,float y){return u-y*round(u/y);}vec2 opRo(vec2 u,float y){return u*o(-y);}vec3 opTr(vec3 u,vec3 x){return u-x;}vec3 u(vec3 u,vec3 x){return u/x;}float x(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 u(vec2 u){float v=PI/10.-atan(u.x,u.y),f=PI*2./10.;v=floor(v/f)*f;return opRo(u,-v);}float opSm(float u,float v,float y){float f=clamp(.5+.5*(v-u)/y,0.,1.);return mix(v,u,f)-y*f*(1.-f);}float dfSp(vec3 u,float x){return length(u)-x;}float dfRb(vec3 u,vec3 x,float y){vec3 v=abs(u)-x;return length(max(v,0.))+min(max(v.x,max(v.y,v.z)),0.)-y;}float dfBo(vec3 u,vec3 x){vec3 v=abs(u)-x;return length(max(v,0.))+min(max(v.x,max(v.y,v.z)),0.);}float dfTo(vec3 u,vec2 v){return length(vec2(length(u.xz)-v.x,u.y))-v.y;}float o(vec3 u,float v,float y){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-y);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 v,vec3 f,float y,vec2 m){v=opTr(v,vec3(m.xy,0));v.xy=opRo(v.xy,y);v.yz=opRo(v.yz,PI*.5);v=u(v,f);float d=o(v,1.,.1);return x(d,f);}vec2 opBu(vec3 u,float y){u/=1.4;vec3 v=u;v.yz=opRo(v.yz,-PI*.5);vec2 d=vec2(10,.6);v.x=abs(v.x);v.xz=opRo(v.xz,PI*sin(sin(uTimelineTime*d.x+y)*cos(uTimelineTime*d.y+y))*.3);float m=opWi(v,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),f=opWi(v,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,f),0);}vec2 opFl(vec3 v,float y){vec2 f=vec2(1e4,-1e4);v/=1.;v.y-=-.8;float m=.1;m=sin(uTimelineTime*1.4+.2+y)*.5;float d=-.1;d=cos(uTimelineTime*1.6+.1+y)*-.5;float z=v.y*sin(v.y*m),s=v.y*sin(v.y*d),P=sin(1.12*m)*.28,S=sin(1.12*d)*.28;mat2 e=o(-1.12*m),a=o(1.12*d);vec3 r=v;r=opTr(r,vec3(z,.28,s));float l=o(r,.015,.28);f=o(f,vec2(l,1));vec3 i=v;i=opTr(i,vec3(P,.56,S));i.yz=opRo(i.yz,PI*.5);i.xz*=e;i.yz*=a;i.xy=u(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 F=vec3(.08,.2,.2);i=u(i,F);float B=o(i,.4,.01);B=x(B,F);f=o(f,vec2(B,2));vec3 n=v;n=opTr(n,vec3(P,.59,S));float p=dfSp(n,.04);return o(f,vec2(p,3));}float opDb(float u,float v,float f,float m,float s,float y){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,s,smoothstep(.5,.75,u)),mix(s,y,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}float opTb(float u,float v,float f,float y){return mix(mix(v,f,smoothstep(0.,.5,u)),mix(f,y,smoothstep(.5,1.,u)),smoothstep(.5,1.,u));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;float x(vec3 u){return sin(u.x*4.+uTimelineTime*3.4)*.07+cos(u.y*3.+uTimelineTime*3.2)*.07+sin(u.z*3.5+uTimelineTime*3.)*.07;}float dfMC(vec3 u){return dfSp(u,FS);}float diMAt(vec3 u){return 1.-smoothstep(1.,1.8,length(u-uCP));}float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(opTr(u,uBPs[f].xyz),CS);v=opSm(v,m,MS);}v+=x(u)*diMAt(u)*uGS;return v;}float dfMBs(vec3 u){float f=dfSp(opTr(u,uCP),FS*uGS);return dfMB(u,f);}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}vec2 u(vec3 u,float v,float f){vec3 y=mod(u*f,2.)-1.;f*=3.;vec3 m=abs(1.-3.*abs(y));float d=(min(max(m.x,m.y),min(max(m.y,m.z),max(m.z,m.x)))-1.)/f;return vec2(max(v,d),f);}float dfMe(vec3 v){v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x;}
#pragma RAYMARCH_SCENE
float x(float u,float v,float y){return(u+v)/(v-y);}float n(float u,float v,float y){float f=v*u;return-f/(y*(u-1.)-f);}uniform sampler2D uDepthTexture;in vec2 vUv;out vec4 outColor;void main(){vec3 u=uViewPosition,f=vec3(0,0,-1);vec2 v=vec2(0);float m=0.;vec3 y=u;for(int d=0;d<100;d++){y=u+f*m;v=dfScene(y);m+=v.x;if(v.x<=1e-4)break;}if(v.x>1e-4)discard;float d=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,s=n(d,uNearClip,uFarClip),i=x((uViewMatrix*vec4(y,1)).z,uNearClip,uFarClip);if(i>=s)discard;outColor=vec4(1);}`;