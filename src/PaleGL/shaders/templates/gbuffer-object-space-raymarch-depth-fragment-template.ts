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
vec2 o(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 o(float v){float u=sin(v),f=cos(v);return mat2(f,u,-u,f);}vec3 opRe(vec3 u,float v){return u-v*round(u/v);}vec2 opRo(vec2 u,float v){return u*o(-v);}vec3 opTr(vec3 u,vec3 v){return u-v;}vec3 u(vec3 u,vec3 v){return u/v;}float v(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 u(vec2 v){float u=PI/10.-atan(v.x,v.y),f=PI*2./10.;u=floor(u/f)*f;return opRo(v,-u);}float opSm(float u,float v,float x){float f=clamp(.5+.5*(v-u)/x,0.,1.);return mix(v,u,f)-x*f*(1.-f);}float dfSp(vec3 v,float u){return length(v)-u;}float dfRb(vec3 v,vec3 u,float x){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.)-x;}float dfBo(vec3 v,vec3 u){vec3 f=abs(v)-u;return length(max(f,0.))+min(max(f.x,max(f.y,f.z)),0.);}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float dfOc(vec3 v,float u){v=abs(v);return(v.x+v.y+v.z-u)*.577;}float o(vec3 v,float u,float d){vec2 f=vec2(length(v.xz)-2.*u+.05,abs(v.y)-d);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWi(vec3 f,vec3 x,float z,vec2 m){f=opTr(f,vec3(m.xy,0));f.xy=opRo(f.xy,z);f.yz=opRo(f.yz,PI*.5);f=u(f,x);float d=o(f,1.,.1);return v(d,x);}vec2 opBu(vec3 u,float v){u/=1.4;vec3 f=u;f.yz=opRo(f.yz,-PI*.5);vec2 d=vec2(10,.6);f.x=abs(f.x);f.xz=opRo(f.xz,PI*sin(sin(uTimelineTime*d.x+v)*cos(uTimelineTime*d.y+v))*.3);float m=opWi(f,vec3(.4,.3,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWi(f,vec3(.32,.3,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,z),0);}vec2 opFl(vec3 f,float d){vec2 m=vec2(1e4,-1e4);f/=1.;f.y-=-.8;float z=.1;z=sin(uTimelineTime*1.4+.2+d)*.5;float r=-.1;r=cos(uTimelineTime*1.6+.1+d)*-.5;float x=f.y*sin(f.y*z),y=f.y*sin(f.y*r),s=sin(1.12*z)*.28,S=sin(1.12*r)*.28;mat2 e=o(-1.12*z),P=o(1.12*r);vec3 l=f;l=opTr(l,vec3(x,.28,y));float U=o(l,.015,.28);m=o(m,vec2(U,1));vec3 i=f;i=opTr(i,vec3(s,.56,S));i.yz=opRo(i.yz,PI*.5);i.xz*=e;i.yz*=P;i.xy=u(i.xy);i=opTr(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=opRo(i.yz,PI*.5);vec3 C=vec3(.08,.2,.2);i=u(i,C);float n=o(i,.4,.01);n=v(n,C);m=o(m,vec2(n,2));vec3 B=f;B=opTr(B,vec3(s,.59,S));float h=dfSp(B,.04);return o(m,vec2(h,3));}float opDb(float v,float u,float f,float m,float x,float z){return mix(mix(mix(u,f,smoothstep(0.,.25,v)),mix(f,m,smoothstep(.25,.5,v)),smoothstep(.25,.5,v)),mix(mix(m,x,smoothstep(.5,.75,v)),mix(x,z,smoothstep(.75,1.,v)),smoothstep(.5,.75,v)),smoothstep(.5,1.,v));}float opTb(float v,float u,float f,float x){return mix(mix(u,f,smoothstep(0.,.5,v)),mix(f,x,smoothstep(.5,1.,v)),smoothstep(.5,1.,v));}
#define BN 16
#define FS 1.
#define CS.35
#define MS.25
uniform vec3 uCP,uBPs[BN],uGPs[4];uniform float uGS;uniform vec4 uGSs[4];uniform float uOMR;uniform vec3 uORo;float v(vec3 v){return sin(v.x*4.+uTimelineTime*3.4)*.02+cos(v.y*3.+uTimelineTime*3.2)*.02+sin(v.z*3.5+uTimelineTime*3.)*.02;}float dfMC(vec3 v){return dfSp(v,FS);}float diMAt(vec3 v){return 1.-smoothstep(1.,1.8,length(v-uCP));}float dfMB(vec3 u,float f){for(int m=0;m<BN;m++){vec3 x=opTr(u,uBPs[m].xyz);float z=dfSp(x,CS*uGS);f=opSm(f,z,MS);}f+=v(u)*diMAt(u)*uGS;return f;}float dfMBs(vec3 v){float u=dfSp(opTr(v,uCP),FS*uGS);return dfMB(v,u);}vec2 opMo(vec2 v,vec2 u,float f){return mix(v,u,f);}vec2 u(vec3 v,float u,float f){vec3 m=mod(v*f,2.)-1.;f*=3.;vec3 d=abs(1.-3.*abs(m));float z=(min(max(d.x,d.y),min(max(d.y,d.z),max(d.z,d.x)))-1.)/f;return vec2(max(u,z),f);}float dfMe(vec3 v,float f){v/=f;v/=.5;float m=dfBo(v,vec3(1));vec2 d=vec2(m,1);d=u(v,d.x,d.y);d=u(v,d.x,d.y);d=u(v,d.x,d.y);return d.x*f;}vec3 opPrf(vec3 v,float u,float f){v=abs(v)-1.18;v=abs(v)-1.2;v.xz*=o(u+.1+uTimelineTime*.8+f);v.xy*=o(u+.8+sin(uTimelineTime)*.4+f);return v;}float dfPr(vec3 v,float u,float f){v/=f;vec3 m=v;m.xy*=o(uTimelineTime*.8+u);float x=dfTo(m,vec2(.8,.05));vec3 d=v;d.yz*=o(uTimelineTime*1.2+u);float z=dfTo(d,vec2(.8,.05)),s=dfOc(v,.6),y=opSm(opSm(x,z,.5),s,.5);return y*f;}
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
vec3 o=vWorldPosition,z=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float m=0.,d=0.;vec3 i=o;for(int r=0;r<64;r++){i=o+z*d;m=dfScene(v(i,vInverseWorldMatrix,uBoundsScale)).x;d+=m;if(!x(v(i,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||m<=1e-4)break;}if(m>1e-4)discard;vec4 s=uProjectionMatrix*uViewMatrix*vec4(i,1);gl_FragDepth=s.z/s.w*.5+.5;float l=f.w;
#ifdef USE_ALPHA_TEST
n(l,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;