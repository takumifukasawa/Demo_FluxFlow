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
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float y){return v*u(-y);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 x(vec3 u,vec3 v){return u/v;}float n(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float m=PI/10.-atan(u.x,u.y),f=PI*2./10.;m=floor(m/f)*f;return v(u,-m);}float opSm(float v,float u,float y){float f=clamp(.5+.5*(u-v)/y,0.,1.);return mix(u,v,f)-y*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float dfRb(vec3 u,vec3 v,float x){vec3 f=abs(u)-v;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-x;}float dfBo(vec3 u,vec3 v){vec3 f=abs(u)-v;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float n(vec3 u,float v,float y){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-y);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float y,vec2 m){u=opTr(u,vec3(m.xy,0));u.xy=v(u.xy,y);u.yz=v(u.yz,PI*.5);u=x(u,f);float z=n(u,1.,.1);return n(z,f);}vec2 opBu(vec3 u,float y){u/=1.4;vec3 f=u;f.yz=v(f.yz,-PI*.5);vec2 m=vec2(10,.6);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTimelineTime*m.x+y)*cos(uTimelineTime*m.y+y))*.3);float x=opWi(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(x,z),0);}vec2 opFl(vec3 f,float y){vec2 m=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float z=.1;z=sin(uTimelineTime*1.4+.2+y)*.5;float r=-.1;r=cos(uTimelineTime*1.6+.1+y)*-.5;float o=f.y*sin(f.y*z),s=f.y*sin(f.y*r),P=sin(1.12*z)*.28,e=sin(1.12*r)*.28;mat2 d=u(-1.12*z),a=u(1.12*r);vec3 l=f;l=opTr(l,vec3(o,.28,s));float U=n(l,.015,.28);m=u(m,vec2(U,1));vec3 i=f;i=opTr(i,vec3(P,.56,e));i.yz=v(i.yz,PI*.5);i.xz*=d;i.yz*=a;i.xy=n(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 C=vec3(.08,.2,.2);i=x(i,C);float B=n(i,.4,.01);B=n(B,C);m=u(m,vec2(B,2));vec3 h=f;h=opTr(h,vec3(P,.59,e));float p=dfSp(h,.04);return u(m,vec2(p,3));}float opDb(float u,float v,float f,float m,float s,float y){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,s,smoothstep(.5,.75,u)),mix(s,y,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}float opTb(float u,float v,float f,float y){return mix(mix(v,f,smoothstep(0.,.5,u)),mix(f,y,smoothstep(.5,1.,u)),smoothstep(.5,1.,u));}
#define BN 16
#define FS 1.
#define CS.35
uniform vec3 uCP,uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(opTr(u,uBPs[f].xyz),CS);v=opSm(v,m,.25);}float f=sin(u.x*4.+uTimelineTime*3.4)*.07+cos(u.y*3.+uTimelineTime*3.2)*.07+sin(u.z*3.5+uTimelineTime*3.)*.07;v+=f*(1.-smoothstep(1.,1.8,length(u-uCP)));return v;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}vec2 u(vec3 u,float v,float f){vec3 m=mod(u*f,2.)-1.;f*=3.;vec3 s=abs(1.-3.*abs(m));float y=(min(max(s.x,s.y),min(max(s.y,s.z),max(s.z,s.x)))-1.)/f;return vec2(max(v,y),f);}float dfMe(vec3 v){v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}bool p(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}void s(float u,float v){if(u<v)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
in vec2 vUv;in vec3 vLocalPosition,vWorldPosition;in mat4 vInverseWorldMatrix;
#ifdef USE_VERTEX_COLOR
in vec4 vVertexColor;
#endif
out vec4 outColor;void main(){vec4 u=texture(uDiffuseMap,vUv*uDiffuseMapUvScale),f=vec4(0);
#ifdef USE_VERTEX_COLOR
f=vVertexColor*uColor*u;
#else
f=uColor*u;
#endif
vec3 m=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float i=0.,r=0.;vec3 x=m;for(int z=0;z<64;z++){x=m+y*r;i=dfScene(v(x,vInverseWorldMatrix,uBoundsScale)).x;r+=i;if(!p(v(x,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||i<=1e-4)break;}if(i>1e-4)discard;vec4 o=uProjectionMatrix*uViewMatrix*vec4(x,1);gl_FragDepth=o.z/o.w*.5+.5;float z=f.w;
#ifdef USE_ALPHA_TEST
s(z,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;