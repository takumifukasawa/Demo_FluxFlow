import { Component, createComponent } from '@/PaleGL/core/Component.ts';
import { Color } from '@/PaleGL/math/Color.ts';
import { Material } from '@/PaleGL/materials/Material.ts';
import { UniformNames } from '@/PaleGL/constants.ts';

type GbufferMaterialBinder = Component;

// timeline から操作される
export function createGBufferMaterialBinder(material: Material): GbufferMaterialBinder {
    const emissiveColor = new Color();

    return {
        ...createComponent({
            onUpdateCallback: () => {
                material.uniforms.setValue(UniformNames.EmissiveColor, emissiveColor);
            },
            onProcessPropertyBinder: (key, value) => {
                switch (key) {
                    // TODO: not shorten property
                    case 'ec.r':
                        emissiveColor.r = value;
                        break;
                    case 'ec.g':
                        emissiveColor.g = value;
                        break;
                    case 'ec.b':
                        emissiveColor.b = value;
                        break;
                    case 'ec.a':
                        emissiveColor.a = value;
                        break;
                }
            },
        }),
    };
}
