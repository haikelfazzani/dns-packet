import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const PACKAGE_NAME = 'dns-packet-ts';
const OUTPUT_FILENAME = `dist/index`;

const bundle = (config) => ({
  ...config,
  input: 'src/main.ts',
});

export default [
  bundle({
    plugins: [esbuild()],
    output: [
      {
        file: `${OUTPUT_FILENAME}.cjs`,
        format: 'cjs',
        sourcemap: false,
      },
      {
        file: `${OUTPUT_FILENAME}.js`,
        format: 'es',
        sourcemap: false,
      }
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `${OUTPUT_FILENAME}.d.ts`,
      format: 'es',
    },
  }),
];