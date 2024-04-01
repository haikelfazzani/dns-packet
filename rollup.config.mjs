import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const OUTPUT_FILENAME = `dist/index`;
const banner = `/*! DNSPacket Copyright 2024 - Haikel Fazzani */\n`;

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
        name: 'DNSPacket',
        file: `${OUTPUT_FILENAME}.js`,
        format: 'umd',
        sourcemap: false,
        banner
      },
      {
        file: `${OUTPUT_FILENAME}.mjs`,
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