'use strict';

module.exports = () => srcMat => {
  const histSize = 256;

  const {
      'minVal': minGray,
      'maxVal': maxGray
    } = srcMat.minMaxLoc()
    , inputRange = maxGray - minGray
    , alpha = (histSize - 1) / inputRange
    , beta = -minGray * alpha;

  return srcMat.convertTo(-1, alpha, beta);
};
