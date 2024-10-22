// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float d = 0.;

    float s = 1.5; // 蝶のスケール
    vec3 q = p / s;

    vec3 q1 = opTr(q, uGPs[0]);
    vec3 q2 = opTr(q, uGPs[1]);
    vec3 q3 = opTr(q, uGPs[2]);
    vec3 q4 = opTr(q, uGPs[3]);
   
    q1.xz = opRo(q1.xz, 45.);
    
    float db1 = mix(opBu(q1, 0.).x, dfSp(q1, CS), uGM);
    float db2 = mix(opBu(q2, 0.).x, dfSp(q2, CS), uGM);
    float db3 = mix(opBu(q3, 0.).x, dfSp(q3, CS), uGM);
    float db4 = mix(opBu(q4, 0.).x, dfSp(q4, CS), uGM);

    float cs = dfSp(opTr(p, uCP), FS * uGS);
    cs += diMB(p) * diMAt(p) * uGS;
    // cs += diMB(p);
   
    float gd = min(min(min(db1, db2), db3), db4);
    
    float d = opSm(cs, gd, MS);
    
    return vec2(d, 0.);
    
    // vec2 b0 = opBu(opTr(p, vec3(-1., 0., 0.), 0.));

    // vec3 q = p / 4.;

    // p = opTr(p, vec3(0., 0., 0.));

    // // 真ん中
    // float s = dfSp(opTr(p, uCP), FS);
    // 
    // // 子供を含めたmetaball
    // s = dfMB(p, s);
    // 
    // d = mix(s, butterflyR.x, 1.);
    // 
    // return vec2(d, 0.);
}
