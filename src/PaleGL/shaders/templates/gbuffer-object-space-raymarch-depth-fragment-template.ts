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
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 u,float v){return u-v*round(u/v);}vec2 opRo(vec2 v,float o){return v*u(-o);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float v(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 o(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float v,float u,float y){float f=clamp(.5+.5*(u-v)/y,0.,1.);return mix(u,v,f)-y*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float o){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-o;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float o(vec3 v,float u,float o){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float y,vec2 m){u=opTr(u,vec3(m.xy,0));u.xy=opRo(u.xy,y);u.yz=opRo(u.yz,PI*.5);u=o(u,f);float x=o(u,1.,.1);return v(x,f);}vec2 opBu(vec3 u,float v){u/=1.4;vec3 f=u;f.yz=opRo(f.yz,-PI*.5);vec2 o=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*o.x+v)*cos(uTimelineTime*o.y+v))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),y=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,y),0);}vec2 opFl(vec3 f,float y){vec2 m=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+y)*.5;float z=-.1;z=cos(uTimelineTime*1.6+.1+y)*-.5;float x=f.y*sin(f.y*r),s=f.y*sin(f.y*z),P=sin(1.12*r)*.28,e=sin(1.12*z)*.28;mat2 d=u(-1.12*r),a=u(1.12*z);vec3 l=f;l=opTr(l,vec3(x,.28,s));float U=o(l,.015,.28);m=u(m,vec2(U,1));vec3 i=f;i=opTr(i,vec3(P,.56,e));i.yz=opRo(i.yz,PI*.5);i.xz*=d;i.yz*=a;i.xy=o(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 n=vec3(.08,.2,.2);i=o(i,n);float B=o(i,.4,.01);B=v(B,n);m=u(m,vec2(B,2));vec3 h=f;h=opTr(h,vec3(P,.59,e));float C=dfSp(h,.04);return u(m,vec2(C,3));}float opDb(float v,float u,float f,float m,float s,float y){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,s,smoothstep(.5,.75,v)),mix(s,y,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float y){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,y,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
uniform vec3 uCP,uBPs[BN],uGPs[4];float v(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.07+cos(v.y*3.+uTimelineTime*3.2)*.07+sin(v.z*3.5+uTimelineTime*3.)*.07;}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 u,float f){for(int m=0;m<BN;m++){float y=dfSp(opTr(u,uBPs[m].xyz),CS);f=opSm(f,y,.25);}f+=v(u)*diMAt(u);return f;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}vec2 u(vec3 u,float v,float f){vec3 m=mod(u*f,2.)-1.;f*=3.;vec3 s=abs(1.-3.*abs(m));float y=(min(max(s.x,s.y),min(max(s.y,s.z),max(s.z,s.x)))-1.)/f;return vec2(max(v,y),f);}float dfMe(vec3 v){v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 v,mat4 u,vec3 f){return(u*vec4(v,1)).xyz*f;}bool x(vec3 v,vec3 u){return abs(v.x)<u.x*.5+1e-4&&abs(v.y)<u.y*.5+1e-4&&abs(v.z)<u.z*.5+1e-4;}void n(float v,float u){if(v<u)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 o=vWorldPosition,m=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float i=0.,r=0.;vec3 y=o;for(int l=0;l<64;l++){y=o+m*r;i=dfScene(v(y,vInverseWorldMatrix,uBoundsScale)).x;r+=i;if(!x(v(y,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||i<=1e-4)break;}if(i>1e-4)discard;vec4 d=uProjectionMatrix*uViewMatrix*vec4(y,1);gl_FragDepth=d.z/d.w*.5+.5;float s=f.w;
#ifdef USE_ALPHA_TEST
n(s,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;