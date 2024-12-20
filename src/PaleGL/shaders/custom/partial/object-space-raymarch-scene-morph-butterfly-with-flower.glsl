vec2 dfScene(vec3 p) {
    // for debug: check scale
    float ds = dfSp(p, CS);
    // return vec2(ds, 0.);
    
    float morphRate = vInstanceState.x;
    float delayRate = vInstanceState.y;

    p *= 1.; // adjust scale
    vec2 butterflyR = opBu(p, vInstanceId);
    vec2 flowerR = opFl(p);
    
    float d = opDb(0., ds, butterflyR.x, ds, flowerR.x, ds);
    return vec2(d, 0.);

    // // 全体のスケール調整
    // 
    // p /= .5;
    // vec2 butterflyR = opButterfly(p, vInstanceId);
    // vec2 flowerR = opFlower(p);


    // // vec2 sd = mix(vec2(length(p) - CS, 0.), flowerR, vInstanceState.x);
    // vec2 sd = mix(vec2(length(p) - CS, 0.), flowerR, 0.);
    // return sd;

    // // float r = sin(uTime * 1.4) * 1.2;
    // // r = clamp(r, -1., 1.);
    // // r = r * .5 + .5;
    // // r = sin(uTime * 1.4) * .5 + .5;

    // // // vec2 sd = mix(flowerR, vec2(length(p) - .5, 0.), r);
    // // vec2 sd = mix(flowerR, vec2(length(p) - .5, 0.), 0.);

    // // // return vec2(dfBox(p, vec3(.5, .5, .5)), 0.);
    // // // return vec2(dfCone(p, vec2(.2, .5), 1.), 0.);
}
