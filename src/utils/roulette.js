export const WHEEL_ORDER = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13,
    36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
    31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
  ];
  
  export const RED_NUMBERS = new Set([
    1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
  ]);
  
  export const SEGMENT_ANGLE = 360 / WHEEL_ORDER.length;
  
  export const numberColor = (n) => {
    if (n === 0) return "green";
    return RED_NUMBERS.has(n) ? "red" : "black";
  };
  
  export const colorName = (n) => {
    if (n === 0) return "Green";
    return RED_NUMBERS.has(n) ? "Red" : "Black";
  };
  
  export const OUTSIDE_SPOTS = [
    { id: "LOW",   label: "1–18", className: "low"   },
    { id: "EVEN",  label: "EVEN", className: "evenv" },
    { id: "RED",   label: "RED",  className: "redBox"},
    { id: "BLACK", label: "BLACK",className: "blackBox"},
    { id: "ODD",   label: "ODD",  className: "oddv"  },
    { id: "HIGH",  label: "19–36",className: "high"  },
  ];
  
  const RED = (n) => RED_NUMBERS.has(n);
  const BLACK = (n) => !RED_NUMBERS.has(n) && n !== 0;
  const EVEN = (n) => n !== 0 && n % 2 === 0;
  const ODD  = (n) => n % 2 === 1;
  const LOW  = (n) => n >= 1 && n <= 18;
  const HIGH = (n) => n >= 19 && n <= 36;
  
  export const columnOf = (n) => {
    if (n === 0) return 0;
    const mod = n % 3;
    return mod === 1 ? 1 : mod === 2 ? 2 : 3;
  };
  
  export const dozenOf = (n) => {
    if (n >= 1 && n <= 12) return 1;
    if (n >= 13 && n <= 24) return 2;
    if (n >= 25 && n <= 36) return 3;
    return 0;
  };
  
  export const PAYOUTS = {
    STRAIGHT: 36,
    DOZEN1: 3, DOZEN2: 3, DOZEN3: 3,
    COL1: 3, COL2: 3, COL3: 3,
    LOW: 2, HIGH: 2, EVEN: 2, ODD: 2, RED: 2, BLACK: 2,
  };
  
  export function isWinningForSpot(spotId, n) {
    if (!isNaN(Number(spotId))) return Number(spotId) === n;
    switch (spotId) {
      case "RED": return RED(n);
      case "BLACK": return BLACK(n);
      case "EVEN": return EVEN(n);
      case "ODD": return ODD(n);
      case "LOW": return LOW(n);
      case "HIGH": return HIGH(n);
      case "DOZEN1": return dozenOf(n) === 1;
      case "DOZEN2": return dozenOf(n) === 2;
      case "DOZEN3": return dozenOf(n) === 3;
      case "COL1": return columnOf(n) === 1;
      case "COL2": return columnOf(n) === 2;
      case "COL3": return columnOf(n) === 3;
      default: return false;
    }
  }
  