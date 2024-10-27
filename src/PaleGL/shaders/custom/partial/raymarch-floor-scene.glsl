vec2 dfScene(vec3 p) {
    // // test
    // vec3 q = opRe(p, 4.);
    // float distance = dfSp(q, .25);
    // // float distance = dfRoundBox(p, .25, .01);
    // return vec2(distance, 0.);
    float r = 4.; // repeat

    vec3 q = p;
    
    q = opTr(q, vec3(0., -25., 0.));
    
    vec2 id = OP_ID(p.xz, r);
    float hash = rand(id);
    
    q.xz = OP_RE(q.xz, r);
    
    vec3 s = vec3(.5, 25., .5);
    float d = dfBo(q, s);
    
    return vec2(d, 0.);
   
    // tmp floor
    
    float r = 4.; // repeat
    
    // p.x = abs(p.x);

    vec3 q = p;
    vec2 id = OP_ID(p.xz, r);
    
    q = opTr(q, vec3(0., -30., 0.));
    
    q.xz = OP_RE(q.xz, r);

    float hash = rand(id);

    float sx = hash * .5 - .25;
    float sy = hash * 5. - 2.5;

    vec3 s = vec3(.5, 25. + abs(id.x), .5);
    // vec3 s = vec3(.5, 25., .5);
   
    // q.y += hash * 3.;
   
    return vec2(dfBo(q, s), 0.);
}
