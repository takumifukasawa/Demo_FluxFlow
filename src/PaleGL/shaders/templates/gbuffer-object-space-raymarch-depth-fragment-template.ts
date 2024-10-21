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
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 x(vec3 u,vec3 v){return u/v;}float o(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 o(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float x){float f=clamp(.5+.5*(v-u)/x,0.,1.);return mix(v,u,f)-x*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float dfRb(vec3 u,vec3 v,float x){vec3 f=abs(u)-v;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-x;}float dfBo(vec3 u,vec3 v){vec3 f=abs(u)-v;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float o(vec3 u,float v,float o){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float m,vec2 y){u=opTr(u,vec3(y.xy,0));u.xy=v(u.xy,m);u.yz=v(u.yz,PI*.5);u=x(u,f);float z=o(u,1.,.1);return o(z,f);}vec2 opBu(vec3 u,float o){u/=1.4;vec3 f=u;f.yz=v(f.yz,-PI*.5);vec2 m=vec2(10,.6);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTimelineTime*m.x+o)*cos(uTimelineTime*m.y+o))*.3);float x=opWi(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(x,z),0);}vec2 opFl(vec3 f,float m){vec2 z=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+m)*.5;float y=-.1;y=cos(uTimelineTime*1.6+.1+m)*-.5;float d=f.y*sin(f.y*r),s=f.y*sin(f.y*y),P=sin(1.12*r)*.28,e=sin(1.12*y)*.28;mat2 U=u(-1.12*r),a=u(1.12*y);vec3 l=f;l=opTr(l,vec3(d,.28,s));float n=o(l,.015,.28);z=u(z,vec2(n,1));vec3 i=f;i=opTr(i,vec3(P,.56,e));i.yz=v(i.yz,PI*.5);i.xz*=U;i.yz*=a;i.xy=o(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 C=vec3(.08,.2,.2);i=x(i,C);float B=o(i,.4,.01);B=o(B,C);z=u(z,vec2(B,2));vec3 h=f;h=opTr(h,vec3(P,.59,e));float p=dfSp(h,.04);return u(z,vec2(p,3));}float opDb(float u,float v,float f,float m,float x,float z){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,x,smoothstep(.5,.75,u)),mix(x,z,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}float opTb(float u,float v,float f,float m){return mix(mix(v,f,smoothstep(0.,.5,u)),mix(f,m,smoothstep(.5,1.,u)),smoothstep(.5,1.,u));}
#define BN 16
#define FS 1.
#define CS.35
uniform vec3 uCP,uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(opTr(u,uBPs[f].xyz),CS);v=opSm(v,m,.25);}float f=sin(u.x*4.+uTimelineTime*3.4)*.07+cos(u.y*3.+uTimelineTime*3.2)*.07+sin(u.z*3.5+uTimelineTime*3.)*.07;v+=f*(1.-smoothstep(1.,1.8,length(u-uCP)));return v;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}vec2 u(vec3 u,float v,float f){vec3 m=mod(u*f,2.)-1.;f*=3.;vec3 i=abs(1.-3.*abs(m));float z=(min(max(i.x,i.y),min(max(i.y,i.z),max(i.z,i.x)))-1.)/f;return vec2(max(v,z),f);}float dfMe(vec3 v){v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}bool n(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}void p(float u,float v){if(u<v)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 m=vWorldPosition,z=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float i=0.,r=0.;vec3 x=m;for(int o=0;o<64;o++){x=m+z*r;i=dfScene(v(x,vInverseWorldMatrix,uBoundsScale)).x;r+=i;if(!n(v(x,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||i<=1e-4)break;}if(i>1e-4)discard;vec4 o=uProjectionMatrix*uViewMatrix*vec4(x,1);gl_FragDepth=o.z/o.w*.5+.5;float l=f.w;
#ifdef USE_ALPHA_TEST
p(l,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;