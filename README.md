# json-parser

Work in progress fast incremental (streaming) JSON parser for node

About 3.5 times slower than buffering a node stream then parsing it with
JSON.parse

Currently works on most valid JSON, however it also accepts invalid JSON.

TODO:

- floating point exponents
- moar perf! (buffer based string parser in node?)

TO forbid:

- forbid leading zero in numbers unless followed by dot
- forbid dot at end of number
- forbid comma before end of array and objects

TO test:

- end with unicode escape sequence
- add buffer splitting to fuzzer

# build

Install typescript then simply run `tsc` from the base dir

# bench

Check out the benchmarks in the perf dir

```
$ node perf/big-bench.js
testOboe: 3832.168ms
testJSONParse: 506.150ms
testThisParser: 1682.670ms
```

# license

MIT
