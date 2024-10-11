// TODO: ここでuniformとか宣言したい

vec2 dfScene(vec3 p) {
    float d = 0.;
    d = dfSp(opTranslate(p, uCP), 1.);
    d = dfMB(p, d);
    return vec2(d, 0.);
}
