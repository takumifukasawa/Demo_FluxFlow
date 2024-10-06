export const gbufferScreenSpaceRaymarchDepthFragmentTemplate = `#version 300 es
precision highp float;
#pragma DEFINES
#define PI 3.14
#define PI2 6.28
vec3 u(vec3 u){return u-4.*round(u/4.);}
#pragma RAYMARCH_SCENE
float u(float u,float v,float f){return(u+v)/(v-f);}float v(float u,float v,float f){float P=v*u;return-P/(f*(u-1.)-P);}layout(std140) uniform ubTransformations{mat4 uWorldMatrix;mat4 uViewMatrix;mat4 uProjectionMatrix;mat4 uNormalMatrix;mat4 uInverseWorldMatrix;mat4 uViewProjectionMatrix;mat4 uInverseViewMatrix;mat4 uInverseProjectionMatrix;mat4 uInverseViewProjectionMatrix;mat4 uTransposeInverseViewMatrix;};layout(std140) uniform ubCamera{vec3 uViewPosition;vec3 uViewDirection;float uNearClip;float uFarClip;float uAspect;float uFov;};uniform sampler2D uDepthTexture;in vec2 vUv;out vec4 outColor;void main(){vec3 x=uViewPosition,f=vec3(0,0,-1);vec2 m=vec2(0);float r=0.;vec3 P=x;for(int i=0;i<100;i++){P=x+f*r;m=dfScene(P);r+=m.x;if(m.x<=1e-4)break;}if(m.x>1e-4)discard;float i=texelFetch(uDepthTexture,ivec2(gl_FragCoord.xy),0).x,p=v(i,uNearClip,uFarClip),s=u((uViewMatrix*vec4(P,1)).z,uNearClip,uFarClip);if(s>=p)discard;outColor=vec4(1);}`;