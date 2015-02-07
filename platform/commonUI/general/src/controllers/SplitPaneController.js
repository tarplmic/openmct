/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Controller for the splitter in Browse mode. Current implementation
         * uses many hard-coded constants; this could be generalized.
         * @constructor
         */
        function SplitPaneController() {
            var minimum = 120,
                maximum = 600,
                current = 200,
                start = 200;

            return {
                /**
                 * Get the current position of the splitter, in pixels
                 * from the left edge.
                 * @returns {number} position of the splitter, in pixels
                 */
                state: function () {
                    return current;
                },
                /**
                 * Begin moving the splitter; this will note the splitter's
                 * current position, which is necessary for correct
                 * interpretation of deltas provided by mct-drag.
                 */
                startMove: function () {
                    start = current;
                },
                /**
                 * Move the splitter a number of pixels to the right
                 * (negative numbers move the splitter to the left.)
                 * This movement is relative to the position of the
                 * splitter when startMove was last invoked.
                 * @param {number} delta number of pixels to move
                 */
                move: function (delta) {
                    current = Math.min(
                        maximum,
                        Math.max(minimum, start + delta)
                    );
                }
            };
        }

        return SplitPaneController;
    }
);