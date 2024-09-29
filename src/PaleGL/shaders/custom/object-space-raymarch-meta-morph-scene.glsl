// r ... 回転
float wing(vec3 p, vec3 s, float r, vec2 t) {
    p = opTranslate(p, vec3(t.x, t.y, 0.));
    p.xy = opRot(p.xy, r);

    p.yz = opRot(p.yz, PI * .5); // 手前に向ける回転

    p = opPreScale(p, s);

    // p.xy *= rot(PI * r); // 羽の回転
    float d = dfRoundedCylinder(p, 1., .05, .1);

    return opPostScale(d, s);
}

vec2 butterfly(vec3 p) {
    float dist = 0.;
    
    vec3 q = p;

    // 上を向かせる
    q.yz = opRot(q.yz, -PI * .5);

    // パタパタさせる
    q.x = abs(q.x);
    q.xz = opRot(q.xz, PI * sin(sin(uTime * 10.) * cos(uTime * 6.)) * .3);

    // 全体調整用
    float s = .2;
    float topWing = wing(q, vec3(.4, .2, .24) * s, PI * -.3, vec2(.5, .4) * s);
    float bottomWing = wing(q, vec3(.32, .2, .2) * s, PI * .3, vec2(.4, -.4) * s);

    float d = min(topWing, bottomWing);

    return vec2(d, 0.);
}

vec2 dfScene(vec3 p) {
    vec2 butterflyR = butterfly(p);
    return butterflyR;
    
    // return vec2(dfBox(p, vec3(.5, .5, .5)), 0.);
    // return vec2(dfCone(p, vec2(.2, .5), 1.), 0.);
}
