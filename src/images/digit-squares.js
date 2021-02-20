'use strict';

module.exports = cv => {
  const multipliers = [0.1, 1.5]
    , mergeIntersectingRects = rects => {
      return rects.reduce((prev, curr) => {
        const clearance = [
            (curr.width * multipliers[0]),
            (curr.height * multipliers[1])
          ]
          , currTouched = new cv.Rect(
            (curr.x - clearance[0] / 2),
            (curr.y - clearance[1] / 2),
            curr.width + clearance[0],
            curr.height + clearance[1]
          )
          , index = prev.findIndex(elm => {
            const intersection = elm.and(currTouched);

            return intersection.width > 0 || intersection.height > 0;
          });

        if (index < 0) {

          return [...prev, curr];
        }

        const newRect = prev[index].or(curr);

        prev.splice(index, 1, newRect);
        return prev;
      }, []);
    };

  return filteredRects/*, mat)*/ => {
    let thisRects = mergeIntersectingRects(filteredRects)
      , nextRects = mergeIntersectingRects(thisRects);

    while (thisRects.length !== nextRects.length) {
      thisRects = nextRects;
      nextRects = mergeIntersectingRects(thisRects);
    }

    const results = thisRects
      .filter(elm => elm.width > 21 && elm.height > 83)
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

    /*results.forEach(aRect => {
      const point0 = new cv.Point2(
          aRect.x,
          aRect.y
        )
        , point1 = new cv.Point2(
          aRect.x + aRect.width,
          aRect.y + aRect.height
        );

      //toUse.drawCircle(point0, 2, white, 2);
      mat.drawRectangle(point0, point1, new cv.Vec(0, 0, 0));
    });*/

    return results.slice(0, 5);
  };
};
