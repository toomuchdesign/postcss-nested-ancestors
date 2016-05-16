# PostCSS Nested ancestors [![Build Status][ci-img]][ci]

[PostCSS] plugin to reference any ancestor selector in nested CSS.

[PostCSS]: https://github.com/postcss/postcss
[ci-img]:  https://travis-ci.org/toomuchdesign/postcss-nested-ancestors.svg
[ci]:      https://travis-ci.org/toomuchdesign/postcss-nested-ancestors

## Installation

```console
$ npm install postcss-nested-ancestor
```

## Usage
When writing modular nested CSS, It often arises the need of building a child selector using an ancestor selector different then the last one.

This plugin should be used **before** a POSTCSS rules unwrapper like [postcss-nested](https://github.com/postcss/postcss-nested).

See [PostCSS] docs for examples for your environment.

```css

/* Before */
.foo
    &:hover {
        > ^&-bar {}   /* no :hover inherited here! */
    }
}

/* After postcss-nested-ancestors */
.foo {
    &:hover {
        > .foo-bar {} /* no :hover inherited here! */
    }
}

/* After postcss-nested */
.foo {}
.foo:hover {}
.foo:hover > .foo-bar {}    /* no :hover inherited here! */

```

## Why?
**postcss-current-ancestors** solves the problem of
[postcss-current-selector](https://github.com/komlev/postcss-current-selector)

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
