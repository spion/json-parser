import { Code } from "./code";
import { mkErrorMsg } from "./util";

const enum Mode {
  Normal = 0,
  Reminder = 1,
  ExponentStart = 2,
  ExponentNum = 3
}

const enum Exponent {
  None = 0,
  Positive = 1,
  Negative = 2
}

function isEndOfValue(code: Code) {
  return (
    code === Code.Comma ||
    code === Code.RBrace ||
    code === Code.RBracket ||
    code === Code.Whitespace ||
    code === Code.Cr ||
    code === Code.Lf
  );
}

export class NumParser {
  private isNegative = false;
  private hasExponent = Exponent.None;
  private mode = Mode.Normal;
  private whole: number = 0;
  private reminder: number = 0;
  private exponent: number = 1;
  private divisor: number = 1;

  private fallbackCharcodes = new Array(64).fill(-1);
  private fallbackPosition = 0;

  init(code: number) {
    this.mode = Mode.Normal;

    if (code === Code.Minus) {
      this.isNegative = true;
      this.whole = 0;
    } else {
      this.isNegative = false;
      this.whole = code - Code.Zero;
    }
    this.reminder = 0;
    this.divisor = 1;
    this.exponent = 0;
    this.hasExponent = Exponent.None;
    this.fallbackPosition = 0;
    this.fallbackCharcodes[this.fallbackPosition] = code;
  }

  public advance(str: string, k: number) {
    let code = str.charCodeAt(k);
    switch (this.mode) {
      case Mode.Reminder:
        if (code >= Code.Zero && code <= Code.Nine) {
          let val = code - Code.Zero;
          this.reminder = this.reminder * 10 + val;
          this.divisor *= 10;
        } else if (code === Code.E || code === Code.e) {
          this.mode = Mode.ExponentStart;
        } else if (isEndOfValue(code)) {
          return true;
        } else if (code === Code.Dot) {
          throw new Error(mkErrorMsg(str, k));
        }
        break;

      case Mode.Normal:
        if (code >= Code.Zero && code <= Code.Nine) {
          this.whole = this.whole * 10 + (code - Code.Zero);
        } else if (code === Code.Dot) {
          this.mode = Mode.Reminder;
        } else if (code === Code.E || code === Code.e) {
          this.mode = Mode.ExponentStart;
        } else if (isEndOfValue(code)) {
          return true;
        } else {
          throw new Error(mkErrorMsg(str, k));
        }
        break;

      case Mode.ExponentStart:
        if (code === Code.Minus) this.hasExponent = Exponent.Negative;
        else if (code === Code.Plus) this.hasExponent = Exponent.Positive;
        else if (code >= Code.Zero && code <= Code.Nine) {
          this.hasExponent = Exponent.Positive;
          this.exponent = code - Code.Zero;
        } else {
          throw new Error(mkErrorMsg(str, k));
        }
        this.mode = Mode.ExponentNum;
        break;

      case Mode.ExponentNum:
        if (code >= Code.Zero && code <= Code.Nine) {
          this.exponent = this.exponent * 10 + (code - Code.Zero);
        } else if (isEndOfValue(code)) {
          return true;
        } else {
          throw new Error(mkErrorMsg(str, k));
        }
        break;
    }
    this.fallbackCharcodes[++this.fallbackPosition] = code;
    return false;
  }

  private fallback() {
    return Number(
      String.fromCharCode.apply(String, this.fallbackCharcodes.slice(0, this.fallbackPosition + 1))
    );
  }

  public value() {
    if (this.divisor > 10000000000000 || this.exponent > 323) {
      // Slow path, floating point arithmetic failure
      return this.fallback();
    }

    if (this.hasExponent === Exponent.Negative) this.exponent = 0 - this.exponent;
    let val = this.whole + this.reminder / this.divisor;
    if (this.isNegative) val = 0 - val;
    if (this.hasExponent > 0) val = val * Math.pow(10, this.exponent);
    else if (this.hasExponent === Exponent.Negative) val = val * Math.pow(10, 0 - this.exponent);
    return val;
  }
}
