import postcss from 'postcss';
import test    from 'ava';

import plugin from './';

function run(t, input, output, opts = { }) {
    return postcss([ plugin(opts) ]).process(input)
        .then( result => {
            t.deepEqual(result.css, output);
            t.deepEqual(result.warnings().length, 0);
        });
}

test('Chain placeholder in a simple case', t => {
    return run( t,
                '.a{ &:hover{ ^&-b{} } }',
                '.a{ &:hover{ .a-b{} } }',
                { }
    );
});

test('Prepend placeholder in a simple case', t => {
    return run( t,
                '.a{ &:hover{ ^& .b{} } }',
                '.a{ &:hover{ .a .b{} } }',
                { }
    );
});

test('Chain 2 placeholders in double selector', t => {
    return run( t,
                '.a{ &:hover{ ^&-b, ^&-c{} } }',
                '.a{ &:hover{ .a-b, .a-c{} } }',
                { }
    );
});

test('Prepend 2 placeholders in double selector', t => {
    return run( t,
                '.a{ &:hover{ ^& .b, ^& .c{} } }',
                '.a{ &:hover{ .a .b, .a .c{} } }',
                { }
    );
});

test('Replace placeholder at different nesting levels', t => {
    return run( t,
                '.a{ &:hover{ ^&-b{} } .c{ .d{ ^&-e{} } } .z{} }',
                '.a{ &:hover{ .a-b{} } .c{ .d{ .a .c-e{} } } .z{} }',
                { }
    );
});

test('Use placeholder with 3 different parent levels', t => {
    return run( t,
                '.a{ &-b{ &-c{ ^&-d,^&-d{} ^^&-d{} ^^^&-d{}} } }',
                '.a{ &-b{ &-c{ .a-b-d,.a-b-d{} .a-d{} -d{}} } }',
                { }
    );
});

