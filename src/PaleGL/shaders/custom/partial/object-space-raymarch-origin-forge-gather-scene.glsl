// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float d = 0.;

    float s = 1.5; // 蝶のスケール
    vec3 q = p / s;

    vec3 q1 = opTr(q, uGPs[0]);
    vec3 q2 = opTr(q, uGPs[1]);
   
    q1.xz = opRo(q1.xz, 45.);
    
    float db1 = mix(opBu(q1, 0.).x, dfSp(q1, CS), .2);
    float db2 = mix(opBu(q2, 0.).x, dfSp(q2, CS), .2);
    
    float cs = dfSp(opTr(p, uCP), FS);
    cs += diMB(p) * diMAt(p);
    // float cpf = dfSp(p, uBPs[0].xyz) * diAT(p);
    // cp += cpf;
   
    float d = min(db1, db2);
    
    d = opSm(cs, d, .25);
    
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
