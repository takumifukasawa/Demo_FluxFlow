export const gbufferObjectSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};
#ifdef USE_INSTANCING
in float vInstanceId;
#endif
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float e){return v*u(-e);}vec3 n(vec3 u,vec3 v){return u-v;}float s(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float n(vec3 u,float v,float e){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-e);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}
#define GLOBAL_SIZE 1
vec2 s(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float e=.1;e=sin(uTime*2.4+.2)*.5;float r=-.1;r=cos(uTime*2.6+.1)*-.5;float x=f.y*sin(f.y*e),y=f.y*sin(f.y*r),z=sin(1.12*e)*.28,P=sin(1.12*r)*.28;mat2 d=u(-1.12*e),t=u(1.12*r);vec3 U=f;U=n(U,vec3(x,.28,y));float h=n(U,.015,.28);m=u(m,vec2(h,1));vec3 i=f;i=n(i,vec3(z,.56,P));i.yz=v(i.yz,PI*.5);i.xz*=d;i.yz*=t;i.xy=n(i.xy);i=n(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 c=vec3(.08,.2,.2);i/=c;float l=n(i,.4,.01);l=s(l,c);m=u(m,vec2(l,2));vec3 D=f;D=n(D,vec3(z,.59,P));float G=length(D)-.04;return u(m,vec2(G,3));}
#pragma RAYMARCH_SCENE
vec3 s(vec3 u,mat4 v,vec3 e){return(v*vec4(u,1)).xyz*e;}bool f(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}void e(float u,float v){if(u<v)discard;}layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 x=vWorldPosition,y=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float m=0.,r=0.;vec3 i=x;for(int U=0;U<64;U++){i=x+y*r;m=dfScene(s(i,vInverseWorldMatrix,uBoundsScale)).x;r+=m;if(!f(s(i,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||m<=1e-4)break;}if(m>1e-4)discard;vec4 U=uProjectionMatrix*uViewMatrix*vec4(i,1);gl_FragDepth=U.z/U.w*.5+.5;float l=v.w;
#ifdef USE_ALPHA_TEST
e(l,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;