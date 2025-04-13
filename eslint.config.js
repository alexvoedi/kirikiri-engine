import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  jsonc: true,
  ignores: ['node_modules', 'dist', 'build', 'coverage', 'public'],
})
