vec2 dfScene(vec3 p) {
    float ds = dfSp(p, CS);

    float morphRate = vInstanceState.x;
    // float delayRate = vInstanceState.y;

    vec2 flowerR = opFl(p, vInstanceId);
    
    float d = mix(ds, flowerR.x, morphRate);
    return vec2(d, 0.);
}
