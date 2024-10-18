//
// defines
// 

#define PI 3.14
#define PI2 6.28

//
// operators
// TRSをしたいときは基本的に opTrasnalte -> opRotaet -> opPreScale -> distanceFunction -> opPostScale の順でやる 
//

// ref: https://www.shadertoy.com/view/ldlcRf
vec2 minMat(vec2 d1, vec2 d2) {
    return (d1.x < d2.x) ? d1 : d2;
}

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

vec3 opRepeat(vec3 p, float s) {
    return p - s * round(p / s);
}

vec2 opRot(vec2 p, float a) {
    return p * rot(-a);
}

vec3 opTranslate(vec3 p, vec3 t) {
    return p - t;
}

// NOTE: sが1以下だとおかしくなることに注意
vec3 opScale(vec3 p, vec3 s) {
    return p * (1. / s);
}

vec3 opPreScale(vec3 p, vec3 s) {
    return p / s;
}

float opPostScale(float d, vec3 s) {
    return d * min(s.x, min(s.y, s.z));
}

vec2 opFoldRotate(in vec2 p, float s) {
    float a = PI / s - atan(p.x, p.y);
    float n = PI * 2. / s;
    a = floor(a / n) * n;
    p = opRot(p, -a);
    return p;
}

float opSm( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );
    return mix( d2, d1, h ) - k*h*(1.0-h);
}

//
// distance functions
//

// radius ... 半径
float dfSp(vec3 p, float radius) {
    return length(p) - radius;
}

float dfRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}

float dfBox(vec3 p, vec3 b)
{
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float dfTo(vec3 p, vec2 t)
{
    vec2 q = vec2(length(p.xz)-t.x,p.y);
    return length(q)-t.y;
}

// ra: 太さ
// rb: R
// h: 高さ
float dfRoundedCylinder(vec3 p, float ra, float rb, float h)
{
    vec2 d = vec2(length(p.xz)-2.0*ra+rb, abs(p.y) - h);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb;
}

float dfCone(vec3 p, vec2 c, float h)
{
    // c is the sin/cos of the angle, h is height
    // Alternatively pass q instead of (c,h),
    // which is the point at the base in 2D
    vec2 q = h*vec2(c.x/c.y, -1.0);

    vec2 w = vec2(length(p.xz), p.y);
    vec2 a = w - q*clamp(dot(w, q)/dot(q, q), 0.0, 1.0);
    vec2 b = w - q*vec2(clamp(w.x/q.x, 0.0, 1.0), 1.0);
    float k = sign(q.y);
    float d = min(dot(a, a), dot(b, b));
    float s = max(k*(w.x*q.y-w.y*q.x), k*(w.y-q.y));
    return sqrt(d)*sign(s);
}

// ---------------------------------------------------------------
// custom
// ---------------------------------------------------------------

// r ... 回転
float opWing(vec3 p, vec3 s, float r, vec2 t) {
    p = opTranslate(p, vec3(t.x, t.y, 0.));
    p.xy = opRot(p.xy, r);

    p.yz = opRot(p.yz, PI * .5); // 手前に向ける回転

    p = opPreScale(p, s);

    // p.xy *= rot(PI * r); // 羽の回転
    float d = dfRoundedCylinder(p, 1., .05, .1);

    return opPostScale(d, s);
}

vec2 opButterfly(vec3 p, float seed) {
    float dist = 0.;

    vec3 q = p;

    // 上を向かせる
    q.yz = opRot(q.yz, -PI * .5);

    // パタパタさせる
    q.x = abs(q.x);
    q.xz = opRot(q.xz, PI * sin(sin(uTime * 10. + seed) * cos(uTime * 6. + seed)) * .3);

    // 全体調整用
    float s = .2;
    float topWing = opWing(q, vec3(.4, .2, .24) * s, PI * -.3, vec2(.5, .4) * s);
    float bottomWing = opWing(q, vec3(.32, .2, .2) * s, PI * .3, vec2(.4, -.4) * s);

    float d = min(topWing, bottomWing);

    return vec2(d, 0.);
}

vec2 opFlower(vec3 p) {
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

    float cd = dfSp(cq, .04);

    float matC = 3.;
    res = minMat(res, vec2(cd, matC));

    // 合成 --------------------------

    return res;
}

// 距離関数の5段階のblend
float opDb(float x, float A, float B, float C, float D, float E) {
    float AB = mix(A, B, smoothstep(0., .25, x));
    float BC = mix(B, C, smoothstep(.25, .5, x));
    float CD = mix(C, D, smoothstep(.5, .75, x));
    float DE = mix(D, E, smoothstep(.75, 1., x));
    
    float ABC = mix(AB, BC, smoothstep(.25, .5, x));
    float CDE = mix(CD, DE, smoothstep(.5, .75, x));

    return mix(ABC, CDE, smoothstep(.5, 1., x));
}

//
// CUSTOM
// しょうがないのでここでいろいろ宣言する
//

#define BN 16
#define FS 1.
#define CS .35
uniform vec3 uCP;
uniform vec3 uBPs[BN];
float dfMB(vec3 p, float d) {
    for(int i = 0; i < BN; i++) {
        float cd = dfSp(opTranslate(p, uBPs[i].xyz), CS);
        d = opSm(d, cd, .25);
    }
    float ads = 1. - smoothstep(1., 1.8, length(p - uCP));
    
    float di =
        sin(p.x * 4. + uTime * 3.4) * .1 +
        sin(p.y * 3. + uTime * 3.2) * .1 +
        sin(p.z * 3.5 + uTime * 3.0) * .1;
    
    d += di * ads;
    return d;
}

vec2 opMo(vec2 d1, vec2 d2, float rate) {
    return mix(d1, d2, rate);
}
