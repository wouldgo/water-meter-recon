'use strict';
const clearance = [670, 120]
  , drift = [25, -13]
  , [deltaX, deltaY] = [clearance[0] / 2, clearance[1] / 2];

module.exports = cv => {
  return thisMat => {
    const [centerX, centerY] = [thisMat.cols / 2, thisMat.rows / 2]
      , rotorsXPosition = centerX - drift[0]
      , rotorsYPosition = centerY - drift[1]
      , region = new cv.Rect(
          (rotorsXPosition - deltaX),
          (rotorsYPosition - deltaY),
          clearance[0],
          clearance[1]
        );

    return thisMat.getRegion(region);
  };
};
