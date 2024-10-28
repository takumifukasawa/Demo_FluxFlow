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
        'Shiranui_Isuzu_',
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

const stylesText = `
#g {
position: fixed;
inset: -100px;
display: grid;
color: white;
font-size: 9px;
font-family: sans-serif;
z-index: 10000;
flex-wrap: nowrap;
grid-template-rows: repeat(2, 1fr);
grid-row: 2;
place-content: center;
place-items: center;
text-shadow: 0 0 3px #333;
pointer-events: none;
letter-spacing: 0.1em;
line-height: 1.6em;
text-align: center;
transition: filter 1s ease-out, opacity 1s ease-out;
filter: blur(10px);
opacity: 0;
}
#g.f {
filter: blur(0);
opacity: .7;
}
`;

const ROOT_ELEMENT_ID = 'g';
const ROOT_ANIMATION_CLASS_NAME = 'f';

export function createIngameLayer() {
    const styleElement = document.createElement('style');
    styleElement.innerText = stylesText;
    document.head.appendChild(styleElement);

    const rootElement = document.createElement('div');
    rootElement.id = ROOT_ELEMENT_ID;
    GREETINGS.forEach((blocks) => {
        const blockElement = document.createElement('p');
        blockElement.style.cssText = `width: 140px;`;
        blocks.forEach((block, j) => {
            const span = document.createElement('span');
            if (j > 0) {
                span.textContent += ', ';
            }
            span.textContent = block;
            blockElement.appendChild(span);
            if (j <= blocks.length - 1) {
                blockElement.appendChild(document.createElement('br'));
            }
        });
        rootElement.appendChild(blockElement);
    });

    return {
        rootElement,
        fadeInGreeting: () => {
            if (!rootElement.classList.contains(ROOT_ANIMATION_CLASS_NAME)) {
                rootElement.classList.add(ROOT_ANIMATION_CLASS_NAME);
            }
        },
        fadeOutGreeting: () => {
            if (rootElement.classList.contains(ROOT_ANIMATION_CLASS_NAME)) {
                rootElement.classList.remove(ROOT_ANIMATION_CLASS_NAME);
            }
        },
    };
}
