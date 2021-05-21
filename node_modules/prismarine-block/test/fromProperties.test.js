/* eslint-env jest */

const Block = require('../')('1.16.4')
const mcData = require('minecraft-data')('1.16.4')

describe('Block From Properties', () => {
  test('spruce half slab: waterlogged, upper', () => {
    const spruceSlabId = mcData.blocksByName.spruce_slab.id
    const properties = { type: 'top', waterlogged: true }
    const block = Block.fromProperties(spruceSlabId, properties, 0)

    expect(block.stateId).toBe(8310)
    expect(block.getProperties()).toMatchObject(properties)
  })
})
