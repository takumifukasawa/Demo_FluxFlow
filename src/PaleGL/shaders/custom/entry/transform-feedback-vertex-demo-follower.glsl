#version 300 es

precision highp float;

// TODO: ここ動的に構築してもいい
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aVelocity;
layout(location = 2) in vec3 aAttractTargetPosition;
layout(location = 3) in vec4 aState; // [seed, attractEnabled, morphRate]

#include ../../partial/uniform-block-common.glsl

out vec3 vPosition;
// out mat4 vTransform;
out vec3 vVelocity;

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float noise(vec2 seed)
{
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // stateを分割
    float seed = aState.x;
    float attractEnabled = aState.y;
    float morphRate = aState.z;
   
    vPosition = aPosition + aVelocity;
    
    // vec3 target = uAttractTargetPosition;
    vec3 target = aAttractTargetPosition;
    
    vec2 seed = vec2(seed, seed);
    float rand = noise(seed);
    target += vec3(
        cos(uTime + rand * 100. + seed.x) * (2. + rand * 1.),
        sin(uTime - rand * 400. + seed.x) * (1. + rand * 1.) + 1.,
        cos(uTime - rand * 300. + seed.x) * (2. + rand * 1.)
    );
    vec3 diffP = target - vPosition;
    vec3 diffDir = normalize(diffP);
    
    // vec3 acc = diffDir * .01;
    // vec3 newP = target + diffP * .1;
    // vec3 vVelocity = newP - vPosition;
    
    // // なにかをattractする場合
    // vVelocity = mix(
    //     aVelocity,
    //     mix(
    //         aVelocity,
    //         diffDir * (.1 + uAttractRate * .1),
    //         .03 + sin(uTime * .2 + rand * 100.) * .02
    //     ),
    //     1.
    //     // step(.5, attractEnabled)
    // );

    // attract: 簡易版
    vVelocity = diffP * uDeltaTime;
    vVelocity = vec3(0.);
}
