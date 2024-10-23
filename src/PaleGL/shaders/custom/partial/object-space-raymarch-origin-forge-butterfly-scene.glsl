// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float cs = dfMBs(p);

    p.yz = opRo(p.yz, 45.);
    vec2 butterflyR = opBu(p / 2., 0.);

    // float d = opTb(morphRate, ds, butterflyR.x, ds);
    float d = mix(cs, butterflyR.x, uOMR);
    return vec2(d, 0.);


    // // 真ん中
    // float s = dfSp(opTr(p, uCP), FS);

    // // 子供を含めたmetaball
    // float mb = dfMB(p, s);
    // 
    // return vec2(mb, 0.);

}
