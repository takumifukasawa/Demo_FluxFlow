#version 300 es

precision highp float;

// TODO: ここ動的に構築してもいい
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec4 aVelocity; // [nx, ny, nz, length]
layout(location = 2) in vec4 aAttractTargetPosition; // [x,y,z, attractAmplitude]
layout(location = 3) in vec4 aState;// [seed, attractType, morphRate, attractPower]

#include ../../partial/common.glsl

#include ../../partial/uniform-block-common.glsl
#include ../../partial/uniform-block-timeline.glsl

out vec3 vPosition;
// out mat4 vTransform;
out vec4 vVelocity;

// uniform vec3 aAttractTargetPosition;

uniform float uAttractBasePower;
uniform float uAttractMinPower;

// v minmag
#define VMM .0001

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

    vec3 currentVelocity = unpackVelocity(aVelocity);
    vec3 velocity = currentVelocity;
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
        float hash = rand(seed);
        target += vec3(
            cos((uTimelineTime + hash * 100. + seed.x)) * (2. + hash * 1.),
            sin((uTimelineTime - hash * 400. + seed.x)) * (2. + hash * 1.),
            cos((uTimelineTime - hash * 300. + seed.x)) * (2. + hash * 1.)
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
        float attractDelayValue = hash * .5;
        vec3 v = diffP
            * uTimelineDeltaTime
            * max(max(attractPower - attractDelayValue, 0.), uAttractMinPower) * uAttractBasePower;
        velocity = diffDir * max(length(v), .003); // fallback. ちょっとだけ動かすと回転バグらない
        
        // // TEST: lerpする場合
        // float r = min(uTimelineDeltaTime * 10., 1.);
        // // velocity = mix(currentVelocity, velocity, r * saturate(uAttractBasePower)); // 速度制限
        // float s = step(.0001, uTimelineDeltaTime);
        // velocity = mix(
        //     currentVelocity * s,
        //     velocity,
        //     r * s
        // ); // 速度制限
        // // velocity = diffDir * max(length(v), .003); // fallback. ちょっとだけ動かすと回転バグらない

        // attract: 簡易版_等速
        // velocity = diffDir * uDeltaTime;
        // velocity = diffDir * uDeltaTime * pow(length(diffP), .1);
        // velocity = diffDir * uDeltaTime * attractPower;

        // pack
        vVelocity = packVelocity(velocity.xyz);
    }
}
