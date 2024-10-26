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
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 u,float v){return u-v*round(u/v);}vec2 opRo(vec2 v,float d){return v*u(-d);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float v(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 o(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float v,float u,float y){float f=clamp(.5+.5*(u-v)/y,0.,1.);return mix(u,v,f)-y*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float d){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-d;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float dfOc(vec3 v,float u){v=abs(v);return(v.x+v.y+v.z-u)*.577;}float o(vec3 v,float u,float d){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-d);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 u,vec3 f,float d,vec2 m){u=opTr(u,vec3(m.xy,0));u.xy=opRo(u.xy,d);u.yz=opRo(u.yz,PI*.5);u=o(u,f);float x=o(u,1.,.1);return v(x,f);}vec2 opBu(vec3 u,float v){u/=1.4;vec3 f=u;f.yz=opRo(f.yz,-PI*.5);vec2 d=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*d.x+v)*cos(uTimelineTime*d.y+v))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),y=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,y),0);}vec2 opFl(vec3 f,float d){vec2 m=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float r=.1;r=sin(uTimelineTime*1.4+.2+d)*.5;float y=-.1;y=cos(uTimelineTime*1.6+.1+d)*-.5;float x=f.y*sin(f.y*r),z=f.y*sin(f.y*y),s=sin(1.12*r)*.28,P=sin(1.12*y)*.28;mat2 e=u(-1.12*r),a=u(1.12*y);vec3 l=f;l=opTr(l,vec3(x,.28,z));float U=o(l,.015,.28);m=u(m,vec2(U,1));vec3 i=f;i=opTr(i,vec3(s,.56,P));i.yz=opRo(i.yz,PI*.5);i.xz*=e;i.yz*=a;i.xy=o(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 S=vec3(.08,.2,.2);i=o(i,S);float n=o(i,.4,.01);n=v(n,S);m=u(m,vec2(n,2));vec3 B=f;B=opTr(B,vec3(s,.59,P));float h=dfSp(B,.04);return u(m,vec2(h,3));}float opDb(float v,float u,float f,float m,float s,float d){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,s,smoothstep(.5,.75,v)),mix(s,d,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float d){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,d,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;uniform vec3 uORo;float v(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.02+cos(v.y*3.+uTimelineTime*3.2)*.02+sin(v.z*3.5+uTimelineTime*3.)*.02;}float dfMC(vec3 v){return dfSp(v,FS);}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 u,float f){for(int m=0;m<BN;m++){vec3 d=opTr(u,uBPs[m].xyz);float s=dfSp(d,CS*uGS);f=opSm(f,s,MS);}f+=v(u)*diMAt(u)*uGS;return f;}float dfMBs(vec3 v){float u=dfSp(opTr(v,uCP),FS*uGS);return dfMB(v,u);}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}vec2 u(vec3 u,float v,float f){vec3 m=mod(u*f,2.)-1.;f*=3.;vec3 d=abs(1.-3.*abs(m));float y=(min(max(d.x,d.y),min(max(d.y,d.z),max(d.z,d.x)))-1.)/f;return vec2(max(v,y),f);}float dfMe(vec3 v,float d){v/=d;v/=.5;float f=dfBo(v,vec3(1));vec2 m=vec2(f,1);m=u(v,m.x,m.y);m=u(v,m.x,m.y);m=u(v,m.x,m.y);return m.x*d;}vec3 opPrf(vec3 v,float f,float d){v=abs(v)-1.18;v=abs(v)-1.2;v.xz*=u(f+.1+uTimelineTime*.8+d);v.xy*=u(f+.8+sin(uTimelineTime)*.4+d);return v;}float dfPr(vec3 v,float d,float f){v/=f;vec3 m=v;m.xy*=u(uTimelineTime*.8+d);float x=dfTo(m,vec2(.8,.05));vec3 i=v;i.yz*=u(uTimelineTime*1.2+d);float s=dfTo(i,vec2(.8,.05)),y=dfOc(v,.6),z=opSm(opSm(x,s,.5),y,.5);return z*f;}
#pragma RAYMARCH_SCENE
vec3 v(vec3 v,mat4 u,vec3 d){return(u*vec4(v,1)).xyz*d;}bool x(vec3 v,vec3 u){return abs(v.x)<u.x*.5+1e-4&&abs(v.y)<u.y*.5+1e-4&&abs(v.z)<u.z*.5+1e-4;}void n(float v,float u){if(v<u)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 d=vWorldPosition,m=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float o=0.,r=0.;vec3 i=d;for(int y=0;y<64;y++){i=d+m*r;o=dfScene(v(i,vInverseWorldMatrix,uBoundsScale)).x;r+=o;if(!x(v(i,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||o<=1e-4)break;}if(o>1e-4)discard;vec4 s=uProjectionMatrix*uViewMatrix*vec4(i,1);gl_FragDepth=s.z/s.w*.5+.5;float y=f.w;
#ifdef USE_ALPHA_TEST
n(y,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;