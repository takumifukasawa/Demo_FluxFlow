import { Plugin } from 'vite';
import * as path from 'path';
import { writeFileAsync } from './node-libs/file-io.ts';
import { wait } from './node-libs/wait.ts';

function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .split('-')
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('');
}

async function writeTemplateFileAndExtractScene(templateName: string, rawSrc: string): Promise<string> {
    console.log('===================================');
    console.log('[transformExtractGlslRaymarchTemplate.writeTemplateFileAndExtractScene]', templateName);
    const streamSrcRegex = /export\s+default\s+`([^`]+)`/;
    const streamSrcMatch = rawSrc.match(streamSrcRegex);
    if (!streamSrcMatch) {
        console.log('streamSrcMatch is null');
        console.log('===================================');
        return rawSrc;
    }

    const [, src] = streamSrcMatch;

    const basePath = './src/PaleGL/shaders/templates';
    const templatesDirPath = path.join(basePath);
    const templateFilePath = path.join(templatesDirPath, `${templateName}-template.ts`);
    const raymarchContentRegex = /(vec2 dfScene\(.*?\)\{.*?;\})/;
    const raymarchContentRegexMatch = src.match(raymarchContentRegex);
    if (!raymarchContentRegexMatch) {
        console.log('raymarchContentRegexMatch is null');
        console.log('===================================');
        return rawSrc;
    }
    const [, raymarchBody] = raymarchContentRegexMatch;
    const templateShader = src.replace(raymarchBody, '\n#pragma RAYMARCH_SCENE\n');
    const variableName = `${toCamelCase(templateName)}Template`;
    const templateContent = `export const ${variableName} = \`${templateShader}\`;`;
    console.log('templateName, variableName: ', templateName, variableName);
    // console.log('raymarchBody: ', raymarchBody);
    // console.log('templateContent: ', templateContent);
    console.log('templateFilePath: ', templateFilePath);
    console.log('===================================');
    await writeFileAsync(templateFilePath, templateContent);
    await wait(100);
    return `export default \`${raymarchBody}\``;
}

export const transformExtractGlslRaymarchTemplate: () => Plugin = () => {
    return {
        name: 'extract-glsl-layout',
        enforce: 'pre',
        // eslint-disable-next-line @typescript-eslint/require-await
        async transform(src: string, id: string) {
            const gBufferDepthFileRegex = /^.*(gbuffer-object-space-raymarch-depth-fragment)-.*\.glsl$/;
            const litFileRegex = /^.*(lit-object-space-raymarch-fragment)-.*\.glsl$/;

            const gBufferDepthFileNameMatch = id.match(gBufferDepthFileRegex);
            const litFileNameMatch = id.match(litFileRegex);

            if (gBufferDepthFileNameMatch) {
                const [, templateName] = gBufferDepthFileNameMatch;
                const extractedSrc = await writeTemplateFileAndExtractScene(templateName, src);
                return extractedSrc;
            }
            if (litFileNameMatch) {
                const [, templateName] = litFileNameMatch;
                const extractedSrc = await writeTemplateFileAndExtractScene(templateName, src);
                return extractedSrc;
            }
            return src;
        },
    };
};
