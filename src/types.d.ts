declare module 'js-yaml' {
  const yaml: { safeLoad(input: string): unknown };
  export default yaml;
}
