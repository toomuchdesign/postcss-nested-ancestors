var resolvedNestedSelector = require('postcss-resolve-nested-selector');
var escRgx = require('escape-string-regexp');

/**
 * @type {import('postcss').PluginCreator}
 */
module.exports = (opts = {}) => {
  opts = Object.assign(
    {
      placeholder: '^&',
      replaceDeclarations: false,
    },
    opts
  );

  // Advanced options
  opts = Object.assign(
    {
      levelSymbol: opts.levelSymbol || opts.placeholder.charAt(0),
      parentSymbol: opts.parentSymbol || opts.placeholder.charAt(1),
    },
    opts
  );

  // Gets all ancestors placeholder recurrencies: ^&, ^^&, ^^^&, [...]
  var placeholderRegex = new RegExp(
    '(' + escRgx(opts.levelSymbol) + ')+(' + escRgx(opts.parentSymbol) + ')',
    'g'
  );

  /**
   * Get first parent rule node (no @-rules)
   * @param  {Object} node            PostCSS node object
   * @return {Object|false}           Parent node or false if no parent rule found
   */
  function getParentRule(node) {
    var parentNode = node.parent;

    if (parentNode.type === 'rule') {
      return parentNode;
    }

    if (parentNode.type === 'root') {
      return false;
    }

    return getParentRule(parentNode);
  }

  /**
   * Climb up PostCSS node parent stack (no @-rules)
   * @param  {Object} node            PostCSS node object
   * @param  {Number} nestingLevel    Number of parent to climb
   * @return {Object|false}           Parent node or false if no matching parent
   */
  function getParentRuleAtLevel(node, nestingLevel) {
    var currentNode = node;
    nestingLevel = nestingLevel || 1;

    for (var i = 0; i < nestingLevel; i++) {
      currentNode = getParentRule(currentNode);

      if (!currentNode) {
        return false;
      }
    }
    return currentNode;
  }

  /**
   * Given a PostCSS object and the level of a parent rule,
   * return the selector of the matching parent rule
   *
   * @param  {Object} node            PostCSS Node object
   * @param  {Number} nestingLevel    Ancestor nesting depth (0 = &, 1 = ^&, ...)
   * @param  {Object} result          PostCSS Result object
   * @return {Array}                  Array of ancestor selectors
   */
  function getParentSelectorsAtLevel(node, nestingLevel, result) {
    nestingLevel = nestingLevel || 1;

    // Get parent PostCSS node object at requested nesting level
    var parentNodeAtLevel = getParentRuleAtLevel(node, nestingLevel + 1);

    // Iterate each matching parent node selectors and resolve them
    if (parentNodeAtLevel && parentNodeAtLevel.selectors) {
      return parentNodeAtLevel.selectors
        .map(function (selector) {
          // Resolve parent selectors for each node
          return resolvedNestedSelector(selector, parentNodeAtLevel);
        })
        .reduce(function (a, b) {
          // Flatten array of arrays
          return a.concat(b);
        });
    } else {
      // Set a warning no matching parent node found
      node.warn(result, 'Parent selector exceeds current stack.');
      return [''];
    }
  }

  /**
   * Given an ancestor placeholder and the PostCSS node object,
   * returns the corresponding parent selectors
   * calculated from the provided PostCSS node object.
   *
   * @param  {String} placeholder     Ancestor placeholder (eg.^^&)
   * @param  {Object} node            PostCSS Node object
   * @param  {Object} result          PostCSS Result object
   * @return {Array}                  Array of ancestor selectors
   */
  function getMatchingParentSelectors(placeholder, node, result) {
    return getParentSelectorsAtLevel(
      node,
      // Get how many level symbols ("^") has current placeholder
      placeholder.lastIndexOf(opts.levelSymbol) / opts.levelSymbol.length + 1,
      result
    );
  }

  /**
   * Given a PostCSS node object,
   * generate an array of selector from provided PostCSS node selectors
   * in which ancestor placeholders are replaced with actual matching parent selectors.
   *
   * In case of multiple parent selectors, the returning selectors array will
   * contain more items then the original one.
   *
   * @param  {Object} node        a PostCSS Node object
   * @param  {Object} result      a PostCSS Result object
   * @return {String}             Array of Arrays of CSS selectors
   */
  function getReplacedSelectors(node, result) {
    // Parse each singular selector
    const resolvedSelectors = node.selectors.map(function (selector) {
      // Look for ancestor placeholders into selector (eg. ^^&-foo)
      const placeholders = selector.match(placeholderRegex);

      // Ancestor placeholder found! (eg. ^^&):
      if (placeholders) {
        /*
         * Warning!
         * If more than one ancestor placeholder found (placeholders.length > 1)
         * in the same selector, all placeholders will be processed like
         * they were equal to the first one. (eg. '^&^^&' --> '^&^&').
         *
         * It is to avoid useless complexity in a scenario which can be handled
         * by splitting the selector in 2 nested selectors.
         * (eg. '^&^^&' --> '^&{ &^^^&{}'). mmh? ;-)
         *
         */
        if (placeholders.length > 1) {
          node.warn(
            result,
            'More then one ancestor placeholders found in same selector.'
          );
        }
        /*
         * Get an array of parent selectors build from found placeholder
         * (eg. ['.ancestor-1, '.ancestor-2'])
         *
         * See the following "placeholders[0]""
         */
        const parentSelectors = getMatchingParentSelectors(
          placeholders[0],
          node,
          result
        );

        /*
         * Replace original selector string with an array of updated selectors.
         * The ancestor placeholder (^^&) found in original selector (^^&-foo)
         * is replaced by just generated parent selectors.
         * (eg. '^^&-foo' --> ['.ancestor-1-foo, '.ancestor-2-foo'])
         */
        return parentSelectors.map(function (parentSelector) {
          return selector.replace(placeholderRegex, parentSelector);
        });
      }
      // No ancestor placeholders found! Return original selector
      return selector;
    });

    return resolvedSelectors;
  }

  var process = function (node, result) {
    // Replace parents placeholders in each rule selector
    node.walkRules(function (rule) {
      rule.selectors = getReplacedSelectors(rule, result);
    });

    // Replace parents placeholders in each rule declaration value
    if (opts.replaceDeclarations) {
      node.walkDecls(function (decl) {
        decl.value = decl.value.replace(
          placeholderRegex,
          function (placeholder) {
            // Get parent selectors array and join it as a comma separated string
            return getMatchingParentSelectors(placeholder, decl, result).join();
          }
        );
      });
    }
  };

  return {
    postcssPlugin: 'postcss-nested-ancestors',
    Once(root, { result }) {
      process(root, result);
    },
  };
};

module.exports.postcss = true;
