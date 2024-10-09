export const gbufferScreenSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 x){return u.x<x.x?u:x;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec3 n(vec3 u){return u-4.*round(u/4.);}vec2 n(vec2 v,float d){return v*u(-d);}vec3 v(vec3 u,vec3 x){return u-x;}vec3 s(vec3 u,vec3 x){return u/x;}float d(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 d(vec2 u){float v=PI/10.-atan(u.x,u.y),x=PI*2./10.;v=floor(v/x)*x;return n(u,-v);}float opSm(float u,float v,float x){float f=clamp(.5+.5*(v-u)/x,0.,1.);return mix(v,u,f)-x*f*(1.-f);}float dfSp(vec3 u,float x){return length(u)-x;}float d(vec3 u,float v,float x){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-x);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWing(vec3 u,vec3 f,float x,vec2 m){u=v(u,vec3(m.xy,0));u.xy=n(u.xy,x);u.yz=n(u.yz,PI*.5);u=s(u,f);float z=d(u,1.,.1);return d(z,f);}vec2 opButterfly(vec3 u,float x){vec3 v=u;v.yz=n(v.yz,-PI*.5);v.x=abs(v.x);v.xz=n(v.xz,PI*sin(sin(uTime*10.+x)*cos(uTime*6.+x))*.3);float f=opWing(v,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWing(v,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(f,z),0);}vec2 opFlower(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float x=.1;x=sin(uTime*2.4+.2)*.5;float z=-.1;z=cos(uTime*2.6+.1)*-.5;float o=f.y*sin(f.y*x),y=f.y*sin(f.y*z),P=sin(1.12*x)*.28,p=sin(1.12*z)*.28;mat2 e=u(-1.12*x),t=u(1.12*z);vec3 r=f;r=v(r,vec3(o,.28,y));float B=d(r,.015,.28);m=u(m,vec2(B,1));vec3 i=f;i=v(i,vec3(P,.56,p));i.yz=n(i.yz,PI*.5);i.xz*=e;i.yz*=t;i.xy=d(i.xy);i=v(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=n(i.yz,PI*.5);vec3 D=vec3(.08,.2,.2);i=s(i,D);float l=d(i,.4,.01);l=d(l,D);m=u(m,vec2(l,2));vec3 g=f;g=v(g,vec3(P,.59,p));float h=dfSp(g,.04);return u(m,vec2(h,3));}
#define BN 16
uniform vec3 uBPs[BN];float dfMB(vec3 u,float f){for(int m=0;m<BN;m++){float x=dfSp(v(u,uBPs[m].xyz),.25);f=opSm(f,x,.5);}return f;}
#pragma RAYMARCH_SCENE
float n(float u,float v,float x){return(u+v)/(v-x);}float s(float u,float v,float x){float f=v*u;return-f/(x*(u-1.)-f);}uniform sampler2D uDepthTexture;in vec2 vUv;out vec4 outColor;void main(){vec3 u=uViewPosition,v=vec3(0,0,-1);vec2 f=vec2(0);float x=0.;vec3 z=u;for(int m=0;m<100;m++){z=u+v*x;f=dfScene(z);x+=f.x;if(f.x<=1e-4)break;}if(f.x>1e-4)discard;float m=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,y=s(m,uNearClip,uFarClip),i=n((uViewMatrix*vec4(z,1)).z,uNearClip,uFarClip);if(i>=y)discard;outColor=vec4(1);}`;