'use strict';

module.exports = cv => mat => {
  const notImage = mat.bitwiseNot()
    , rotorsXPosition = (notImage.cols / 2) - 25
    , rotorsYPosition = (notImage.rows / 2) + 5
    , [onX, onY] = [
        [rotorsXPosition - 335, rotorsXPosition + 335],
        [rotorsYPosition - 100, rotorsYPosition + 100]
      ]
    , center = new cv.Point2(rotorsXPosition, rotorsYPosition)
    , cutRegion = new cv.Rect(
        onX[0],
        onY[0],
        onX[1] - onX[0],
        onY[1] - onY[0]
      )
    , cutMat = notImage
      .getRegion(cutRegion)
      // eslint-disable-next-line no-bitwise
      .threshold(0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)
    , houghLines = cutMat.houghLines(1,
      Math.PI / 180,
      400
    )
    , thatAngle = houghLines
      .reduce((prev, {'y': thisAngle}) => prev + thisAngle, 0) / houghLines.length
    , angle = (thatAngle / Math.PI * 180) - 90
    , matrix = cv.getRotationMatrix2D(center, angle)
    , size = new cv.Size(mat.sizes[1], mat.sizes[0])
    , rotatedMat = mat.warpAffine(matrix, size);

  return [rotatedMat, {
      center,
      angle,
      matrix,
      size
    }
  ];
};
