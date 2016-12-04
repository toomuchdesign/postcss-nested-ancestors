# PostCSS Nested Selectors
[![Build Status](https://travis-ci.org/nathanhood/postcss-nested-selectors.svg?branch=master)](https://travis-ci.org/nathanhood/postcss-nested-selectors)
[![codecov](https://codecov.io/gh/nathanhood/postcss-nested-selectors/branch/master/graph/badge.svg)](https://codecov.io/gh/nathanhood/postcss-nested-selectors)


**Note:** This is a fork of [postcss-nested-selectors](https://github.com/nathanhood/postcss-nested-selectors).

[PostCSS] plugin to reference any ancestor selector in nested CSS.

[PostCSS]: https://github.com/postcss/postcss
[postcss-current-selector]: https://github.com/komlev/postcss-current-selector
[postcss-nested]: https://github.com/postcss/postcss-nested
[postcss-simple-vars]: https://github.com/postcss/postcss-simple-vars

## Getting ancestor selectors
When writing modular nested CSS, `&` current parent selector is often not enough.

**PostCSS Nested Selectors** introduces `^&` selector which let you reference **any parent ancestor selector** with an easy and customizable interface.

This plugin should be used **before** a POSTCSS rules unwrapper like [postcss-nested].

See [PostCSS] docs for examples for your environment.

### Ancestor selectors schema

```
	.level-1 {
|   |   .level-2 {
|   |   |   .level-3 {
|   |   |   |   .level-4 {
|   |   |   |   |
|   |   |   |   --- & {}        /*      & = ".level-1 .level-2 .level-3 .level-4" */
|   |   |   ------- ^& {}       /*     ^& = ".level-1 .level-2 .level-3"          */
|   |   ----------- ^^& {}      /*    ^^& = ".level-1 .level-2"                   */
|   --------------- ^^^& {}     /*   ^^^& = ".level-1"                            */
------------------- ^^^^& {}    /*  ^^^^& = ""                                    */
				}
			}
		}
	}
```

### A real example

```css
/* Without postcss-nested-selectors */
.MyComponent
	&-part{}
	&:hover {
		> .MyComponent-part {} /* Must manually repeat ".MyComponent" for each child */
	}
}

/* With postcss-nested-selectors */
.MyComponent
	&-part{}
	&:hover {
		> ^&-part {} /* Skip ":hover" inheritance here */
	}
}

/* After postcss-nested-selectors */
.MyComponent {
	&-part{}
	&:hover {
		> .MyComponent-part {}
}

/* After postcss-nested */
.MyComponent {}
.MyComponent-part {}
.MyComponent:hover {}
.MyComponent:hover > .MyComponent-part {} /* No ":hover" inheritance here! */

```

## Why?
Currently another plugin - [postcss-current-selector] - has tried to solve the problem of referencing ancestors selector. It works great, but its approach involves assigning ancestor selectors to special variables to be later processed by a further postcss plugin [postcss-simple-vars].

**PostCSS Nested Selectors** instead replaces special ancestor selectors, makes no use of variable assignment and produces an output ready to be unwrapped with [postcss-nested].

## Installation

```console
$ npm install postcss-nested-selectors
```

## Usage

```js
postcss([ require('postcss-nested-selectors') ]);
```

## Options

### placeholder

Type: `string`
Default: `^&`

Ancestor selector pattern (utility option to automatically set both `levelSymbol` and `parentSymbol`)

### levelSymbol

Type: `string`
Default: `^`

Define ancestor selector fragment reative to the matching nesting level

### parentSymbol

Type: `string`
Default: `&`

Ancestor selector base symbol
