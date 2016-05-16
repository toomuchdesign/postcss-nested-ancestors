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

```css
/* Before */
.foo
    &:hover {
        ^&-bar {
            color: inherit;
        }
    }
}

/* After postcss-nested-ancestors */
.foo {
    &:hover {
        .foo-bar { /* no :hover inherited here! */
            color: inherit;
        }
    }
}

/* After postcss-nested */
.foo {}
.foo:hover {}
.foo .foo-bar { /* no :hover inherited here! */
    color: inherit;
}
```

## Usage

**This plugin should be used just **before** POSTCSS rules unwrapper like [postcss-nested](https://github.com/postcss/postcss-nested).

See [PostCSS] docs for examples for your environment.


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
