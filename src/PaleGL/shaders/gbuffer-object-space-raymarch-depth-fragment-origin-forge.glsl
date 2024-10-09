#include ./layout-gbuffer-object-space-raymarch-depth-fragment.glsl

#pragma BLOCK_BEFORE_RAYMARCH_CONTENT_START
#include ./custom/object-space-raymarch-origin-forge-uniforms.glsl
#pragma BLOCK_BEFORE_RAYMARCH_CONTENT_END

#pragma BLOCK_RAYMARCH_SCENE_START
#include ./custom/object-space-raymarch-origin-forge-scene.glsl 
#pragma BLOCK_RAYMARCH_SCENE_END
