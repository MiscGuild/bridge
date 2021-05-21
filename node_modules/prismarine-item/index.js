const nbt = require('prismarine-nbt')
function loader (version) {
  const mcData = require('minecraft-data')(version)
  class Item {
    constructor (type, count, metadata, nbt) {
      if (type == null) return

      if (metadata instanceof Object && metadata !== null) {
        nbt = metadata
        metadata = 0
      }

      this.type = type
      this.count = count
      this.metadata = metadata == null ? 0 : metadata
      this.nbt = nbt || null

      const itemEnum = mcData.findItemOrBlockById(type)
      if (itemEnum) {
        this.name = itemEnum.name
        this.displayName = itemEnum.displayName
        if ('variations' in itemEnum) {
          for (const i in itemEnum.variations) {
            if (itemEnum.variations[i].metadata === metadata) { this.displayName = itemEnum.variations[i].displayName }
          }
        }
        this.stackSize = itemEnum.stackSize
      } else {
        this.name = 'unknown'
        this.displayName = 'unknown'
        this.stackSize = 1
      }
    }

    static equal (item1, item2, matchStackSize = true) {
      if (item1 == null && item2 == null) {
        return true
      } else if (item1 == null) {
        return false
      } else if (item2 == null) {
        return false
      } else {
        return (item1.type === item2.type &&
            (matchStackSize ? item1.count === item2.count : true) &&
            item1.metadata === item2.metadata &&
            JSON.stringify(item1.nbt) === JSON.stringify(item2.nbt))
      }
    }

    static toNotch (item) {
      if (mcData.isNewerOrEqualTo('1.13')) {
        if (item == null) return { present: false }
        const notchItem = {
          present: true,
          itemId: item.type,
          itemCount: item.count
        }
        if (item.nbt && item.nbt.length !== 0) { notchItem.nbtData = item.nbt }
        return notchItem
      } else {
        if (item == null) return { blockId: -1 }
        const notchItem = {
          blockId: item.type,
          itemCount: item.count,
          itemDamage: item.metadata
        }
        if (item.nbt && item.nbt.length !== 0) { notchItem.nbtData = item.nbt }
        return notchItem
      }
    }

    static fromNotch (item) {
      if (mcData.isNewerOrEqualTo('1.13')) {
        if (item.present === false) return null
        return new Item(item.itemId, item.itemCount, item.nbtData)
      } else {
        if (item.blockId === -1) return null
        return new Item(item.blockId, item.itemCount, item.itemDamage, item.nbtData)
      }
    }

    get customName () {
      if (Object.keys(this).length === 0) return null
      return this?.nbt?.value?.display?.value?.Name?.value ?? 0
    }

    set customName (newName) {
      if (!this.nbt) this.nbt = { name: '', type: 'compound', value: {} }
      if (!this.nbt.value.display) this.nbt.value.display = { type: 'compound', value: {} }
      this.nbt.value.display.value.Name = { type: 'string', value: newName }
    }

    // gets the cost based on previous anvil uses
    get repairCost () {
      if (Object.keys(this).length === 0) return 0
      return this?.nbt?.value?.RepairCost?.value ?? 0
    }

    set repairCost (value) {
      if (!this?.nbt) this.nbt = { name: '', type: 'compound', value: {} }
      this.nbt.value.RepairCost = { type: 'int', value }
    }

    get enchants () {
      if (Object.keys(this).length === 0) return null
      if (mcData.isOlderThan('1.13')) {
        let itemEnch
        if (this.name === 'enchanted_book' && this?.nbt?.value?.StoredEnchantments) {
          itemEnch = nbt.simplify(this.nbt).StoredEnchantments
        } else if (this?.nbt?.value?.ench) {
          itemEnch = nbt.simplify(this.nbt).ench
        } else {
          itemEnch = []
        }
        return itemEnch.map(ench => ({ lvl: ench.lvl, name: mcData.enchantments[ench.id].name }))
      } else {
        let itemEnch = []
        if (this?.nbt?.value?.Enchantments) {
          itemEnch = nbt.simplify(this.nbt).Enchantments
        } else if (this?.nbt?.value?.StoredEnchantments) {
          itemEnch = nbt.simplify(this.nbt).StoredEnchantments
        } else {
          itemEnch = []
        }
        return itemEnch.map(ench => ({ lvl: ench.lvl, name: ench.id.replace(/minecraft:/, '') }))
      }
    }

    set enchants (normalizedEnchArray) {
      const isBook = this.name === 'enchanted_book'
      const postEnchantChange = mcData.isOlderThan('1.13')
      const enchListName = postEnchantChange ? 'ench' : 'Enchantments'
      const type = postEnchantChange ? 'short' : 'string'
      if (!this.nbt) this.nbt = { name: '', type: 'compound', value: {} }

      const enchs = normalizedEnchArray.map(({ name, lvl }) => {
        const value = postEnchantChange ? mcData.enchantmentsByName[name].id : `minecraft:${mcData.enchantmentsByName[name].name}`
        return { id: { type, value }, lvl: { type: 'short', value: lvl } }
      })

      if (enchs.length !== 0) {
        this.nbt.value[isBook ? 'StoredEnchantments' : enchListName] = { type: 'list', value: { type: 'compound', value: enchs } }
      }

      if (mcData.isNewerOrEqualTo('1.13') && mcData.itemsByName[this.name].maxDurability) this.nbt.value.Damage = { type: 'int', value: 0 }
    }

    get durabilityUsed () {
      if (Object.keys(this).length === 0) return null
      if (mcData.isNewerOrEqualTo('1.13')) {
        return this?.nbt?.value?.Damage?.value ?? 0
      } else {
        return this.metadata ?? 0
      }
    }

    set durabilityUsed (value) {
      if (mcData.isNewerOrEqualTo('1.13')) {
        if (!this?.nbt) this.nbt = { name: '', type: 'compound', value: {} }
        this.nbt.value.Damage = { type: 'int', value }
      } else {
        this.metadata = value
      }
    }
  }

  Item.anvil = require('./lib/anvil.js')(mcData, Item)
  return Item
}

module.exports = loader
