// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float d = 0.;

    vec3 q = p / .5;

    vec2 butterflyR = opButterfly(q, 0.);

    p = opTranslate(p, vec3(0., 0., 0.));
    
    float s = dfSp(opTranslate(p, uCP), FS);
    s = dfMB(p, s);
    
    d = mix(s, butterflyR.x, 0.);
    
    return vec2(s, 0.);
}
