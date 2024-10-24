vec2 dfScene(vec3 p) {
    vec4 state = vInstanceState;
    float morphRate = state.x;
    float instanceScale = state.z;

    // for debug: check scale
    float ds = dfSp(p, CS);
   
    // float db = dfMe(p, .4);
    float db = dfPr(p, vInstanceId, instanceScale * .5);
    
    // float d = opTb(morphRate, ds, db, ds);
    float d = mix(ds, db, morphRate);
    
    return vec2(d, 0.);
}
