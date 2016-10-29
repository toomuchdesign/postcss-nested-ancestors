var postcss = require('postcss'),
    assign = require('object-assign'),
    escRgx = require('escape-string-regexp');

module.exports = postcss.plugin('postcss-nested-ancestors', function (opts) {
    opts = assign({
        placeholder: '^&',
        replaceDeclarations: false
    }, opts);

    // Advanced options
    opts = assign({
        levelSymbol: opts.levelSymbol || opts.placeholder.charAt(0),
        parentSymbol: opts.parentSymbol || opts.placeholder.charAt(1)
    }, opts);

    var parentsStack = [],
        // Get all ancestors placeholder recurrencies: ^&, ^^&, ^^^&, [...]
        placeholderRegex = new RegExp(
            // eslint-disable-next-line max-len
            '(' + escRgx(opts.levelSymbol) + ')+(' + escRgx(opts.parentSymbol) + ')',
            'g'
        ),
        // Get any space preceding an ampersand
        spacesAndAmpersandRegex = /\s&/g,
        resultReference;

    /**
     * Walk current ancestor stack and
     * assembly ancestor selector at the given depth.
     *
     * @param  {Number} ancestor nesting depth (0 = &, 1 = ^& = grandparent...)
     * @return {String} ancestor selector
     */
    function getParentSelectorAtLevel(nestingLevel) {
        nestingLevel = nestingLevel || 1;

        // @TODO add warning when nestingLevel >= parentsStack.length
        if ( nestingLevel >= parentsStack.length ) {
            resultReference.warn('Parent selector exceeds current stack.');
        }

        // Create an array of matching parent selectors
        return parentsStack.filter( function (rule, index) {
            return index < parentsStack.length - nestingLevel;
        })
            .join(' ')
            .replace(spacesAndAmpersandRegex, '');  // Remove " &"
    }

    /**
     * Given an ancestor placeholder,
     * returns the corresponding selector fragment.
     * Used as replacer in .replace method
     *
     * @param  {String} placeholder eg.^^&
     * @return {String} string      ancestor selector fragment
     */
    function placeholderReplacer(placeholder) {
        return getParentSelectorAtLevel(
            // Get how many level symbols ("^") has current placeholder
            placeholder.split(opts.levelSymbol).length - 1
        );
    }

    /**
     * Replace any ancestor placeholder into a given selector.
     *
     * @param  {String} selector
     * @return {String} selector
     */
    function replacePlaceholders(selector) {
        // Find placeholders and replace them with matching parent selector
        return selector.replace(
            placeholderRegex,
            placeholderReplacer
        );
    }

    var process = function (node) {
        node.each( function (rule) {
            if (rule.type === 'rule') {

                // Replace parents placeholders in rule selectors
                rule.selector = replacePlaceholders(rule.selector);

                // Add current selector to current parent stack
                parentsStack.push(rule.selector);

                // Process child rules
                process(rule);
            }

            // Optionally replace parents placeholders into declarations
            // eslint-disable-next-line brace-style
            else if (opts.replaceDeclarations && rule.type === 'decl') {
                rule.value = replacePlaceholders(rule.value);
                rule.prop = replacePlaceholders(rule.prop);
            }
        });
        // Remove current parent stack item at the end of each child iteration
        parentsStack.pop();
    };

    return function (root, result) {
        resultReference = result;   // Store global reference to result object
        process(root, result);
    };
});
