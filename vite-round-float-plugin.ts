import { Plugin } from 'vite';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/ban-ts-comment,@typescript-eslint/no-unsafe-assignment */

// @ts-ignore
// typeof _traverse === "function" ? traverse : traverse.default;

// @ts-ignore
// typeof _generate === "function" ? generate : generate.default;

const PRECISION: number = 2;

// type obj = { [k: string]: unknown };

// // JSON内のデータを再帰的に処理してfloatを丸める関数
// function roundFloatInJson(data: unknown, precision: number): unknown {
//     console.log(`[roundFloatPlugin -> roundFloatInJson] type: ${typeof data}, data: ${data}`);
//     // オブジェクトの場合
//     if (typeof data === 'object' && data !== null) {
//         if (Array.isArray(data)) {
//             // 配列の場合
//             return data.map((item) => roundFloatInJson(item, precision));
//         } else {
//             const dataObj = data as unknown as obj;
//             // オブジェクトの場合
//             const roundedObject: obj = {};
//             for (const key in dataObj) {
//                 if (Object.prototype.hasOwnProperty.call(dataObj, key)) {
//                     // if (dataObj.hasOwnProperty(key)) {
//                     // if (dataObj.hasOwnProperty(key)) {
//                     roundedObject[key] = roundFloatInJson(dataObj[key], precision);
//                     // }
//                 }
//                 return roundedObject;
//             }
//         }
//
//         // 数値がfloatの場合、指定した精度に丸める
//         if (typeof data === 'number' && data % 1 !== 0) {
//             return parseFloat((data as number).toFixed(precision));
//         }
//
//         // その他のデータ型はそのまま返す
//         return data;
//     }
// }

// Babelを使ってASTを操作する関数
function processAst(ast: t.File, precision: number) {
    // @ts-ignore
    traverse.default(ast, {
        NumericLiteral(path: unknown) {
            // @ts-ignore
            const value = path.node.value as unknown as number;
            if (value % 1 !== 0) {
                // @ts-ignore
                path.node.value = parseFloat(value.toFixed(precision));
            }
        },
    });
}

// Viteプラグインの定義
export const roundFloatPlugin: () => Plugin = () => {
    return {
        name: 'vite-plugin-round-float', // プラグイン名
        transform(code, id) {
            // 拡張子が`.json`の場合に処理
            if (id.endsWith('.json')) {
                console.log(`[roundFloatPlugin] id: ${id}`);
                const ast = parse(code, {
                    sourceType: 'module',
                    plugins: ['typescript'],
                });

                processAst(ast, PRECISION);

                // @ts-ignore
                const { code: transfsormedCode } = generate.default(ast, {}, code);
                
                return {
                    code: transfsormedCode,
                    map: null,
                };

                // const jsonData = JSON.parse(code) as unknown;
                // const roundedData = roundFloatInJson(jsonData, PRECISION);
                // return {
                //     code: JSON.stringify(roundedData, null, 2), // 丸めた結果を返す
                //     map: null,
                // };
            }
        },
    };
};
