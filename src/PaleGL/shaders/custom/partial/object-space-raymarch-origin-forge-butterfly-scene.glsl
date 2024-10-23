// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float cs = dfMBs(p);

    vec3 q = p;
    q.yz = opRo(q.yz, uORo.x);
    q.xz = opRo(q.xz, uORo.y);
    vec2 butterflyR = opBu(q / 2., 0.);

    // // test
    // float db = dfMB(q, butterflyR.x);
    // float d = mix(cs, db, uOMR);
   
    // default
    float d = mix(cs, butterflyR.x, uOMR);
    
    return vec2(d, 0.);
}
