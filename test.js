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

test('Chain ancestor in a simple case', t => {
    return run( t,
                '.a{ &:hover{ ^&-b{} } }',
                '.a{ &:hover{ .a-b{} } }',
                { }
    );
});

test('Prepend ancestor in a simple case', t => {
    return run( t,
                '.a{ &:hover{ ^& .b{} } }',
                '.a{ &:hover{ .a .b{} } }',
                { }
    );
});

test('Chain 2 ancestors in double selector', t => {
    return run( t,
                '.a{ &:hover{ ^&-b, ^&-c{} } }',
                '.a{ &:hover{ .a-b, .a-c{} } }',
                { }
    );
});

test('Prepend 2 ancestors in double selector', t => {
    return run( t,
                '.a{ &:hover{ ^& .b, ^& .c{} } }',
                '.a{ &:hover{ .a .b, .a .c{} } }',
                { }
    );
});

test('Replace ancestors at different nesting levels', t => {
    return run( t,
                '.a{ &:hover{ ^&-b{} } .c{ .d{ ^&-e{} } } .z{} }',
                '.a{ &:hover{ .a-b{} } .c{ .d{ .a .c-e{} } } .z{} }',
                { }
    );
});

test('Replace ancestors with 3 different hierarchy levels', t => {
    return run( t,
                '.a{ &-b{ &-c{ ^&-d,^&-d{} ^^&-d{} ^^^&-d{}} } }',
                '.a{ &-b{ &-c{ .a-b-d,.a-b-d{} .a-d{} -d{}} } }',
                { }
    );
});

test('Process 2 nested ancestors', t => {
    return run( t,
                '.a{ &-b{ &-c{ ^^&-d{ &-e{ ^^^^&-f{ } } } } } }',
                '.a{ &-b{ &-c{ .a-d{ &-e{ .a-f{ } } } } } }',
                { }
    );
});

test('Process nested ancestor near to > \, + and ~ selectors', t => {
    return run( t,
                '.a{ &-b{ > ^&-c{} + ^&-d{} ~ ^&-e{} } }',
                '.a{ &-b{ > .a-c{} + .a-d{} ~ .a-e{} } }',
                { }
    );
});

test('Return empty string when pointing to a non-existent ancestor', t => {
    return run( t,
                '.a{ &-b{ &-c{ ^^^^&-d{} } } }',
                '.a{ &-b{ &-c{ -d{} } } }',
                { }
    );
});

