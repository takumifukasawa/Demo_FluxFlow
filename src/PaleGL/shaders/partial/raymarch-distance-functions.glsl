//
// defines
// 

#define PI 3.14
#define PI2 6.28

//
// operators
// TRSをしたいときは基本的に opTrasnalte -> opRoaet -> opPreScale -> distanceFunction -> opPostScale の順でやる 
//

// ref: https://www.shadertoy.com/view/ldlcRf
vec2 minMat(vec2 d1, vec2 d2) {
    return (d1.x < d2.x) ? d1 : d2;
}

mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, s, -s, c);
}

vec3 opRe(vec3 p, float s) {
    return p - s * round(p / s);
}

vec2 opRo(vec2 p, float a) {
    return p * rot(-a);
}

vec3 opTr(vec3 p, vec3 t) {
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
    p = opRo(p, -a);
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

// round box
float dfRb(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r;
}

float dfBo(vec3 p, vec3 b)
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

// buggerfly: wing
// r ... 回転
float opWi(vec3 p, vec3 s, float r, vec2 t) {
    p = opTr(p, vec3(t.x, t.y, 0.));
    p.xy = opRo(p.xy, r);

    p.yz = opRo(p.yz, PI * .5); // 手前に向ける回転

    p = opPreScale(p, s);

    // p.xy *= rot(PI * r); // 羽の回転
    float d = dfRoundedCylinder(p, 1., .05, .1);

    return opPostScale(d, s);
}

// butterfly content
vec2 opBu(vec3 p, float seed) {
    p /= 1.4; // adjust scale
    
    float dist = 0.;

    vec3 q = p;

    // 上を向かせる
    q.yz = opRo(q.yz, -PI * .5);

    // パタパタさせる
    vec2 paSpeed = vec2(10., .6);
    q.x = abs(q.x);
    q.xz = opRo(q.xz, PI * sin(sin(uTimelineTime * paSpeed.x + seed) * cos(uTimelineTime * paSpeed.y + seed)) * .3);

    // 全体調整用
    float s = .2;
    float topWing = opWi(q, vec3(.4, .3, .24) * s, PI * -.3, vec2(.5, .4) * s);
    float bottomWing = opWi(q, vec3(.32, .3, .2) * s, PI * .3, vec2(.4, -.4) * s);

    float d = min(topWing, bottomWing);

    return vec2(d, 0.);
}

// flower
vec2 opFl(vec3 p, float seed) {
    vec2 res = vec2(10000., -10000.);

    p /= 1.; // adjust scale

    float gOffsetY = -.8;
    p.y -= gOffsetY;

    float aHeight = .28;
    float aOffsetY = aHeight;
    
    float swaySpeedX = 1.4;
    float swaySpeedZ = 1.6;

    float swayPeriodX = .1;
    swayPeriodX = sin(uTimelineTime * swaySpeedX + .2 + seed) * .5;
    float swayPeriodZ = -.1;
    swayPeriodZ = cos(uTimelineTime * swaySpeedZ + .1 + seed) * -.5;

    float aSwayX = p.y * sin(p.y * swayPeriodX);
    float aSwayZ = p.y * sin(p.y * swayPeriodZ);

    float fOffsetY = aOffsetY * 2.;
    float fSwayOffsetX = sin(fOffsetY * 2. * swayPeriodX) * aOffsetY;
    float fSwayOffsetZ = sin(fOffsetY * 2. * swayPeriodZ) * aOffsetY;
    mat2 fSwayRotXZ = rot(-fOffsetY * 2. * swayPeriodX);
    mat2 fSwayRotYZ = rot(fOffsetY * 2. * swayPeriodZ);

    // 軸 ----------------------------

    vec3 aq = p;

    aq = opTr(aq, vec3(aSwayX, aOffsetY, aSwayZ));
    float ad = dfRoundedCylinder(aq, .015, .05, aHeight);

    float matA = 1.;
    res = minMat(res, vec2(ad, matA));

    // 花びら ------------------------

    vec3 fq = p;

    // fq.xz = opRo(fq.xz, iTime);

    fq = opTr(fq, vec3(fSwayOffsetX, fOffsetY, fSwayOffsetZ));

    // 上を向かせる
    fq.yz = opRo(fq.yz, PI * .5);
    fq.xz *= fSwayRotXZ;
    fq.yz *= fSwayRotYZ;

    // 枚数分生成
    fq.xy = opFoldRotate(fq.xy, 10.);

    // t.z...自重の影響
    fq = opTr(fq, vec3(0., .2, sin(fq.y * 5.) * .105));
    fq.yz = opRo(fq.yz, PI * .5); // 手前に向ける回転

    // fs.x:太さ, f.y:厚み, f.z: 長さ
    vec3 fs = vec3(.08, .2, .2);
    fq = opPreScale(fq, fs);

    float fd = dfRoundedCylinder(fq, .4, .05, .01);

    fd = opPostScale(fd, fs);

    float matF = 2.;
    res = minMat(res, vec2(fd, matF));

    // 中央 --------------------------

    vec3 cq = p;
    cq = opTr(cq, vec3(fSwayOffsetX, fOffsetY + .03, fSwayOffsetZ));

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

// 距離関数の3段階のblend
float opTb(float x, float A, float B, float C) {
    float AB = mix(A, B, smoothstep(0., .5, x));
    float BC = mix(B, C, smoothstep(.5, 1., x));
    
    return mix(AB, BC, smoothstep(.5, 1., x));
}

//
// CUSTOM
// しょうがないのでここでいろいろ宣言する
//

#define BN 16 // メタボールの数
#define FS 1. // 真ん中のメタボールのサイズ
#define CS .35 // 小さいメタボールのサイズ
#define MS .25 // メタボールのsmooth
uniform vec3 uCP;
uniform vec3 uBPs[BN];
uniform vec3 uGPs[4];
uniform float uGS; // gather scale rate
uniform vec4 uGSs[4]; // gather states [morph rate, state x, state y, ,]
uniform float uOMR; // origin forge morph rate

float diMB(vec3 p) {
    return sin(p.x * 4. + uTimelineTime * 3.4) * .07 +
        cos(p.y * 3. + uTimelineTime * 3.2) * .07 +
        sin(p.z * 3.5 + uTimelineTime * 3.0) * .07;
}

// 真ん中のメタボール
float dfMC(vec3 p) {
    return dfSp(p, FS);
}

// metaball range attenuation
float diMAt(vec3 p) {
    return 1. - smoothstep(1., 1.8, length(p - uCP));
}

// // metaball center sphere
// float dfMS() {
//     return dfSp(opTr(p, uCP), FS);
// }

float dfMB(vec3 p, float d) {
    for(int i = 0; i < BN; i++) {
        float cd = dfSp(opTr(p, uBPs[i].xyz), CS);
        d = opSm(d, cd, MS);
    }

    // #pragma UNROLL_START
    // for(int i = 0; UNROLL_i < 16; UNROLL_i++) {
    //     float cd = dfSp(opTr(p, uBPs[UNROLL_i].xyz), CS);
    //     dd = opSm(dd, cd, .25);
    // }
    // #pragma UNROLL_END


    d += diMB(p) * diMAt(p) * uGS;
    return d;
}

float dfMBs(vec3 p) {
    // 真ん中
    float s = dfSp(opTr(p, uCP), FS * uGS);
    // 子供を含めたmetaball
    float mb = dfMB(p, s);

    // // 真ん中
    // float s = dfSp(opTr(p, uCP), FS);
    // // 子供を含めたmetaball
    // float mb = dfMB(p, s);
    
    return mb;
}

vec2 opMo(vec2 d1, vec2 d2, float rate) {
    return mix(d1, d2, rate);
}

vec2 dfMm(vec3 p, float d, float s) {
    vec3 a = mod(p * s, 2.) - 1.;
    s *= 3.;
    vec3 r = abs(1. - 3. * abs(a));
    float da = max(r.x, r.y);
    float db = max(r.y, r.z);
    float dc = max(r.z, r.x);
    float c = (min(da, min(db, dc)) - 1.) / s;
    return vec2(max(d, c), s);
}

float dfMe(vec3 p) {
    p /= .5;
    float d = dfBo(p, vec3(1.));
    float s = 1.;
    vec2 rd = vec2(d, s);
    rd = dfMm(p, rd.x, rd.y);
    rd = dfMm(p, rd.x, rd.y);
    rd = dfMm(p, rd.x, rd.y);
    return rd.x;
}
