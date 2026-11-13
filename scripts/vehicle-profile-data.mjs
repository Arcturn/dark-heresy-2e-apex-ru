/** Exact stock profile and weapon signatures from Apex b3482f7. Display translations use this module's existing compendiums. */
export default {
  "profiles": {
    "hectin-autocarriage": {
      "fields": {
        "enabled": true,
        "key": "hectin-autocarriage",
        "type": "wheeled",
        "traits": [
          "enclosed",
          "rugged",
          "wheeled"
        ],
        "armour": {
          "front": 15,
          "side": 10,
          "rear": 8
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 15,
        "cruisingSpeed": 70,
        "manoeuvrability": 10,
        "size": "enormous",
        "carryingCapacity": 5,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "rare",
        "threat": 5,
        "crewRoles": [
          "driver"
        ],
        "firingPoints": [],
        "onFire": 0,
        "notes": "Gang Wheels: may replace Enclosed with Open-Topped, Carrying Capacity 8. Hectins from the Dawn: Skimmer instead of Wheeled, Availability Unique (-60). Weapons: none; if Open-Topped, any Basic weapon can be Pintle-mounted."
      },
      "wounds": 20,
      "mounts": []
    },
    "glassteed": {
      "fields": {
        "enabled": true,
        "key": "glassteed",
        "type": "walker",
        "traits": [
          "living",
          "open-topped",
          "walker"
        ],
        "armour": {
          "front": 8,
          "side": 8,
          "rear": 8
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 5,
        "cruisingSpeed": 30,
        "manoeuvrability": 25,
        "size": "enormous",
        "carryingCapacity": 0,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "rare",
        "threat": 3,
        "crewRoles": [
          "driver"
        ],
        "firingPoints": [],
        "onFire": 0,
        "notes": "Living steed: ridden with Survival (Wrangling, p. 116) instead of Operate."
      },
      "wounds": 20,
      "mounts": [
        {
          "mount": "natural",
          "facing": "",
          "crew": "",
          "names": [
            "Dagger Teeth"
          ]
        }
      ]
    },
    "veloxic-bike": {
      "fields": {
        "enabled": true,
        "key": "veloxic-bike",
        "type": "wheeled",
        "traits": [
          "bike",
          "wheeled"
        ],
        "armour": {
          "front": 8,
          "side": 8,
          "rear": 8
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 35,
        "cruisingSpeed": 90,
        "manoeuvrability": 20,
        "size": "hulking",
        "carryingCapacity": 0,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "average",
        "threat": 4,
        "crewRoles": [
          "driver"
        ],
        "firingPoints": [],
        "onFire": 0,
        "notes": "Passenger: carries 1 passenger, Manoeuvrability +10 while doing so. Armed Bikers: may mount an autogun firing in the forward arc (Availability Scarce)."
      },
      "wounds": 10,
      "mounts": [
        {
          "mount": "fixed",
          "facing": "front",
          "crew": "",
          "names": [
            "Autogun"
          ]
        }
      ]
    },
    "chimera": {
      "fields": {
        "enabled": true,
        "key": "chimera",
        "type": "tracked",
        "traits": [
          "amphibious",
          "enclosed",
          "rugged",
          "tracked"
        ],
        "armour": {
          "front": 30,
          "side": 22,
          "rear": 16
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 15,
        "cruisingSpeed": 70,
        "manoeuvrability": 0,
        "size": "massive",
        "carryingCapacity": 12,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "extremelyRare",
        "threat": 30,
        "crewRoles": [
          "commander",
          "driver",
          "gunner"
        ],
        "firingPoints": [
          {
            "kind": "ports",
            "count": 3
          },
          {
            "kind": "hatch",
            "count": 1
          }
        ],
        "onFire": 0,
        "notes": "Passenger Weaponry: three firing ports per flank for Basic or Pistol weapons (may be replaced with mounted lasguns); the top hatch is an entry point and a firing point (Heavy weapons only while stationary)."
      },
      "wounds": 35,
      "mounts": [
        {
          "mount": "turret",
          "facing": "",
          "crew": "commander",
          "names": [
            "Multilaser",
            "Heavy Bolter",
            "Autocannon",
            "Heavy Flamer"
          ]
        },
        {
          "mount": "hull",
          "facing": "front",
          "crew": "gunner",
          "names": [
            "Heavy Bolter",
            "Heavy Flamer"
          ]
        },
        {
          "mount": "pintle",
          "facing": "",
          "crew": "",
          "names": [
            "Storm Bolter",
            "Heavy Stubber"
          ]
        }
      ]
    },
    "hectin-gang-wheels": {
      "fields": {
        "enabled": true,
        "key": "hectin-gang-wheels",
        "type": "wheeled",
        "traits": [
          "open-topped",
          "rugged",
          "wheeled"
        ],
        "armour": {
          "front": 15,
          "side": 10,
          "rear": 8
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 15,
        "cruisingSpeed": 70,
        "manoeuvrability": 10,
        "size": "enormous",
        "carryingCapacity": 8,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "rare",
        "threat": 5,
        "crewRoles": [
          "driver"
        ],
        "firingPoints": [],
        "onFire": 0,
        "notes": "Gang Wheels: Enclosed replaced with Open-Topped, Carrying Capacity 8. Weapons: none; any separately acquired Basic weapon can be Pintle-mounted."
      },
      "wounds": 20,
      "mounts": []
    },
    "hectin-dawn": {
      "fields": {
        "enabled": true,
        "key": "hectin-dawn",
        "type": "skimmer",
        "traits": [
          "enclosed",
          "rugged",
          "skimmer"
        ],
        "armour": {
          "front": 15,
          "side": 10,
          "rear": 8
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 15,
        "cruisingSpeed": 70,
        "manoeuvrability": 10,
        "size": "enormous",
        "carryingCapacity": 5,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "unique",
        "threat": 5,
        "crewRoles": [
          "driver"
        ],
        "firingPoints": [],
        "onFire": 0,
        "notes": "Hectins from the Dawn: an ancient anti-grav model; Skimmer instead of Wheeled, Availability Unique (-60). Weapons: none."
      },
      "wounds": 20,
      "mounts": []
    },
    "veloxic-armed-bikers": {
      "fields": {
        "enabled": true,
        "key": "veloxic-armed-bikers",
        "type": "wheeled",
        "traits": [
          "bike",
          "wheeled"
        ],
        "armour": {
          "front": 8,
          "side": 8,
          "rear": 8
        },
        "armourLoss": {
          "front": 0,
          "side": 0,
          "rear": 0
        },
        "tacticalSpeed": 35,
        "cruisingSpeed": 90,
        "manoeuvrability": 20,
        "size": "hulking",
        "carryingCapacity": 0,
        "speedLoss": 0,
        "conditions": [],
        "turretBreached": false,
        "availability": "scarce",
        "threat": 4,
        "crewRoles": [
          "driver"
        ],
        "firingPoints": [],
        "onFire": 0,
        "notes": "Passenger: carries 1 passenger, Manoeuvrability +10 while doing so. Armed Bikers: a single autogun firing in the forward arc, Availability Scarce."
      },
      "wounds": 10,
      "mounts": [
        {
          "mount": "fixed",
          "facing": "front",
          "crew": "",
          "names": [
            "Autogun"
          ]
        }
      ]
    }
  },
  "weapons": {
    "Dagger Teeth": {
      "nameRu": "Зубы-кинжалы",
      "description": "",
      "descriptionRu": "",
      "dh2e": {
        "reload": "",
        "page": null,
        "gearKey": "",
        "weaponClass": "melee",
        "weaponGroup": "",
        "qualities": "",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": false,
          "semi": 0,
          "full": 0
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "1d10",
        "damageTypeKey": "rending",
        "damageTypes": [
          {
            "key": "rending",
            "percent": 100
          }
        ],
        "skillKey": "meleeCombat",
        "penetration": "1",
        "maxRangeMeters": "2",
        "effectiveRange": {
          "value": "1",
          "max": "2"
        },
        "magazine": {
          "value": 0,
          "max": 0
        },
        "resourceCosts": [],
        "availableActions": {
          "meleeAttack": true,
          "aimedMeleeAttack": true,
          "snapshot": false,
          "aimedShot": false,
          "burst": false,
          "volley": false,
          "push": false,
          "reload": false
        },
        "burst": {
          "count": 1
        },
        "reload": {
          "actionPointCost": 0
        }
      }
    },
    "Autogun": {
      "nameRu": "Автоган",
      "description": "<p>While not as commonplace as lasguns in military formations, many local forces rely on these sturdy and inexpensive weapons to defend their home world from threats within or without. They use common, low-calibre shells in standardised clips, and can be set to fire in single, semi-automatic, or full-automatic modes making them as versatile as they are simple to construct and supply.</p><p>p. 155</p>",
      "descriptionRu": "<p>Хотя автоганы не так часто, как лазганы, их можно увидеть в воинских формированиях, многие локальные силы полагаются на это крепкое и недорогое вооружение, защищая свой родной мир от внутренних или внешних угроз. Они используют обычные малокалиберные боеприпасы в стандартизованных магазинах и могут быть стрелять одиночными выстрелами, а также короткими и длинными очередями, что делает их настолько же универсальными, насколько они просты в производстве и обслуживании.</p><p>стр. 189</p>",
      "dh2e": {
        "reload": "1 full",
        "page": null,
        "gearKey": "",
        "weaponClass": "basic",
        "weaponGroup": "",
        "qualities": "",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": true,
          "semi": 3,
          "full": 0
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "1d10+3",
        "damageTypeKey": "impact",
        "damageTypes": [
          {
            "key": "impact",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "0",
        "maxRangeMeters": "400",
        "effectiveRange": {
          "value": "100",
          "max": "100"
        },
        "magazine": {
          "value": 30,
          "max": 30
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": true,
          "aimedShot": true,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 3
        },
        "reload": {
          "actionPointCost": 2
        }
      }
    },
    "Multilaser": {
      "nameRu": "Мультилазер",
      "description": "",
      "descriptionRu": "",
      "dh2e": {
        "reload": "2 full",
        "page": null,
        "gearKey": "",
        "weaponClass": "vehicle",
        "weaponGroup": "",
        "qualities": "Reliable",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": false,
          "semi": 0,
          "full": 5
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "2d10+10",
        "damageTypeKey": "energy",
        "damageTypes": [
          {
            "key": "energy",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "2",
        "maxRangeMeters": "600",
        "effectiveRange": {
          "value": "150",
          "max": "150"
        },
        "magazine": {
          "value": 100,
          "max": 100
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": false,
          "aimedShot": false,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 5
        },
        "reload": {
          "actionPointCost": 4
        }
      }
    },
    "Heavy Bolter": {
      "nameRu": "Тяжелый болтер",
      "description": "<p>This huge weapon is rarely used outside of military forces, but sometimes is all that stands against some of the terrors of the Ruinous Powers. The larger shells carry additional propellant and stronger explosive charges, making them deadly against armoured foes at long ranges.</p><p>p. 151</p>",
      "descriptionRu": "<p>Это огромное оружие редко используют вне военных частей, но порой только оно способно противостоять ужасам Губительных сил. Увеличенные снаряды несут больше метательного вещества и более мощные взрывные заряды, смертоносные для бронированных врагов на дальних дистанциях.</p><p>стр. 184</p>",
      "dh2e": {
        "reload": "2 full",
        "page": null,
        "gearKey": "",
        "weaponClass": "heavy",
        "weaponGroup": "",
        "qualities": "Tearing",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": false,
          "semi": 0,
          "full": 6
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "1d10+8",
        "damageTypeKey": "explosive",
        "damageTypes": [
          {
            "key": "explosive",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "5",
        "maxRangeMeters": "600",
        "effectiveRange": {
          "value": "150",
          "max": "150"
        },
        "magazine": {
          "value": 60,
          "max": 60
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": false,
          "aimedShot": false,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 6
        },
        "reload": {
          "actionPointCost": 4
        }
      }
    },
    "Autocannon": {
      "nameRu": "Автопушка",
      "description": "<p>Autocannons are heavy, powerful weapons that can devastate light vehicles and armoured foes alike with long ranged firepower. They are commonly mounted on tanks or crewed with infantry teams in Imperial armies, but can also be found in the unclean hands of insurrectionists and heretical forces.</p><p>p. 155</p>",
      "descriptionRu": "<p>Автопушки — тяжелое, мощное оружие, способное уничтожать как легкую технику, так и бронированных врагов на дальней дистанции. Они обычно устанавливаются на танках или приданы расчетам пехоты в имперских армиях, но также могут быть найдены в нечестивых руках повстанцев и еретических войск.</p><p>стр. 189</p>",
      "dh2e": {
        "reload": "2 full",
        "page": null,
        "gearKey": "",
        "weaponClass": "heavy",
        "weaponGroup": "",
        "qualities": "Reliable",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": true,
          "semi": 3,
          "full": 0
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "3d10+8",
        "damageTypeKey": "impact",
        "damageTypes": [
          {
            "key": "impact",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "6",
        "maxRangeMeters": "1200",
        "effectiveRange": {
          "value": "300",
          "max": "300"
        },
        "magazine": {
          "value": 40,
          "max": 40
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": true,
          "aimedShot": true,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 3
        },
        "reload": {
          "actionPointCost": 4
        }
      }
    },
    "Heavy Flamer": {
      "nameRu": "Тяжелый огнемет",
      "description": "<p>Large and terrifying, heavy flamers use two muzzles to create huge blasts of fire that can incinerate entire swaths of enemies in a single shot. Only the strongest can carry the weapon as well as the massive backpack of fuel it requires, but its presence has turned the tide against many a heretical attack.</p><p>p. 152</p>",
      "descriptionRu": "<p>Огромные и ужасающие, тяжелые огнеметы используют два дула, что б создать огромные взрывы огня, испепеляющие ряды врагов одним выстрелом. Только сильнейшие могут нести это оружие вместе с необходимым громадным топливным баком, но его присутствие обернуло события против многих еретических атак.</p><p>стр. 185</p>",
      "dh2e": {
        "reload": "2 full",
        "page": null,
        "gearKey": "",
        "weaponClass": "heavy",
        "weaponGroup": "",
        "qualities": "Flame, Spray",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": true,
          "semi": 2,
          "full": 4
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "1d10+5",
        "damageTypeKey": "energy",
        "damageTypes": [
          {
            "key": "energy",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "4",
        "maxRangeMeters": "360",
        "effectiveRange": {
          "value": "90",
          "max": "90"
        },
        "magazine": {
          "value": 20,
          "max": 20
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": true,
          "aimedShot": true,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 4
        },
        "reload": {
          "actionPointCost": 4
        }
      }
    },
    "Storm Bolter": {
      "nameRu": "Шторм-болтер",
      "description": "<p>Storm bolters combine the firing power of two boltguns into one compact weapon. They fire an unstoppable hail of metal that can tear apart groups of enemies in a single salvo, and can bring a furious charge to a dead halt in moments.</p><p>p. 151</p>",
      "descriptionRu": "<p>Шторм-болтеры объединяют огневую мощь двух болтеров в одном компактном оружии. Их стрельба — неостановимый град металла, который может разорвать на части группу врагов одним залпом и остановить яростную атаку за несколько мгновений.</p><p>стр. 184</p>",
      "dh2e": {
        "reload": "full",
        "page": null,
        "gearKey": "",
        "weaponClass": "basic",
        "weaponGroup": "",
        "qualities": "Storm, Tearing",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": true,
          "semi": 2,
          "full": 4
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "1d10+5",
        "damageTypeKey": "explosive",
        "damageTypes": [
          {
            "key": "explosive",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "4",
        "maxRangeMeters": "360",
        "effectiveRange": {
          "value": "90",
          "max": "90"
        },
        "magazine": {
          "value": 60,
          "max": 60
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": true,
          "aimedShot": true,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 4
        },
        "reload": {
          "actionPointCost": 2
        }
      }
    },
    "Heavy Stubber": {
      "nameRu": "Тяжелый стаббер",
      "description": "<p>Heavy stubbers are common both on the battlefield and in the underhive, as many times there is little difference between the two locations. Relatively simple to produce and maintain, they use standard ammunition that can provide a hail of suppressive fire against infantry and light vehicles. Few have the muscles to fire one, especially with its infamous recoil, so most users rely on a bipod or other support. Like all stub weapons, heavy stubbers come in many forms and use many ammunition intakes, such as long belt feeds, huge clips, or wide drums.</p><p>p. 156</p>",
      "descriptionRu": "<p>Тяжелые стабберы распространены как на поле боя, так и в подулье, ведь как разницы между этими двумя местами мало. Относительно простые в изготовлении и обслуживании, они используют стандартные боеприпасы, которые могут подавлять градом огня пехоту и легкую технику. Только у некоторых достаточно мускулов, чтобы стрелять из них, особенно учитывая печально известную отдачу, так что большинство использующих стабберы полагается на сошки или другую опору. Как и все виды стаб-оружия, тяжёлые стабберы имеют разные формы и используют множество боеприпасов, например, длинную ленту, огромные магазины или широкие барабаны.</p><p>стр. 189</p>",
      "dh2e": {
        "reload": "2 full",
        "page": null,
        "gearKey": "",
        "weaponClass": "heavy",
        "weaponGroup": "",
        "qualities": "",
        "craftsmanship": "common",
        "availability": "average",
        "rof": {
          "single": false,
          "semi": 0,
          "full": 8
        },
        "fatigueTest": false,
        "twoHanded": false
      },
      "weapon": {
        "enabled": true,
        "damage": "1d10+4",
        "damageTypeKey": "impact",
        "damageTypes": [
          {
            "key": "impact",
            "percent": 100
          }
        ],
        "skillKey": "rangedCombat",
        "penetration": "3",
        "maxRangeMeters": "400",
        "effectiveRange": {
          "value": "100",
          "max": "100"
        },
        "magazine": {
          "value": 80,
          "max": 80
        },
        "resourceCosts": [
          {
            "type": "magazine",
            "amount": 1,
            "formula": "1"
          }
        ],
        "availableActions": {
          "meleeAttack": false,
          "aimedMeleeAttack": false,
          "snapshot": false,
          "aimedShot": false,
          "burst": true,
          "volley": false,
          "push": false,
          "reload": true
        },
        "burst": {
          "count": 8
        },
        "reload": {
          "actionPointCost": 4
        }
      }
    }
  },
  "displayProfiles": {
    "hectin-autocarriage": {
      "en": "Hectin Autocarriage",
      "ru": "Автокарета «Хектен»",
      "page": 190,
      "notes": "Gang Wheels: may replace Enclosed with Open-Topped, Carrying Capacity 8. Hectins from the Dawn: Skimmer instead of Wheeled, Availability Unique (-60). Weapons: none; if Open-Topped, any Basic weapon can be Pintle-mounted.",
      "notesRu": "Банды на колёсах: можно заменить черту «Закрытый» на «Открытый», увеличив вместимость до 8. Истоки: вместо черты «Колёсная машина» используется «Глиссер»; доступность — уникальная (−60). Штатного оружия нет. При открытом кузове можно установить любое основное стрелковое оружие на шкворневой установке.",
      "descriptionRu": "<h3>Автокарета «Хектен» (стр. 190)</h3><p>Уровень угрозы: 5.</p><p><strong>Банды на колёсах:</strong> можно заменить черту «Закрытый» на «Открытый», увеличив вместимость до 8.</p><p><strong>Истоки:</strong> вместо черты «Колёсная машина» используется «Глиссер»; доступность — уникальная (−60).</p><p>Штатного оружия нет. При открытом кузове можно установить любое основное стрелковое оружие на шкворневой установке.</p>"
    },
    "glassteed": {
      "en": "Glassteed",
      "ru": "Стеклянный скакун",
      "page": 190,
      "notes": "Living steed: ridden with Survival (Wrangling, p. 116) instead of Operate.",
      "notesRu": "Живое верховое животное: для езды на стеклянном скакуне вместо умения «Управление» применяется «Выживание» (обращение с животными, стр. 116).",
      "descriptionRu": "<h3>Стеклянный скакун (стр. 190)</h3><p>Уровень угрозы: 3.</p><p><strong>Живое верховое животное:</strong> для езды на стеклянном скакуне вместо умения «Управление» применяется «Выживание» (обращение с животными, стр. 116).</p>"
    },
    "veloxic-bike": {
      "en": "Veloxic Bike",
      "ru": "Велоксик",
      "page": 190,
      "notes": "Passenger: carries 1 passenger, Manoeuvrability +10 while doing so. Armed Bikers: may mount an autogun firing in the forward arc (Availability Scarce).",
      "notesRu": "Пассажир: перевозит одного пассажира; при этом манёвренность увеличивается на +10. Вооружённые байкеры: на велоксик можно установить автоган с сектором обстрела вперёд; доступность такого варианта — «Редко».",
      "descriptionRu": "<h3>Велоксик (стр. 190)</h3><p>Уровень угрозы: 4.</p><p><strong>Пассажир:</strong> перевозит одного пассажира; при этом манёвренность увеличивается на +10.</p><p><strong>Вооружённые байкеры:</strong> на велоксик можно установить автоган с сектором обстрела вперёд; доступность такого варианта — «Редко».</p>"
    },
    "chimera": {
      "en": "Chimera Armoured Transport",
      "ru": "Бронетранспортер «Химера»",
      "page": 191,
      "notes": "Passenger Weaponry: three firing ports per flank for Basic or Pistol weapons (may be replaced with mounted lasguns); the top hatch is an entry point and a firing point (Heavy weapons only while stationary).",
      "notesRu": "Вооружение пассажиров: по три бойницы на каждом борту для стрельбы из основного или пистолетного оружия; вместо них могут быть установлены лазганы. Верхний люк служит для входа и стрельбы; из тяжёлого оружия через него можно стрелять лишь тогда, когда транспорт стоит на месте.",
      "descriptionRu": "<h3>Бронетранспортер «Химера» (стр. 191)</h3><p>Уровень угрозы: 30.</p><p><strong>Вооружение пассажиров:</strong> по три бойницы на каждом борту для стрельбы из основного или пистолетного оружия; вместо них могут быть установлены лазганы. Верхний люк служит для входа и стрельбы; из тяжёлого оружия через него можно стрелять лишь тогда, когда транспорт стоит на месте.</p>"
    },
    "hectin-gang-wheels": {
      "en": "Hectin Autocarriage (Gang Wheels)",
      "ru": "Автокарета «Хектен» (Банды на колёсах)",
      "page": 190,
      "notes": "Gang Wheels: Enclosed replaced with Open-Topped, Carrying Capacity 8. Weapons: none; any separately acquired Basic weapon can be Pintle-mounted.",
      "notesRu": "Банды на колёсах: черта «Закрытый» заменена на черту «Открытый», вместимость — 8 пассажиров. Штатного оружия нет. Любое отдельно полученное основное стрелковое оружие можно установить на шкворневой установке.",
      "descriptionRu": "<h3>Автокарета «Хектен» (Банды на колёсах, стр. 190)</h3><p>Уровень угрозы: 5.</p><p><strong>Банды на колёсах:</strong> черта «Закрытый» заменена на черту «Открытый», вместимость — 8 пассажиров.</p><p>Штатного оружия нет. Любое отдельно полученное основное стрелковое оружие можно установить на шкворневой установке.</p>"
    },
    "hectin-dawn": {
      "en": "Hectin Autocarriage (Hectins from the Dawn)",
      "ru": "Автокарета «Хектен» (Истоки)",
      "page": 190,
      "notes": "Hectins from the Dawn: an ancient anti-grav model; Skimmer instead of Wheeled, Availability Unique (-60). Weapons: none.",
      "notesRu": "Истоки: редкая старинная модель с антигравитационным приводом. Вместо черты «Колёсная машина» получает черту «Глиссер». Доступность: уникальная (−60). Оружие отсутствует.",
      "descriptionRu": "<h3>Автокарета «Хектен» (Истоки, стр. 190)</h3><p>Уровень угрозы: 5.</p><p><strong>Истоки:</strong> редкая старинная модель с антигравитационным приводом. Вместо черты «Колёсная машина» получает черту «Глиссер». Доступность: уникальная (−60). Оружие отсутствует.</p>"
    },
    "veloxic-armed-bikers": {
      "en": "Veloxic Bike (Armed Bikers)",
      "ru": "Велоксик (вооружённые байкеры)",
      "page": 190,
      "notes": "Passenger: carries 1 passenger, Manoeuvrability +10 while doing so. Armed Bikers: a single autogun firing in the forward arc, Availability Scarce.",
      "notesRu": "Пассажир: перевозит одного пассажира; при этом манёвренность увеличивается на +10. Вооружённые байкеры: установлен один автоган с сектором обстрела вперёд. Доступность: «Редко».",
      "descriptionRu": "<h3>Велоксик (вооружённые байкеры, стр. 190)</h3><p>Уровень угрозы: 4.</p><p><strong>Пассажир:</strong> перевозит одного пассажира; при этом манёвренность увеличивается на +10.</p><p><strong>Вооружённые байкеры:</strong> установлен один автоган с сектором обстрела вперёд. Доступность: «Редко».</p>"
    }
  }
};
