export const gbufferScreenSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
#define saturate(a)clamp(a,0.,1.)
float rand(vec2 u){return fract(sin(dot(u.xy,vec2(12.98,78.23)))*43.75);}layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};layout(std140) uniform ubTimeline{float uTimelineTime;float uTimelineDeltaTime;};
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 o(vec2 u,vec2 d){return u.x<d.x?u:d;}mat2 o(float u){float f=sin(u),v=cos(u);return mat2(v,f,-f,v);}vec3 opRe(vec3 u,float d){return u-d*round(u/d);}
#define OP_ID(p,r)round(p/r)
#define OP_RE(p,r)p-r*round(p/r)
vec2 opRo(vec2 u,float d){return u*o(-d);}vec3 opTr(vec3 u,vec3 d){return u-d;}vec3 u(vec3 u,vec3 d){return u/d;}float d(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 d(vec2 u){float v=PI/10.-atan(u.x,u.y),f=PI*2./10.;v=floor(v/f)*f;return opRo(u,-v);}float opSm(float u,float v,float d){float f=clamp(.5+.5*(v-u)/d,0.,1.);return mix(v,u,f)-d*f*(1.-f);}float dfSp(vec3 u,float d){return length(u)-d;}float dfRb(vec3 u,vec3 d,float v){vec3 f=abs(u)-d;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-v;}float dfBo(vec3 u,vec3 d){vec3 v=abs(u)-d;return length(max(v,0.))+min(max(v.x,max(v.y,v.z)),0.);}float dfTo(vec3 u,vec2 d){return length(vec2(length(u.xz)-d.x,u.y))-d.y;}float dfOc(vec3 u,float d){u=abs(u);return(u.x+u.y+u.z-d)*.577;}float d(vec3 u,float d,float v){vec2 f=vec2(length(u.xz)-2.*d+.05,abs(u.y)-v);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 v,vec3 f,float y,vec2 m){v=opTr(v,vec3(m.xy,0));v.xy=opRo(v.xy,y);v.yz=opRo(v.yz,PI*.5);v=u(v,f);float o=d(v,1.,.1);return d(o,f);}vec2 opBu(vec3 u,float d){u/=1.4;vec3 v=u;v.yz=opRo(v.yz,-PI*.5);vec2 f=vec2(10,.6);v.x=abs(v.x);v.xz=opRo(v.xz,PI*sin(sin(uTimelineTime*f.x+d)*cos(uTimelineTime*f.y+d))*.3);float m=opWi(v,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),y=opWi(v,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,y),0);}vec2 opFl(vec3 v,float f){vec2 m=vec2(1e4,-1e4);v/=1.;v.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+f)*.5;float y=-.1;y=cos(uTimelineTime*1.6+.1+f)*-.5;float z=v.y*sin(v.y*r),s=v.y*sin(v.y*y),x=sin(1.12*r)*.28,P=sin(1.12*y)*.28;mat2 a=o(-1.12*r),e=o(1.12*y);vec3 l=v;l=opTr(l,vec3(z,.28,s));float p=d(l,.015,.28);m=o(m,vec2(p,1));vec3 i=v;i=opTr(i,vec3(x,.56,P));i.yz=opRo(i.yz,PI*.5);i.xz*=a;i.yz*=e;i.xy=d(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 S=vec3(.08,.2,.2);i=u(i,S);float B=d(i,.4,.01);B=d(B,S);m=o(m,vec2(B,2));vec3 O=v;O=opTr(O,vec3(x,.59,P));float n=dfSp(O,.04);return o(m,vec2(n,3));}float opDb(float u,float v,float f,float m,float d,float y){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,d,smoothstep(.5,.75,u)),mix(d,y,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}float opTb(float u,float v,float f,float d){return mix(mix(v,f,smoothstep(0.,.5,u)),mix(f,d,smoothstep(.5,1.,u)),smoothstep(.5,1.,u));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;uniform vec3 uORo;float u(vec3 u){return sin(u.x*4.+uTimelineTime*3.4)*.02+cos(u.y*3.+uTimelineTime*3.2)*.02+sin(u.z*3.5+uTimelineTime*3.)*.02;}float dfMC(vec3 u){return dfSp(u,FS);}float diMAt(vec3 u){return 1.-smoothstep(1.,1.8,length(u-uCP));}float dfMB(vec3 v,float f){for(int d=0;d<BN;d++){vec3 m=opTr(v,uBPs[d].xyz);float y=dfSp(m,CS*uGS);f=opSm(f,y,MS);}f+=u(v)*diMAt(v)*uGS;return f;}float dfMBs(vec3 u){float f=dfSp(opTr(u,uCP),FS*uGS);return dfMB(u,f);}vec2 opMo(vec2 u,vec2 f,float v){return mix(u,f,v);}vec2 o(vec3 u,float v,float f){vec3 d=mod(u*f,2.)-1.;f*=3.;vec3 m=abs(1.-3.*abs(d));float y=(min(max(m.x,m.y),min(max(m.y,m.z),max(m.z,m.x)))-1.)/f;return vec2(max(v,y),f);}float dfMe(vec3 v,float u){v/=u;v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=o(v,m.x,m.y);m=o(v,m.x,m.y);m=o(v,m.x,m.y);return m.x*u;}vec3 opPrf(vec3 v,float u,float d){v=abs(v)-1.18;v=abs(v)-1.2;v.xz*=o(u+.1+uTimelineTime*.8+d);v.xy*=o(u+.8+sin(uTimelineTime)*.4+d);return v;}float dfPr(vec3 v,float u,float d){v/=d;vec3 f=v;f.xy*=o(uTimelineTime*.8+u);float m=dfTo(f,vec2(.8,.05));vec3 i=v;i.yz*=o(uTimelineTime*1.2+u);float y=dfTo(i,vec2(.8,.05)),x=dfOc(v,.6),s=opSm(opSm(m,y,.5),x,.5);return s*d;}
#pragma RAYMARCH_SCENE
float u(float u,float v,float d){return(u+v)/(v-d);}float n(float u,float v,float d){float f=v*u;return-f/(d*(u-1.)-f);}uniform sampler2D uDepthTexture;in vec2 vUv;out vec4 outColor;void main(){vec3 v=uViewPosition,f=vec3(0,0,-1);vec2 m=vec2(0);float d=0.;vec3 y=v;for(int r=0;r<80;r++){y=v+f*d;m=dfScene(y);d+=m.x;if(m.x<=1e-4)break;}if(m.x>1e-4)discard;float i=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,s=n(i,uNearClip,uFarClip),P=u((uViewMatrix*vec4(y,1)).z,uNearClip,uFarClip);if(P>=s)discard;outColor=vec4(1);}`;