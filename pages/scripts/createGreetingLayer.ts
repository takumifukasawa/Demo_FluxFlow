// prettier-ignore
const GREETINGS = [
    [
        'Jasper Flick',
        'gam0022',
        'kanetaaaaa',
        'ukonpower',
        'keijiro',
        'iq',
        'i-saint',
        'FMS_Cat',
    ],
    [
        'aa_debdeb',
        'Raku_Phys',
        'gfxfundamentals',
        'mk',
        'mrdoob',
        'tokoik',
        'mebiusbox',
        'infusion',
    ],
    [
        'hikita12312',
        'Jen Lowe',
        'hirasho',
        'Simon Rodriguez',
        'Jorge Jimenez',
        'MatchaChoco010',
        'Patricio Gonzalez Vivo',
        'Shiranui_Isuzu_'
    ],
    [
        'hanecci',
        'Shakemayster',
        'dcerisano',
        'patriciogonzalezvivo',
        'Dave_Hoskins',
        'srtuss',
        'athibaul',
        'thor85',
    ]
];

export function createGreetingLayer() {
    const rootElement = document.createElement('div');
    rootElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        font-size: 24px;
        font-family: sans-serif;
        z-index: 10000;
    `;
    GREETINGS.forEach((blocks) => {
        const blockElement = document.createElement('p');
        blocks.forEach((block, j) => {
            const span = document.createElement('span');
            if (j > 0) {
                span.textContent += ', ';
            }
            span.textContent = block;
            if (j === blocks.length - 1) {
                blockElement.appendChild(document.createElement('br'));
            }
        });
        rootElement.appendChild(blockElement);
    });

    return rootElement;
}
