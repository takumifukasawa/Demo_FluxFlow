vec2 dfScene(vec3 p) {
    float ds = dfSp(p, CS);

    vec4 state = vInstanceState;
    float morphRate = state.x;
    float instanceScale = state.z;

    vec2 butterflyR = opBu(p / instanceScale, vInstanceId);

    float d = mix(ds, butterflyR.x, morphRate);
    return vec2(d, 0.);
}
