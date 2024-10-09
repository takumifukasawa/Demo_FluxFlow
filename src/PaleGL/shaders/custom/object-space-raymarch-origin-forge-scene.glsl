vec2 dfScene(vec3 p) {
    float a = length(opTranslate(p, uBPs[0].xyz)) - .75;
    float b = length(opTranslate(p, vec3(-.75, 0., 0.))) - .75;
    return vec2(opSm(a, b, .5), 0.);
}
