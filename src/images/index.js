'use strict';

module.exports = cv => {
  const cannyOpts = {
      'first': 100,
      'second': 130
    }
    , canny = require('./canny')(cannyOpts)
    , autoBrightnessAndContrast = require('./auto-brightness-contrast')()
    , intoMiddle = require('./filter/middle')(cv)
    , digitsSquares = require('./digit-squares')(cv)
    , rotate = require('./rotate')(cv)
    , crop = require('./crop')
    , prepareMat = (originalMat, aMat) => {
      const [rotatedMat, {matrix, size}] = rotate(aMat)
        , originalRotatedMat = originalMat.warpAffine(matrix, size)
        , cutMat = intoMiddle(rotatedMat)
        , originalMatCutMat = intoMiddle(originalRotatedMat)
        , toUse = autoBrightnessAndContrast(cutMat);

      return [toUse, originalMatCutMat];
    };

  return (filename, timestamp) => {
    const originalMat = cv.imread(filename)
      , mat = originalMat
        .cvtColor(cv.COLOR_BGR2GRAY)
        .threshold(100, 255, 0)
      , [toUse, toReturn] = prepareMat(originalMat, mat)
      , cannyEdges = canny(toUse)
      , contours = cannyEdges.findContours(cv.RETR_EXTERNAL,
          cv.CHAIN_APPROX_NONE)
      , filtered = contours
        .map(aContour => aContour.boundingRect())
      , digitsRegions = digitsSquares(filtered, toUse);

    if (timestamp != null) {
      for (const aRect of digitsRegions) {

        const point0 = new cv.Point2(
          aRect.x,
          aRect.y
        )
        , point1 = new cv.Point2(
          aRect.x + aRect.width,
          aRect.y + aRect.height
        );

        toUse.drawCircle(point0, 2, new cv.Vec(127, 127, 127), 2);
        toUse.drawRectangle(point0, point1, new cv.Vec(127, 127, 127));
      }

      cv.imwrite(`/home/dario/tmp/${timestamp}-02-to-use.png`, toUse);
    }

    return crop(toReturn, digitsRegions);

    /*return crop(toReturn, digitsRegions)
      .map(elm => {
        const {rows, cols} = elm;


        if (rows > cols) {

          return elm.copyMakeBorder(0, 0, rows, rows);
        }


        return elm.copyMakeBorder(0, 0, cols, cols);
      });*/
  };
};
