'use strict';

module.exports = cv => {
  return thisMat => {
    const clearance = [650, 130]
      , [centerX, centerY] = [thisMat.cols / 2, thisMat.rows / 2]
      , [deltaX, deltaY] = [clearance[0] / 2, clearance[1] / 2]
      , rotorsXPosition = centerX - 35
      , rotorsYPosition = centerY - 5
      , region = new cv.Rect((rotorsXPosition - deltaX), (rotorsYPosition - deltaY), clearance[0], clearance[1]);

    return thisMat.getRegion(region);
  };
};
