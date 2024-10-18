export const gbufferObjectSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#ifdef USE_INSTANCING
in float vInstanceId;in vec4 vInstanceState;
#endif
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 n(vec3 u,vec3 v){return u-v;}vec3 o(vec3 u,vec3 v){return u/v;}float s(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float x){float f=clamp(.5+.5*(v-u)/x,0.,1.);return mix(v,u,f)-x*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float n(vec3 u,float v,float f){vec2 m=vec2(length(u.xz)-2.*v+.05,abs(u.y)-f);return min(max(m.x,m.y),0.)+length(max(m,0.))-.05;}float opWing(vec3 u,vec3 f,float x,vec2 m){u=n(u,vec3(m.xy,0));u.xy=v(u.xy,x);u.yz=v(u.yz,PI*.5);u=o(u,f);float z=n(u,1.,.1);return s(z,f);}vec2 opButterfly(vec3 u,float f){vec3 m=u;m.yz=v(m.yz,-PI*.5);m.x=abs(m.x);m.xz=v(m.xz,PI*sin(sin(uTime*10.+f)*cos(uTime*6.+f))*.3);float x=opWing(m,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWing(m,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(x,z),0);}vec2 opFlower(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float z=.1;z=sin(uTime*2.4+.2)*.5;float x=-.1;x=cos(uTime*2.6+.1)*-.5;float y=f.y*sin(f.y*z),P=f.y*sin(f.y*x),l=sin(1.12*z)*.28,e=sin(1.12*x)*.28;mat2 d=u(-1.12*z),r=u(1.12*x);vec3 i=f;i=n(i,vec3(y,.28,P));float U=n(i,.015,.28);m=u(m,vec2(U,1));vec3 B=f;B=n(B,vec3(l,.56,e));B.yz=v(B.yz,PI*.5);B.xz*=d;B.yz*=r;B.xy=n(B.xy);B=n(B,vec3(0,.2,sin(B.y*5.)*.105));B.yz=v(B.yz,PI*.5);vec3 C=vec3(.08,.2,.2);B=o(B,C);float h=n(B,.4,.01);h=s(h,C);m=u(m,vec2(h,2));vec3 p=f;p=n(p,vec3(l,.59,e));float D=dfSp(p,.04);return u(m,vec2(D,3));}float opDb(float u,float v,float f,float m,float x,float z){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,x,smoothstep(.5,.75,u)),mix(x,z,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}
#define BN 16
#define FS 1.
#define CS.35
uniform vec3 uCP,uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(n(u,uBPs[f].xyz),CS);v=opSm(v,m,.25);}float f=sin(u.x*4.+uTime*3.4)*.1+sin(u.y*3.+uTime*3.2)*.1+sin(u.z*3.5+uTime*3.)*.1;v+=f*(1.-smoothstep(1.,1.8,length(u-uCP)));return v;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}
#pragma RAYMARCH_SCENE
vec3 o(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}bool p(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}void x(float u,float v){if(u<v)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 f=vWorldPosition,m=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float B=0.,r=0.;vec3 z=f;for(int i=0;i<64;i++){z=f+m*r;B=dfScene(o(z,vInverseWorldMatrix,uBoundsScale)).x;r+=B;if(!p(o(z,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||B<=1e-4)break;}if(B>1e-4)discard;vec4 d=uProjectionMatrix*uViewMatrix*vec4(z,1);gl_FragDepth=d.z/d.w*.5+.5;float i=v.w;
#ifdef USE_ALPHA_TEST
x(i,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;