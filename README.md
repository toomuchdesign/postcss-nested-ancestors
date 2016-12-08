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

This plugin should be used **before** a PostCSS rules unwrapper like [postcss-nested].

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

If this is true then this plugin will look through your declaration values for the placeholder symbol and replace them with specified selector.

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

### Replace declaration values in complex nesting scenarios
`replaceDeclarations` options used in a complex nesting scenario might have undesired outputs because of the different nature of CSS selectors and and declaration values.

In general, avoid replacing declaration values when inside a rule with multiple selectors (but why should you?). In other words don't get yourself into trouble!

Here is an example of what you don't want to do.
```css
/* Don't replace declaration value inside multiple selector rules */
.a1,.a2
    { &:hover
        { &:before
            { content: "^^&";
        }
    }
}

/* ...that's the output */
.a1,.a2{
    &:hover {
        &:before {
            content: ".a1,.a2";
        }
    }
}
```

## Contributing
Contributions are super welcome, but please follow the conventions below if you want to do a pull request:

- Create a new branch and make the pull request from that branch
- Each pull request for a single feature or bug fix
- If you are planning on doing something big, please discuss first with [@toomuchdesign](www.github.com/toomuchdesign) about it
- Follow current code formatting
- Update tests (`test.js`) covering new features

## Todo's
- Write better comments to source code
