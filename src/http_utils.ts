type codepoint = number;

type CodePointRange = Array<[codepoint] | [codepoint, codepoint]>;

function _patternFromCodePointRange(range: CodePointRange): string {
  return range.map((part) => {
    if (part.length === 2) {
      return `\\u{${part[0].toString(16)}}-\\u{${part[1].toString(16)}}`;
    } else {
      return `\\u{${part[0].toString(16)}}`;
    }
  }).join("");
}

namespace HttpUtils {
  export const Pattern = {
    /** [ASCII whitespace](https://infra.spec.whatwg.org/#ascii-whitespace) */
    ASCII_WHITESPACE: _patternFromCodePointRange([
      [0x9],
      [0xA],
      [0xC],
      [0xD],
      [0x20],
    ]),

    /** [HTTP quoted-string token code point](https://mimesniff.spec.whatwg.org/#http-quoted-string-token-code-point) */
    HTTP_QUOTED_STRING_TOKEN: _patternFromCodePointRange([
      [0x9],
      [0x20, 0x7E],
      [0x80, 0xFF],
    ]),

    /** [HTTP tab or space](https://fetch.spec.whatwg.org/#http-tab-or-space) */
    HTTP_TAB_OR_SPACE: _patternFromCodePointRange([
      [0x9],
      [0x20],
    ]),

    /** [HTTP token code point](https://mimesniff.spec.whatwg.org/#http-token-code-point) */
    HTTP_TOKEN: _patternFromCodePointRange([
      [0x21],
      [0x23, 0x27],
      [0x2A],
      [0x2B],
      [0x2D],
      [0x2E],
      [0x30, 0x39],
      [0x41, 0x5A],
      [0x5E, 0x60],
      [0x61, 0x7A],
      [0x7C],
      [0x7E],
    ]),

    /** [HTTP whitespace](https://fetch.spec.whatwg.org/#http-whitespace) */
    HTTP_WHITESPACE: _patternFromCodePointRange([
      [0x9],
      [0xA],
      [0xD],
      [0x20],
    ]),
  } as const;

  export type CollectResult = {
    collected: string;
    progression: number;
    following?: boolean;
  };

  /**
   * 文字列の先頭のHTTP quoted stringを取得し返却
   *     仕様は https://fetch.spec.whatwg.org/#collect-an-http-quoted-string
   *
   * - collected: 引用符で括られていた値。引用符とエスケープ文字は取り除いて返す
   * - progression: 取得した文字数。（終了引用符までを含む）
   *                引用符とエスケープ文字を含むのでcollected.lengthとは一致しない
   *
   * @param input 先頭がU+0022の文字列
   * @returns 結果
   */
  export function collectHttpQuotedString(input: string): CollectResult {
    // 2.
    let value = "";

    // 3.
    if (input.startsWith('"') !== true) {
      return {
        collected: value,
        progression: 0,
      };
    }

    // 4.
    const text2 = input.substring(1);

    // 5.
    let escaped = false;
    let i = 0;
    for (i = 0; i < text2.length; i++) {
      const c: string = text2[i] as string;

      if (escaped === true) {
        value = value + c;
        escaped = false;
        continue;
      } else {
        if (c === '"') {
          i++;
          break;
        } else if (c === "\\") {
          escaped = true;
          continue;
        } else {
          value = value + c;
          continue;
        }
      }
    }

    if (escaped === true) {
      value = value + "\\";
    }

    return {
      collected: value,
      progression: (i + 1),
    };
  }
}

Object.freeze(HttpUtils);

export { HttpUtils };
