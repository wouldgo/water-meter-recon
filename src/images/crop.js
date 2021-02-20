'use strict';

module.exports = (mat, bufferForDigits) => bufferForDigits
    .map(aDigit => mat.getRegion(aDigit));
