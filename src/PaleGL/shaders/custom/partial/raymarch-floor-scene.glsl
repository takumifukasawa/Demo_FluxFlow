vec2 dfScene(vec3 p) {
    // // test
    // vec3 q = opRe(p, 4.);
    // float distance = dfSp(q, .25);
    // // float distance = dfRoundBox(p, .25, .01);
    // return vec2(distance, 0.);
   
    // //
    // // s-s cheap repeat floor
    // //
    // 
    // float r = 10.; // repeat

    // vec3 q1 = p;
    // 
    // q1 = opTr(q1, vec3(0., -30., 0.));
    // 
    // vec2 id = OP_ID(p.xz, r);
    // float hash = rand(id);
    // 
    // q1.xz = OP_RE(q1.xz, r);
    // 
    // vec3 s = vec3(3., 25., 3.);
    // float d1 = dfBo(q1, s);
 
    // //
    // // single ground
    // //
    // 
    // vec3 q2 = p;
    // q2 = opTr(q2, vec3(0., -30., 0.));
    // vec3 s2 = vec3(100., 30., 100.);
    // float d2 = dfBo(q2, s2);
   
    // //
    // // blend
    // //
    // 
    // float d = mix(d1, d2, 0.);
    // 
    // return vec2(d, 0.);
   
    // o-s floor
    
    // single floor distance
    vec3 q1 = p;
    q1 = opTr(q1, vec3(0., -50., 0.));
    // single floor scale
    vec3 sf = vec3(10., 48., 10.);
    float d1 = dfBo(q1, sf);
    
    // repeat floor
    float r = 6.; // repeat
    vec3 q2 = p;
    vec3 id2 = OP_ID(p, r);
    q2 = opTr(q2, vec3(0., -50., 0.));
    q2.xz = OP_RE(q2.xz, r);
    float hash = rand(id2.xz);
    // q = OP_LI_RE(q, r, vec3(2., 2., 2.));
    vec3 s = vec3(1.5, 44., 1.5);
    float d2 = dfBo(q2, s);
    // float di =
    //     sin(p.x * 1. + uTimelineTime * 3.6) * .1 +
    //     cos(p.y * 1.2 + uTimelineTime * 3.2) * .1 +
    //     sin(p.z * 1.4 + uTimelineTime * 3.0) * .1;
    // 
    
    // static floor
    vec3 q3 = p;
    q3 = opTr(q3, vec3(0., -50., 0.));
    // single floor scale
    vec3 sf = vec3(1000., 48, 1000.);
    float d3 = dfBo(q3, sf);

    float d = opTb(uMR, d1, d2, d3);
    
    return vec2(d, 0.);
}
