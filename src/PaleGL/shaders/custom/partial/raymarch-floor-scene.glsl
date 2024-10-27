vec2 dfScene(vec3 p) {
    vec3 q = p;
  
    float r = 4.; // repeat
    
    q = opTr(q, vec3(0., -25., 0.));
    
    q.xz = OP_RE(q.xz, r);

    vec2 id = OP_ID(p.xz, r);
    float hash = rand(id);

    float y = sin(hash * 100.) * 10. + 10.;

    vec3 s = vec3(.5, 25. - hash * .5, .5);
   
    return vec2(dfBo(q, s), 0.);
}
