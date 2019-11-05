/**
 * A genetator method to distribute the task, in this example to distribute the number of items amongst the workers.
 */

module.exports.distributeInteger = function*(total, divider) {
  /**
   * If there are 0 cpus then do not distrubute and yield 0
   */
  if (divider === 0) {
    yield 0;
  } else {
    let rest = total % divider;
    let result = total / divider;
    for (let i = 0; i < divider; i++) {
      if (rest-- > 0) {
        yield Math.ceil(result);
      } else {
        yield Math.floor(result);
      }
    }
  }
};
