// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float d = 0.;

    // for debug
    // return vec2(dfSp(p, 1.), 0.);
    
    vec4 state1 = uGSs[0];
    vec4 state2 = uGSs[1];
    vec4 state3 = uGSs[2];
    vec4 state4 = uGSs[3];

    float s = 1.; // 蝶のスケール
    vec3 q = p / s;

    vec3 q1 = opTr(q, uGPs[0]);
    vec3 q2 = opTr(q, uGPs[1]);
    vec3 q3 = opTr(q, uGPs[2]);
    vec3 q4 = opTr(q, uGPs[3]);
   
    q1.xz = opRo(q1.xz, state1.z);
    q2.xz = opRo(q2.xz, state2.z);
    q3.xz = opRo(q3.xz, state3.z);
    q4.xz = opRo(q4.xz, state4.z);
    
    float db1 = mix(dfSp(q1, CS), opBu(q1, 0.).x, state1.x);
    float db2 = mix(dfSp(q2, CS), opBu(q2, 0.).x, state2.x);
    float db3 = mix(dfSp(q3, CS), opBu(q3, 0.).x, state3.x);
    float db4 = mix(dfSp(q4, CS), opBu(q4, 0.).x, state4.x);

    float cs = dfMBs(p);
   
    float gd = min(min(min(db1, db2), db3), db4);
    
    float d = opSm(cs, gd, MS);

    return vec2(d, 0.);
}
