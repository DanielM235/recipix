// Test file to verify curly brace rule is disabled
function testFunction() {
  const condition = true

  if (condition) console.log('This should not trigger a linting error')

  if (condition) console.log('This should also be fine')

  return true
}

export default testFunction
