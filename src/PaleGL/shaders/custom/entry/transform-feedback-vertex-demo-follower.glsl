#version 300 es

precision highp float;

// TODO: ここ動的に構築してもいい
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec4 aVelocity; // [nx, ny, nz, length]
layout(location = 2) in vec4 aAttractTargetPosition; // [x,y,z, attractAmplitude]
layout(location = 3) in vec4 aState;// [seed, attractType, morphRate, attractPower]

#include ../../partial/uniform-block-common.glsl
#include ../../partial/uniform-block-timeline.glsl

out vec3 vPosition;
// out mat4 vTransform;
out vec4 vVelocity;

// uniform vec3 aAttractTargetPosition;

uniform float uAttractPower;

// v minmag
#define VMM .0001

// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float noise(vec2 seed)
{
    return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 unpackVelocity(vec4 v) {
    return v.xyz * max(v.w, VMM);
}

vec4 packVelocity(vec3 v) {
    float mag = max(length(v), VMM);
    if(mag <= VMM) {
        return vec4(0., 0., 1., mag);
    } else {
        return vec4(normalize(v.xyz), mag);
    }
}

void main() {
    // stateを分割
    float rawSeed = aState.x;
    // 0: none
    // 1: jump
    // 2: attract
    float attractType = aState.y;
    float morphRate = aState.z;
    float attractPower = aState.w;
    
    vec3 attractTargetPosition = aAttractTargetPosition.xyz;
    float attractAmplitude = aAttractTargetPosition.w;
    
    // // for debug
    // vPosition = aPosition;
    // return;
   
    vec3 velocity = unpackVelocity(aVelocity);
    float mag = length(velocity);
    
    if(attractType < .5) {
        vPosition = aPosition;
        vVelocity = vec4(0., 0., 1., mag);
        return;
    }

    if (.5 < attractType && attractType < 1.5) {
    // 座標にすぐ移動する場合
        vPosition = aAttractTargetPosition.xyz;
        vVelocity = vec4(0., 0., 1., mag);
        return;
    }
    
    if(1.5 < attractType && attractType < 2.5) {
        vPosition = aPosition + velocity;

        // vec3 target = uAttractTargetPosition;
        vec3 target = aAttractTargetPosition.xyz;

        // // fuwafuwa
        vec2 seed = vec2(rawSeed, rawSeed);
        float rand = noise(seed);
        target += vec3(
            cos((uTimelineTime + rand * 100. + seed.x)) * (2. + rand * 1.),
            sin((uTimelineTime - rand * 400. + seed.x)) * (2. + rand * 1.),
            cos((uTimelineTime - rand * 300. + seed.x)) * (2. + rand * 1.)
        ) * attractAmplitude;

        vec3 diffP = target - vPosition;
        vec3 diffDir = normalize(diffP);
        
        if(length(diffP) < .003) {
            // vVelocity = vec4(0., 0., 1., 0.);
            vVelocity = vec4(normalize(diffDir), 0.);
            return;
        }

        // vec3 acc = diffDir * .01;
        // vec3 newP = target + diffP * .1;
        // vec3 vVelocity = newP - vPosition;

        // // なにかをattractする場合
        // velocity = mix(
        //     velocity,
        //     mix(
        //         velocity,
        //         diffDir * (.1 + morphRate * .1),
        //         .03 + sin(uTime * .2 + rand * 100.) * .02
        //     ),
        //     morphRate
        //     // step(.5, attractEnabled)
        // );
        
        // attract: 簡易版
        // velocity = mix(
        //     velocity,
        //     diffDir * 2.,
        //     uDeltaTime
        // );
        float attractDelayValue = noise(seed) * .5;
        float baseAttractPower = 2.;
        float attractMinPower = .2;
        // velocity = diffP * uDeltaTime * attractPower * baseAttractPower;
        vec3 v = diffP
            * uTimelineDeltaTime
            * max(max(attractPower - attractDelayValue, 0.), attractMinPower) * baseAttractPower;
        velocity = diffDir * max(length(v), .003); // fallback. ちょっとだけ動かすと回転バグらない

        // attract: 簡易版_等速
        // velocity = diffDir * uDeltaTime;
        // velocity = diffDir * uDeltaTime * pow(length(diffP), .1);
        // velocity = diffDir * uDeltaTime * attractPower;

        // pack
        vVelocity = packVelocity(velocity.xyz);
    }
}
