import { CodePoint, StringEx } from "../deps.ts";

type CodePointRange = Array<[CodePoint] | [CodePoint, CodePoint]>;

/**
 * @internal
 */
function _patternFromCodePointRange(range: CodePointRange): string {
  const pattern = range.map((part) => {
    if (part.length === 2) {
      return `\\u{${part[0].toString(16)}}-\\u{${part[1].toString(16)}}`;
    } else {
      return `\\u{${part[0].toString(16)}}`;
    }
  }).join("");
  return "[" + pattern + "]+";
}

export namespace HttpUtils {
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

  /**
   * Headers#getで取得した値を分割する
   * （複数ヘッダーだった場合、","で連結されているので分割する）
   *
   * かつてはHeaders#getAllすれば良かったが、それは廃止されたので。
   *
   * {@link https://fetch.spec.whatwg.org/#concept-header-list-get-decode-split} のsplitの部分の仕様で分割する
   *
   * @param value Headers#getで取得した値
   * @returns 分割結果
   */
  export function valuesOfHeaderFieldValue(value: string): Array<string> {
    const exclude = "[^\\u{22}\\u{2C}]+";
    const values: Array<string> = [];

    if (/[\u0022\u002C]/.test(value) !== true) {
      const trimmed = StringEx.trim(
        value,
        Pattern.HTTP_TAB_OR_SPACE,
      );
      if (trimmed.length > 0) {
        return [trimmed];
      } else {
        return [];
      }
    }

    let i = 0;
    let vEnd = false;
    let cc = 0;
    let v = "";
    while (i < value.length) {
      const collected = StringEx.collectStart(
        value.substring(i),
        exclude,
      );
      i = i + collected.length;
      v = v + collected;
      const remains = value.substring(i);
      if (remains.startsWith("\u0022")) {
        const result = collectHttpQuotedString(remains);
        v = v + remains.substring(0, result.progression);
        i = i + result.progression;
        if (result.following === true) {
          continue;
        }
      } else {
        //  または ","始まり
        i = i + 1;
        vEnd = true;
        if (remains.startsWith("\u002C")) {
          cc = cc + 1;
        }
      }

      if (vEnd === true) {
        values.push(StringEx.trim(v, Pattern.HTTP_TAB_OR_SPACE));
        v = "";
        vEnd = false;
      }
    }
    if (v !== "") {
      values.push(StringEx.trim(v, Pattern.HTTP_TAB_OR_SPACE));
    }
    if (values.length < (cc + 1)) {
      // 末尾が","だった場合 //XXX スマートに（cc不要に）できるのでは？
      values.push("");
    }

    return values;
  }
}
