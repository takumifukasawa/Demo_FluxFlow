vec2 dfScene(vec3 p) {
    vec3 q = p;
  
    float r = 4.; // repeat
    // float wr = r / 50.;
    
    // q = opTr(q, vec3(0., 25., 0.));

    vec3 id = OP_ID(q, r);
    float hash = rand(vec2(id.x, 0.));
    q.x = OP_RE(q.x, r);
    
    float y = sin(hash * 100.) * 5. + 5.;

    // q = opTr(q, vec3(0., -5., 0.));
    vec3 s = vec3(.5, 25., .5);
    if(id.x < 0. || 0. < id.x) {
        s = vec3(.2, 25., .2);
    }
   
    return vec2(dfBo(q, s), 0.);
}
