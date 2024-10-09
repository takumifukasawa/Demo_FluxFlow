export const litScreenSpaceRaymarchFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec3 v(vec3 u){return u-4.*round(u/4.);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 n(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float e(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 e(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float o){float f=clamp(.5+.5*(v-u)/o,0.,1.);return mix(v,u,f)-o*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float e(vec3 u,float v,float o){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWing(vec3 u,vec3 f,float z,vec2 m){u=n(u,vec3(m.xy,0));u.xy=v(u.xy,z);u.yz=v(u.yz,PI*.5);u=o(u,f);float s=e(u,1.,.1);return e(s,f);}vec2 opButterfly(vec3 u,float o){vec3 f=u;f.yz=v(f.yz,-PI*.5);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTime*10.+o)*cos(uTime*6.+o))*.3);float z=opWing(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),y=opWing(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(z,y),0);}vec2 opFlower(vec3 f){vec2 z=vec2(1e4,-1e4);f.y-=-.8;float m=.1;m=sin(uTime*2.4+.2)*.5;float r=-.1;r=cos(uTime*2.6+.1)*-.5;float s=f.y*sin(f.y*m),y=f.y*sin(f.y*r),x=sin(1.12*m)*.28,P=sin(1.12*r)*.28;mat2 d=u(-1.12*m),t=u(1.12*r);vec3 l=f;l=n(l,vec3(s,.28,y));float G=e(l,.015,.28);z=u(z,vec2(G,1));vec3 i=f;i=n(i,vec3(x,.56,P));i.yz=v(i.yz,PI*.5);i.xz*=d;i.yz*=t;i.xy=e(i.xy);i=n(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 B=vec3(.08,.2,.2);i=o(i,B);float c=e(i,.4,.01);c=e(c,B);z=u(z,vec2(c,2));vec3 h=f;h=n(h,vec3(x,.59,P));float A=dfSp(h,.04);return u(z,vec2(A,3));}
#define BN 16
uniform vec3 uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float z=dfSp(n(u,uBPs[f].xyz),.25);v=opSm(v,z,.5);}return v;}
#pragma RAYMARCH_SCENE
vec3 n(vec3 u){vec3 v=vec3(dfScene(u+vec3(1e-4,0,0)).x-dfScene(u+vec3(-1e-4,0,0)).x,dfScene(u+vec3(0,1e-4,0)).x-dfScene(u+vec3(0,-1e-4,0)).x,dfScene(u+vec3(0,0,1e-4)).x-dfScene(u+vec3(0,0,-1e-4)).x);return normalize(v);}vec3 e(vec2 u,vec3 v,float f,float o){vec2 z=u*2.-1.;float m=tan(f*3.141592/180.*.5);vec3 i=v,x=normalize(cross(i,vec3(0,1,0)));return normalize(m*o*x*z.x+normalize(cross(x,i))*m*z.y+v);}float n(float u,float v,float o){return(u+v)/(v-o);}float o(float u,float v,float f){float o=v*u;return-o/(f*(u-1.)-o);}void f(float u,float v){if(u<v)discard;}uniform float uMetallic,uRoughness;uniform int uShadingModelId;
#pragma APPEND_UNIFORMS
uniform sampler2D uDepthTexture;uniform float uTargetWidth,uTargetHeight;
#ifdef USE_ALPHA_TEST
uniform float uAlphaTestThreshold;
#endif
in vec2 vUv;in vec3 vWorldPosition;
#define SHADING_MODEL_NUM 3.
struct GBufferA{vec3 baseColor;};struct GBufferB{vec3 normal;float shadingModelId;};struct GBufferC{float metallic;float roughness;};struct GBufferD{vec3 emissiveColor;};vec4 s(vec3 u,int v){float f=float(v)/SHADING_MODEL_NUM;return vec4(u*.5+.5,f);}layout(location=0) out vec4 outGBufferA;layout(location=1) out vec4 outGBufferB;layout(location=2) out vec4 outGBufferC;layout(location=3) out vec4 outGBufferD;void main(){vec4 u=vec4(0,0,0,1);vec3 v=vec3(0,0,1),x=uViewPosition,z=e(vUv,uViewDirection,uFov,uAspect);vec2 i=vec2(0);float m=uNearClip;vec3 r=x;for(int l=0;l<100;l++){r=x+z*m;i=dfScene(r);m+=i.x;if(m>uFarClip||i.x<=1e-4)break;}if(i.x>1e-4)discard;float l=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,y=o(l,uNearClip,uFarClip),P=n((uViewMatrix*vec4(r,1)).z,uNearClip,uFarClip);if(P>=y)discard;vec4 d=uProjectionMatrix*uViewMatrix*vec4(r,1);gl_FragDepth=d.z/d.w*.5+.5;if(i.x>0.)v=n(r);
#ifdef USE_ALPHA_TEST
f(u.w,uAlphaTestThreshold);
#endif
u.xyz=pow(u.xyz,vec3(2.2));outGBufferA=vec4(u.xyz,1);outGBufferB=s(v,uShadingModelId);outGBufferC=vec4(uMetallic,uRoughness,0,1);outGBufferD=vec4(vec4(1).xyz,1);}`;