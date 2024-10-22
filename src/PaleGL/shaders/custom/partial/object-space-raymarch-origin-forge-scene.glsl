// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float d = 1000.;
 
    // 真ん中
    float s = dfSp(opTr(p, uCP), FS);
    
    // 子供を含めたmetaball
    float mb = dfMB(p, s);
    
    return vec2(mb, 0.);
}
