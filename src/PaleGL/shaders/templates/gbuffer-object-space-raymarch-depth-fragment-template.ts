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
vec2 u(vec2 u,vec2 v){return u.x<v.x?u:v;}mat2 u(float u){float v=sin(u),f=cos(u);return mat2(f,v,-v,f);}vec2 v(vec2 v,float o){return v*u(-o);}vec3 s(vec3 u,vec3 v){return u-v;}vec3 n(vec3 u,vec3 v){return u/v;}float o(float u,vec3 v){return u*min(v.x,min(v.y,v.z));}vec2 n(vec2 u){float f=PI/10.-atan(u.x,u.y),x=PI*2./10.;f=floor(f/x)*x;return v(u,-f);}float opSm(float v,float u,float y){float f=clamp(.5+.5*(u-v)/y,0.,1.);return mix(u,v,f)-y*f*(1.-f);}float dfSp(vec3 u,float v){return length(u)-v;}float dfTo(vec3 v,vec2 u){return length(vec2(length(v.xz)-u.x,v.y))-u.y;}float n(vec3 u,float v,float o){vec2 f=vec2(length(u.xz)-2.*v+.05,abs(u.y)-o);return min(max(f.x,f.y),0.)+length(max(f,0.))-.05;}float opWing(vec3 u,vec3 f,float m,vec2 y){u=s(u,vec3(y.xy,0));u.xy=v(u.xy,m);u.yz=v(u.yz,PI*.5);u=n(u,f);float z=n(u,1.,.1);return o(z,f);}vec2 opButterfly(vec3 u,float o){vec3 f=u;f.yz=v(f.yz,-PI*.5);f.x=abs(f.x);f.xz=v(f.xz,PI*sin(sin(uTime*10.+o)*cos(uTime*6.+o))*.3);float m=opWing(f,vec3(.4,.2,.24)*.2,PI*-.3,vec2(.5,.4)*.2),z=opWing(f,vec3(.32,.2,.2)*.2,PI*.3,vec2(.4,-.4)*.2);return vec2(min(m,z),0);}vec2 opFlower(vec3 f){vec2 m=vec2(1e4,-1e4);f.y-=-.8;float z=.1;z=sin(uTime*2.4+.2)*.5;float y=-.1;y=cos(uTime*2.6+.1)*-.5;float x=f.y*sin(f.y*z),P=f.y*sin(f.y*y),i=sin(1.12*z)*.28,e=sin(1.12*y)*.28;mat2 d=u(-1.12*z),r=u(1.12*y);vec3 l=f;l=s(l,vec3(x,.28,P));float U=n(l,.015,.28);m=u(m,vec2(U,1));vec3 B=f;B=s(B,vec3(i,.56,e));B.yz=v(B.yz,PI*.5);B.xz*=d;B.yz*=r;B.xy=n(B.xy);B=s(B,vec3(0,.2,sin(B.y*5.)*.105));B.yz=v(B.yz,PI*.5);vec3 C=vec3(.08,.2,.2);B=n(B,C);float h=n(B,.4,.01);h=o(h,C);m=u(m,vec2(h,2));vec3 p=f;p=s(p,vec3(i,.59,e));float D=dfSp(p,.04);return u(m,vec2(D,3));}float opDb(float u,float v,float f,float m,float s,float o){return mix(mix(mix(v,f,smoothstep(0.,.25,u)),mix(f,m,smoothstep(.25,.5,u)),smoothstep(.25,.5,u)),mix(mix(m,s,smoothstep(.5,.75,u)),mix(s,o,smoothstep(.75,1.,u)),smoothstep(.5,.75,u)),smoothstep(.5,1.,u));}
#define BN 16
#define CS.25
uniform vec3 uCP,uBPs[BN];float dfMB(vec3 u,float v){for(int f=0;f<BN;f++){float m=dfSp(s(u,uBPs[f].xyz),CS);v=opSm(v,m,.25);}return v;}vec2 opMo(vec2 u,vec2 v,float f){return mix(u,v,f);}
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
vec3 f=vWorldPosition,z=uIsPerspective>.5?normalize(vWorldPosition-uViewPosition):normalize(-uViewPosition);float m=0.,r=0.;vec3 B=f;for(int l=0;l<64;l++){B=f+z*r;m=dfScene(o(B,vInverseWorldMatrix,uBoundsScale)).x;r+=m;if(!p(o(B,vInverseWorldMatrix,uBoundsScale),uBoundsScale)||m<=1e-4)break;}if(m>1e-4)discard;vec4 s=uProjectionMatrix*uViewMatrix*vec4(B,1);gl_FragDepth=s.z/s.w*.5+.5;float l=v.w;
#ifdef USE_ALPHA_TEST
x(l,uAlphaTestThreshold);
#endif
outColor=vec4(1);}`;