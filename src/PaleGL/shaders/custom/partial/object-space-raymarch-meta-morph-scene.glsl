vec2 dfScene(vec3 p) {
    // 全体のスケール調整
    p /= .5;
    
    vec2 butterflyR = opBu(p, vInstanceId);
    vec2 flowerR = opFl(p);
   
    float r = sin(uTime * 1.4) * 1.2;
    r = clamp(r, -1., 1.);
    r = r * .5 + .5;
    r = sin(uTime * 1.4) * .5 + .5;

    vec2 sd = mix(flowerR, vec2(length(p) - .5, 0.), r);

    // default
    return sd;

    // return vec2(dfBox(p, vec3(.5, .5, .5)), 0.);
    // return vec2(dfCone(p, vec2(.2, .5), 1.), 0.);
}
