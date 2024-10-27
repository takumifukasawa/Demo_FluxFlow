vec2 dfScene(vec3 p) {
    vec3 q = p;
  
    float r = 4.; // repeat
    // float wr = r / 50.;
    
    // q = opTr(q, vec3(0., 25., 0.));

    vec3 id = OP_ID(q, r);
    float hash = rand(vec2(id.xz));
    q.xz = OP_RE(q.xz, r);
    q = opLiRe(p, r, vec3(2.));
    
    float y = sin(hash * 100.) * 5. + 5.;

    // q = opTr(q, vec3(0., -5., 0.));
    vec3 s = vec3(.5, 25., .5);
    q = opTr(q, vec3(0., -y, 0.));
   
    return vec2(dfBo(q, s), 0.);
}
