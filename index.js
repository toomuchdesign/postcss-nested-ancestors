var postcss = require('postcss'),
	escRgx = require('escape-string-regexp');

module.exports = postcss.plugin('postcss-nested-ancestors', opts => {
	opts = Object.assign({
		levelSymbol: opts.levelSymbol || '^',
		parentSymbol: opts.parentSymbol || '&',
		placeholder: '^&'
	}, opts);

	var parentStack = [],
		placeholderRegex = new RegExp(
			'([' + escRgx(opts.levelSymbol) + ']+)(' + escRgx(opts.parentSymbol) + ')(.*)',
			'g'
		),
		spacesAndAmpersandRegex = /\s&/g;

	/**
	 * Determine how many level symbols ('^') exist
	 *
	 * @param {string} levelSymbol
	 * @returns {number}
	 */
	function getNestingLevel(levelSymbol) {
		return levelSymbol.split(opts.levelSymbol).length - 1 || 1
	}

	/**
	 * Find parent selector from corresponding level symbol
	 *
	 * @param  {number} levelSymbol - Ancestor nesting depth (0 = &, 1 = ^&)
	 * @param  {object} rule - PostCSS Rule object
	 * @param  {object} result - PostCSS Result object
	 * @return {string}
	 */
	function getParentSelector(levelSymbol, rule, result) {
		let nestingLevel = getNestingLevel(levelSymbol);

		// Set a warning when nestingLevel >= parentStack.length
		if ( nestingLevel >= parentStack.length ) {
			rule.warn(result, 'Parent selector exceeds current stack.');
		}

		return parentStack.filter((selector, index) => {
				return index < parentStack.length - nestingLevel;
			})
			.join(' ')
			.replace(spacesAndAmpersandRegex, '');
	}

	/**
	 * Replace any ancestor placeholder into given selector(s)/string.
	 *
	 * @param  {string} selector - CSS selector
	 * @param  {object} rule - PostCSS Rule object
	 * @param  {object} result - PostCSS Result object
	 * @return {string}
	 */
	function replacePlaceholders(selector, rule, result) {
		return selector.split(/,\s*/)
			.map(sel => {
				return sel.replace(
					placeholderRegex,
					(m, levelSymbol, parentSymbol, end) => {
						return getParentSelector(levelSymbol, rule, result)
							.split(/,\s*/)
							.map(parent => {
								return parent + end;
							})
							.join(', ');
					}
				);
			})
			.join(', ');
	}

	function process(node, result) {
		node.walkRules(rule => {
			// Replace parent placeholders in rule selectors
			rule.selector = replacePlaceholders(rule.selector, rule, result);

			// Add selector to current parent stack
			parentStack.push(rule.selector);

			// Process child rules
			process(rule, result);
		});

		// Remove current parent stack item at the end of each child iteration
		parentStack.pop();
	};

	return (root, result) => {
		process(root, result);
	};
});
