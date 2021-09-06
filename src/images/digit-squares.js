'use strict';

const multipliers = [0.1, 0.1];

module.exports = cv => {
  const mergeIntersectingRects = rects => {
      const toReturn = [];

      for (const aRect of rects) {
        const clearance = [
            (aRect.width * multipliers[0]),
            (aRect.height * multipliers[1])
          ]
        , currTouched = new cv.Rect(
            (aRect.x - clearance[0] / 2),
            (aRect.y - clearance[1] / 2),
            aRect.width + clearance[0],
            aRect.height + clearance[1]
          )
        , index = toReturn.findIndex(elm => {
            const intersection = elm.and(currTouched);

            return intersection.width > 0 || intersection.height > 0;
          });

        if (index < 0) {

          toReturn.push(aRect);
        } else {
          const newRect = toReturn[index].or(aRect);

          toReturn.splice(index, 1, newRect);
        }
      }

      return toReturn;
    };

  return filteredRects => {
    let thisRects = mergeIntersectingRects(filteredRects)
      , nextRects = mergeIntersectingRects(thisRects);

    while (thisRects.length !== nextRects.length) {
      thisRects = nextRects;
      nextRects = mergeIntersectingRects(thisRects);
    }

    const results = thisRects
      .filter(elm => elm.height / elm.width > 1 && elm.width > 25)
      .sort((first, second) => {
        const firstSquare = first.toSquare()
          , secondSquare = second.toSquare();

        if (firstSquare.x > secondSquare.x) {

          return 1;
        }

        if (firstSquare.x < secondSquare.x) {

          return -1;
        }

        return 0;
      });

    return results.slice(0, 5);
  };
};
