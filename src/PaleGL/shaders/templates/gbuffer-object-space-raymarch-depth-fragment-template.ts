export const gbufferObjectSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#ifdef USE_INSTANCING
in float vInstanceId;
#endif
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float d){return v*u(-d);}vec3 s(vec3 u,vec3 v){return u-v;}vec3 n(vec3 u,vec3 v){return u/v;}float d(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 d(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float y){float f=clamp(.5+.5*(v-u)/y,0.,1.);return mix(v,u,f)-y*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float d(vec3 u,float v,float f){vec2 m=vec2(length(u.xz)-2.*v+.05,abs(u.y)-f);return min(max(m.x,m.y),0.)+length(max(m,0.))-.05;}float opWing(vec3 u,vec3 f,float m,vec2 y){u=s(u,vec3(y.xy,0));u.xy=v(u.xy,m);u.yz=v(u.yz,PI*.5);u=n(u,f);float z=d(u,1.,.1);return d(z,f);}vec2 opButterfly(vec3 u,float f){vec3 m=u;m.yz=v(m.yz,-PI*.5);m.x=abs(m.x);m.xz=v(m.xz,PI*sin(sin(uTime*10.+f)*cos(uTime*6.+f))*.3);float z=opWing(m,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),y=opWing(m,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(z,y),0);}vec2 opFlower(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float y=.1;y=sin(uTime*2.4+.2)*.5;float z=-.1;z=cos(uTime*2.6+.1)*-.5;float x=f.y*sin(f.y*y),P=f.y*sin(f.y*z),i=sin(1.12*y)*.28,e=sin(1.12*z)*.28;mat2 o=u(-1.12*y),r=u(1.12*z);vec3 U=f;U=s(U,vec3(x,.28,P));float h=d(U,.015,.28);m=u(m,vec2(h,1));vec3 l=f;l=s(l,vec3(i,.56,e));l.yz=v(l.yz,PI*.5);l.xz*=o;l.yz*=r;l.xy=d(l.xy);l=s(l,vec3(0,.2,sin(l.y*5.)*.105));l.yz=v(l.yz,PI*.5);vec3 a=vec3(.08,.2,.2);l=n(l,a);float B=d(l,.4,.01);B=d(B,a);m=u(m,vec2(B,2));vec3 D=f;D=s(D,vec3(i,.59,e));float p=dfSp(D,.04);return u(m,vec2(p,3));}
#define BN 16
uniform vec3 uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(s(u,uBPs[f].xyz),.25);v=opSm(v,m,.5);}return v;}
#pragma RAYMARCH_SCENE
vec3 n(vec3 u,mat4 v,vec3 f){return(v*vec4(u,1)).xyz*f;}bool f(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}void m(float u,float v){if(u<v)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 x=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float l=0.,r=0.;vec3 z=x;for(int U=0;U<64;U++){z=x+y*r;l=dfScene(n(z,vInverseWorldMatrix,uBoundsScale)).x;r+=l;if(!f(n(z,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||l<=1e-4)break;}if(l>1e-4)discard;vec4 d=uProjectionMatrix*uViewMatrix*vec4(z,1);gl_FragDepth=d.z/d.w*.5+.5;float U=v.w;
#ifdef USE_ALPHA_TEST
m(U,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;