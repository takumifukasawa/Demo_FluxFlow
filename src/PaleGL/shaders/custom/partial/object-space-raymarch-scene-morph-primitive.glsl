vec2 dfScene(vec3 p) {
    float morphRate = vInstanceState.x;

    // for debug: check scale
    float ds = dfSp(p, CS);
   
    float db = dfMe(p);
    
    float d = opTb(morphRate, ds, db, ds);
    return vec2(d, 0.);
}
