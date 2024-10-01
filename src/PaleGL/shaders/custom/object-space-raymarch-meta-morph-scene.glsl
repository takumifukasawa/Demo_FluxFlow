#define GLOBAL_SIZE 1

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
    q.xz = opRot(q.xz, PI * sin(sin(uTime * 10. + vInstanceId) * cos(uTime * 6. + vInstanceId)) * .3);

    // 全体調整用
    float s = .2;
    float topWing = wing(q, vec3(.4, .2, .24) * s, PI * -.3, vec2(.5, .4) * s);
    float bottomWing = wing(q, vec3(.32, .2, .2) * s, PI * .3, vec2(.4, -.4) * s);

    float d = min(topWing, bottomWing);

    return vec2(d, 0.);
}

vec2 flower(vec3 p) {
    vec2 res = vec2(10000., -10000.);
    
    float gOffsetY = -.8;
    p.y -= gOffsetY;
    
    float aHeight = .28;
    float aOffsetY = aHeight;

    float swayPeriodX = .1;
    swayPeriodX = sin(uTime * 2.4 + .2) * .5;
    float swayPeriodZ = -.1;
    swayPeriodZ = cos(uTime * 2.6 + .1) * -.5;

    float aSwayX = p.y * sin(p.y * swayPeriodX);
    float aSwayZ = p.y * sin(p.y * swayPeriodZ);

    float fOffsetY = aOffsetY * 2.;
    float fSwayOffsetX = sin(fOffsetY * 2. * swayPeriodX) * aOffsetY;
    float fSwayOffsetZ = sin(fOffsetY * 2. * swayPeriodZ) * aOffsetY;
    mat2 fSwayRotXZ = rot(-fOffsetY * 2. * swayPeriodX);
    mat2 fSwayRotYZ = rot(fOffsetY * 2. * swayPeriodZ);

    // 軸 ----------------------------

    vec3 aq = p;

    aq = opTranslate(aq, vec3(aSwayX, aOffsetY, aSwayZ));
    float ad = dfRoundedCylinder(aq, .015, .05, aHeight);

    float matA = 1.;
    res = minMat(res, vec2(ad, matA));

    // 花びら ------------------------

    vec3 fq = p;

    // fq.xz = opRot(fq.xz, iTime);

    fq = opTranslate(fq, vec3(fSwayOffsetX, fOffsetY, fSwayOffsetZ));

    // 上を向かせる
    fq.yz = opRot(fq.yz, PI * .5);
    fq.xz *= fSwayRotXZ;
    fq.yz *= fSwayRotYZ;

    // 枚数分生成
    fq.xy = opFoldRotate(fq.xy, 10.);

    // t.z...自重の影響
    fq = opTranslate(fq, vec3(0., .2, sin(fq.y * 5.) * .105));
    fq.yz = opRot(fq.yz, PI * .5); // 手前に向ける回転

    // fs.x:太さ, f.y:厚み, f.z: 長さ
    vec3 fs = vec3(.08, .2, .2);
    fq = opPreScale(fq, fs);

    float fd = dfRoundedCylinder(fq, .4, .05, .01);

    fd = opPostScale(fd, fs);

    float matF = 2.;
    res = minMat(res, vec2(fd, matF));

    // 中央 --------------------------

    vec3 cq = p;
    cq = opTranslate(cq, vec3(fSwayOffsetX, fOffsetY + .03, fSwayOffsetZ));

    float cd = dfSphere(cq, .04);

    float matC = 3.;
    res = minMat(res, vec2(cd, matC));

    // 合成 --------------------------

    return res;
}

vec2 dfScene(vec3 p) {
    // 全体のスケール調整
    p /= .5;
    
    vec2 butterflyR = butterfly(p);
    vec2 flowerR = flower(p);
   
    float r = sin(uTime * 1.4) * 1.2;
    r = clamp(r, -1., 1.);
    r = r * .5 + .5;
    r = sin(uTime * 1.4) * .5 + .5;

    vec2 sd = mix(flowerR, vec2(length(p) - .5, 0.), r);

    // default
    return sd;
    
    // return vec2(dfBox(p, vec3(.5, .5, .5)), 0.);
    // return vec2(dfCone(p, vec2(.2, .5), 1.), 0.);
}
