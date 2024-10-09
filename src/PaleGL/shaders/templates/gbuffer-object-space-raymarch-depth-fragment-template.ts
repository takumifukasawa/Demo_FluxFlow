export const gbufferObjectSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
layout(std140) uniform ubCommon{float uTime;float uDeltaTime;vec4 uViewport;};layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};
#ifdef USE_INSTANCING
in float vInstanceId;
#endif
uniform vec3 uBPs[16],uBSs[16];
#define PI 3.14
#define PI2 6.28
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),z=cos(u);return mat2(z,v,-v,z);}vec2 v(vec2 v,float e){return v*u(-e);}vec3 s(vec3 u,vec3 v){return u-v;}vec3 n(vec3 u,vec3 v){return u/v;}float f(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 f(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float u,float v,float z){float f=clamp(.5+.5*(v-u)/z,0.,1.);return mix(v,u,f)-z*f*(1.-f);}float f(vec3 u,float v,float f){vec2 z=vec2(length(u.xz)-2.*v+.05,abs(u.y)-f);return min(max(z.x,z.y),0.)+length(max(z,0.))-.05;}float opWing(vec3 u,vec3 z,float e,vec2 m){u=s(u,vec3(m.xy,0));u.xy=v(u.xy,e);u.yz=v(u.yz,PI*.5);u=n(u,z);float x=f(u,1.,.1);return f(x,z);}vec2 opButterfly(vec3 u,float f){vec3 z=u;z.yz=v(z.yz,-PI*.5);z.x=abs(z.x);z.xz=v(z.xz,PI*sin(sin(uTime*10.+f)*cos(uTime*6.+f))*.3);float m=opWing(z,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),e=opWing(z,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,e),0);}vec2 opFlower(vec3 z){vec2 m=vec2(1e4,-1e4);z.y-=-.8;float e=.1;e=sin(uTime*2.4+.2)*.5;float r=-.1;r=cos(uTime*2.6+.1)*-.5;float x=z.y*sin(z.y*e),y=z.y*sin(z.y*r),P=sin(1.12*e)*.28,a=sin(1.12*r)*.28;mat2 o=u(-1.12*e),d=u(1.12*r);vec3 U=z;U=s(U,vec3(x,.28,y));float h=f(U,.015,.28);m=u(m,vec2(h,1));vec3 i=z;i=s(i,vec3(P,.56,a));i.yz=v(i.yz,PI*.5);i.xz*=o;i.yz*=d;i.xy=f(i.xy);i=s(i,vec3(0,.2,sin(i.y*5.)*.105));i.yz=v(i.yz,PI*.5);vec3 D=vec3(.08,.2,.2);i=n(i,D);float l=f(i,.4,.01);l=f(l,D);m=u(m,vec2(l,2));vec3 g=z;g=s(g,vec3(P,.59,a));float p=length(g)-.04;return u(m,vec2(p,3));}
#pragma RAYMARCH_SCENE
vec3 n(vec3 u,mat4 v,vec3 e){return(v*vec4(u,1)).xyz*e;}bool m(vec3 u,vec3 v){return abs(u.x)<v.x*.5+1e-4&&abs(u.y)<v.y*.5+1e-4&&abs(u.z)<v.z*.5+1e-4;}void e(float u,float v){if(u<v)discard;}uniform vec4 uColor;uniform sampler2D uDiffuseMap;uniform vec2 uDiffuseMapUvScale;uniform float uIsPerspective;uniform vec3 uBoundsScale;uniform sampler2D uDepthTexture;
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
vec3 z=vWorldPosition,f=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float i=0.,x=0.;vec3 U=z;for(int r=0;r<64;r++){U=z+f*x;i=dfScene(n(U,vInverseWorldMatrix,uBoundsScale)).x;x+=i;if(!m(n(U,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||i<=1e-4)break;}if(i>1e-4)discard;vec4 s=uProjectionMatrix*uViewMatrix*vec4(U,1);gl_FragDepth=s.z/s.w*.5+.5;float l=v.w;
#ifdef USE_ALPHA_TEST
e(l,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;