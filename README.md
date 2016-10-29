# PostCSS Nested ancestors [![Build Status][ci-img]][ci]

[PostCSS] plugin to reference any ancestor selector in nested CSS.

[PostCSS]:                      https://github.com/postcss/postcss
[ci-img]:                       https://travis-ci.org/toomuchdesign/postcss-nested-ancestors.svg
[ci]:                           https://travis-ci.org/toomuchdesign/postcss-nested-ancestors
[postcss-current-selector]:     https://github.com/komlev/postcss-current-selector
[postcss-nested]:               https://github.com/postcss/postcss-nested
[postcss-simple-vars]:          https://github.com/postcss/postcss-simple-vars

## Getting ancestor selectors
When writing modular nested CSS, `&` current parent selector is often not enough.

**PostCSS Nested ancestors** introduces `^&` selector which let you reference **any parent ancestor selector** with an easy and customizable interface.

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
/* Without postcss-nested-ancestors */
.MyComponent
    &-part{}
    &:hover {
        > .MyComponent-part {} /* Must manually repeat ".MyComponent" for each child */
    }
}

/* With postcss-nested-ancestors */
.MyComponent
    &-part{}
    &:hover {
        > ^&-part {} /* Skip ":hover" inheritance here */
    }
}

/* After postcss-nested-ancestors */
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

**PostCSS Nested ancestors** instead replaces special ancestor selectors, makes no use of variable assignment and produces an output ready to be unwrapped with [postcss-nested].

## Installation

```console
$ npm install postcss-nested-ancestors
```

## Usage

```js
postcss([ require('postcss-nested-ancestors') ]);
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

### replaceDeclarations (experimental)

Type: `boolean`
Default: `false`

If this is true then this plugin will look through your declaration values/properties for the placeholder symbol and replace them with specified selector.

An use case for this if enabling [postcss-ref](https://github.com/morishitter/postcss-ref) to work with dynamic `@ref` selectors. Read discussion [here](https://github.com/toomuchdesign/postcss-nested-ancestors/pull/3).

```css
/* Before */
.foo {
    &:last-child {
        border-top: ref(^&, border-bottom);
    }
}

/* After PostCSS Nested ancestors and PostCSS Nested */
.foo {
}

.foo:last-child {
    border-top: ref(.foo, border-bottom);
}
```

## Known issues

### Complex nesting
**PostCSS Nested ancestors** is currently not able to resolve complex nesting cases like multiple selector declarations. It might break badly.

```css
/* Before */
.foo,
.bar {
    &:hover {
        ^&-moo {
        }
    }
}

/* After :-( */
.foo,
.bar {
    &:hover {
        .foo,.bar-moo {
        }
    }
}

```

## Todo's
* Find a smart way to resolve complex nesting issues
