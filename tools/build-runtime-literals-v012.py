#!/usr/bin/env python3
"""Build exact display-only source-literal translations for DH2e Apex 0.1.10.

Usage: python tools/build-runtime-literals-v012.py /path/to/original/system/src
All generated runtime data is static, Unicode-safe and does not alter the system.
"""
import json, re, sys
from pathlib import Path
from collections import defaultdict
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
SRC=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else None
if not SRC or not SRC.exists():raise SystemExit('Usage: python tools/build-runtime-literals-v012.py /path/to/source/system/src')
EN=json.loads((SRC.parent/'lang/en.json').read_text('utf8'))
RU=json.loads((ROOT/'lang/ru.json').read_text('utf8'))

def leaves(root, prefix=''):
    for k,v in root.items():
        key=f'{prefix}.{k}' if prefix else k
        if isinstance(v,dict):yield from leaves(v,key)
        else:yield key,v

class Strip(HTMLParser):
    def __init__(self):super().__init__();self.out=[]
    def handle_data(self,x):self.out.append(x)

def strip_tags(x):
    p=Strip();p.feed(x);return ' '.join(' '.join(p.out).split())

pack_names=defaultdict(set)
pack_entries={}
for pack in (ROOT/'compendium/ru').glob('*.json'):
    data=json.loads(pack.read_text('utf8'))
    for en,record in data['entries'].items():
        if isinstance(record,dict) and isinstance(record.get('name'),str) and record['name']:
            pack_names[en].add(record['name'])
            if 'dh2e-character' in pack.name:pack_entries[en]=record

SOURCE_LITERAL=re.compile(r'''\b(?P<key>label|title|tooltip|hint|message|placeholder|description|text|short|typeName|name|ariaLabel|labelText|headerText)\s*:\s*(['"])(?P<val>[^'"\n]{3,130})\2''')
sources=defaultdict(set)
for path in SRC.rglob('*.mjs'):
    data=path.read_text('utf8')
    for m in SOURCE_LITERAL.finditer(data):
        val=m['val']
        if not re.search('[A-Za-z]{3}',val) or val.startswith(('FALLOUTMAW.','dh2e','fa-','data-','system.','ui.','<','--','.')) or '/' in val:continue
        sources[val].add(str(path.relative_to(SRC)))

localized=defaultdict(set)
for k,en in leaves(EN):
    if en in sources and k in RU and isinstance(RU[k],str) and RU[k]:localized[en].add(RU[k])

# Each of these is a source-owned fixed string. They are ONLY used for exact
# display replacements inside identifiable Dark Heresy UI, never as stored data.
MANUAL={
'Average':'Средний',
'Basic':'Основное',
'Trade':'Ремесло',
'Talents':'Таланты',
'Global Map Root Scene ID':'ID корневой сцены глобальной карты',
'Document Migration Version':'Версия переноса документов',
'Settings Preset State':'Состояние набора настроек',
'Fallout content removal':'Удаление контента Fallout',
'Token Action HUD':'Панель действий токена',
'Token Action HUD Scale':'Масштаб панели действий токена',
'Token Action HUD Collapsed Sections':'Свёрнутые разделы панели токена',
'Token Action HUD Icons':'Значки панели действий токена',
'Token HUD Equipment Slots':'Ячейки снаряжения на панели токена',
'Token Prototype Defaults':'Стандартные параметры прототипа токена',
'Combat Carousel':'Боевая карусель',
'Combat Carousel Size':'Размер боевой карусели',
'Combat Carousel: Previous Turn':'Боевая карусель: предыдущий ход',
'Combat Carousel: Next Turn':'Боевая карусель: следующий ход',
'DH2e: Equipment':'DH2e: Снаряжение',
'DH2e: Character Creation':'DH2e: Создание персонажа',
'DH2e: Psychic Powers':'DH2e: Психосилы',
'Pistols':'Пистолеты',
'Power Maul':'Силовая дубинка',
'Thrown, Grenades and Missiles':'Метательное оружие, гранаты и ракеты',
'Talent Weapons':'Оружие, получаемое от талантов',
'Force Fields':'Силовые поля',
'Standard Clips':'Стандартные магазины',
'Custom Ammunition':'Специальные боеприпасы',
'Weapon Modifications':'Модификации оружия',
'Clothing and Personal Gear':'Одежда и личные вещи',
'Drugs and Consumables':'Препараты и расходные материалы',
'Cybernetics':'Кибернетика',
'Home Worlds':'Родные миры',
'Backgrounds':'Предыстории',
'Roles':'Роли',
'Elite Advance Talents':'Таланты элитных улучшений',
'Unfinished item use':'Незавершённое использование предмета',
'Effect applied: consume the item':'Эффект применён: израсходовать предмет',
'No effect: release the item':'Эффекта нет: вернуть предмет',
'Keep for review':'Оставить на проверку',
'Phobia':'Фобия',
'Fear of the Dead':'Страх перед мертвецами',
'Fear of Insects':'Страх перед насекомыми',
'Obsession/Compulsion':'Навязчивая идея / принуждение',
'Kleptomania':'Клептомания',
'Self-Mortification':'Самоистязание',
'The Flesh is Weak':'Плоть слаба',
'Visions and Voices':'Видения и голоса',
'Dead Acolyte':'Погибший аколит',
'Flashbacks':'Воспоминания-видения',
'Delusion':'Бредовые убеждения',
'Invulnerability':'Неуязвимость',
'Righteousness':'Непоколебимая правота',
'Horrific Nightmares':'Кошмарные сны',
'Stable':'Стабильный',
'Unsettled':'Встревоженный',
'Disturbed':'Расстроенный',
'Unhinged':'Неуравновешенный',
'Deranged':'Безумный',
'Terminally Insane—Character retires from play. Your service will be remembered.':'Полное безумие — персонаж выбывает из игры. Его служение не будет забыто.',
'Tainted':'Запятнанный',
'Soiled':'Осквернённый',
'Debased':'Падший',
'Profane':'Богохульный',
'Damned—Character is removed from play. Only in death can your soul be redeemed.':'Проклятый — персонаж выбывает из игры. Лишь смерть может искупить его душу.',
'Minor':'Лёгкое', 'Severe':'Тяжёлое','Acute':'Острое',

'Skill bonus / effects':'Бонус навыка / эффекты',
'Equipment / ability bonus':'Бонус снаряжения / способности',
'Range':'Дистанция',
'Ganging up':'Численное превосходство',
'Shooting into melee':'Стрельба в рукопашную схватку',
'Darkness / shadow':'Темнота / тень',
"Target's Hard Target":'Черта цели «Трудная цель»',
'Guarded Action':'Защитное действие',
'Pinned':'Прижат огнём',
'Attacking while Prone':'Атака лёжа',
'Target is Running':'Цель бежит',
'Target in Defensive Stance':'Цель в защитной стойке',
'Target is Prone':'Цель лежит',
'Target is Stunned':'Цель оглушена',
'Target in a Grapple':'Цель в захвате',
'Higher ground':'Преимущество высоты',
'Target at Low Altitude':'Цель на малой высоте',
'Weather / fog / terrain':'Погода / туман / местность',
'Standard Attack':'Стандартная атака',
'Called Shot':'Прицельный выстрел',
'Semi-Auto Burst':'Короткая очередь',
'Full Auto Burst':'Длинная очередь',
'Swift Attack':'Быстрая атака',
'Lightning Attack':'Молниеносная атака',
'All Out Attack':'Безрассудная атака',
'Charge':'Натиск',
'Manoeuvre':'Манёвр',
'Double Tap':'Двойной выстрел',
'Invisibility':'Невидимость',
'Short range':'Ближняя дистанция',
'Point Blank range':'Дистанция в упор',
'Standard range':'Обычная дистанция',
'Long range':'Дальняя дистанция',
'Extreme range':'Предельная дистанция',
'Unaware / Surprised target':'Неосведомлённая / застигнутая врасплох цель',
'Aim (Half Action)':'Прицеливание (полудействие)',
'Aim (Full Action)':'Прицеливание (полное действие)',
'Weapon qualities':'Свойства оружия',
'Craftsmanship':'Качество изготовления',
'Ammunition / modifications':'Боеприпасы / модификации',
'Weapon class (unbraced / one-handed)':'Класс оружия (без упора / в одной руке)',
'Two-weapon fighting':'Бой двумя оружиями',
'Talent attack':'Атака талантом',
'No Weapon Training':'Нет владения оружием',
'Assistance':'Помощь',
'Attack modifiers':'Модификаторы атаки',
'Social disposition':'Отношение собеседника',
'Item rules':'Правила предмета',
'Devastating Assault':'Опустошительный натиск',
'Advancement bonus':'Бонус развития',
'Percentage adjustment':'Процентная поправка',
'Foreboding':'Предчувствие',
'Counter Attack':'Контратака',
'Unarmed against an armed foe':'Безоружный против вооружённого противника',
'Vehicles':'Транспорт',
'Damaged weapon':'Повреждённое оружие',
'Target size':'Размер цели',
'Talents (Marksman, Precision Killer…)':'Таланты (Меткий стрелок, Точный убийца…)',
'Bionic arm (Poor): fine dexterity, Agility halved':'Бионическая рука (плохое качество): при точных движениях Ловкость уменьшается вдвое',
'Bionic lungs (Poor)':'Бионические лёгкие (плохое качество)',
'Synthmuscle (Best)':'Синтемускулы (лучшее качество)',
'Miniscule':'Крошечный', 'Puny':'Маленький', 'Scrawny':'Небольшой',
'Armour-glass, genatorium pipes, thin metal, wooden planks':'Бронестекло, трубы генератория, тонкий металл, деревянные доски',
'Flakboard, storage crates, sandbags, thick ice, trees':'Бронеплиты, ящики, мешки с песком, толстый лёд, деревья',
'Cogitator banks, stasis pods, standard barricades':'Блоки когитаторов, стазис-капсулы, обычные баррикады',
'Rockcrete, hatchways, thick iron, stone':'Рокрит, люки, толстое железо, камень',
'Armaplas, voidship bulkheads, plasteel':'Армапласт, переборки пустотного корабля, пласталь',
'Prescience':'Предвидение', 'Forewarning':'Предостережение','Invisibility':'Невидимость',
'Re-roll a test.':'Перебросить проверку.',
'Gain a +10 bonus to a test. This must be chosen before the dice are rolled.':'Получить бонус +10 к проверке. Решение принимается до броска кубиков.',
'Add 1 degree of success to a successful test. This may be chosen after the dice are rolled.':'Добавить одну степень успеха к успешной проверке. Решение можно принять после броска.',
'Count as having rolled 10 for Initiative.':'Считать, что при определении инициативы выпало 10.',
'Instantly remove 1d5 damage from the character. This cannot be used to remove Critical damage.':'Немедленно восстановить 1к5 Ран. Критический урон таким способом устранить нельзя.',
'Instantly recover from being Stunned.':'Немедленно снять состояние Оглушения.',
'Remove all levels of Fatigue.':'Снять все уровни Усталости.',
'Int+20':'Инт +20',
'Resistance (Psychic Powers)':'Сопротивление (Психосилы)',
'Bastion of Iron Will':'Бастион железной воли',
'Coordinated Interrogation':'Согласованный допрос',
'Superior Chirurgeon':'Превосходный хирург',
'Bulging Biceps (Heft)':'Мощные бицепсы (перенос грузов)',
'Catfall (falling)':'Кошачье падение (падение)',
'Sister of Battle Canoness':'Канонисса Сестёр Битвы',
'Deathwatch Space Marine':'Космодесантник Караула Смерти',
'Eversor Assassin':'Ассасин Эверсор',
'Grey Knight Space Marine':'Космодесантник Серых Рыцарей',
'Amphibious':'Амфибия',
'Bike':'Мотоцикл',
'Bred for War':'Выведен для войны',
'Daemonic Possession':'Демоническая одержимость',
'Damage Control':'Борьба за живучесть',
'Immobile':'Неподвижный',
'Enclosed':'Закрытый',
'Enhanced Motive Systems':'Улучшенные ходовые системы',
'Environmentally Sealed':'Герметичный',
'Extremely Volatile':'Крайне взрывоопасный',
'Living':'Живой',
'Open-Topped':'С открытым верхом',
'Ramshackle':'Разваливающийся',
'Reinforced Armour':'Усиленная броня',
'Rugged':'Надёжный',
'Clear, open ground, paved roadway.':'Ровная открытая местность, мощёная дорога.',
'Rough graven road, cleared dry field.':'Неровная грунтовая дорога, расчищенное сухое поле.',
'Deep mud or standing water less than 20 cm deep, drifting sand, dense undergrowth and brush.':'Глубокая грязь, стоячая вода глубиной менее 20 см, зыбучий песок, густой подлесок и кустарник.',
'Flowing water about 1 metre deep, rocky and unstable terrain, thick forests or ruined cityscapes (fail by 4+ DoF: bogged down).':'Проточная вода глубиной около метра, каменистая и неустойчивая почва, густой лес или городские руины (4+ степени провала: застревание).',
'Straight ahead.':'Прямо по курсу.',
'Revered and ancient forge world; well-stocked repair facility.':'Почитаемый старинный мир-кузница; превосходно оснащённый ремонтный цех.',
'Field base with ample supplies; hive world of superior manufacturing prowess.':'Полевая база с большими запасами; мир-улей с высокоразвитым производством.',
'Area free from enemy fire; field encampment with basic supplies; hive world of standard prowess.':'Район вне вражеского огня; полевой лагерь с базовыми запасами; обычный мир-улей.',
'Required tools and supplies; calm weather or away from enemy fire.':'Необходимые инструменты и запасы; спокойная погода или отсутствие вражеского огня.',
'Rudimentary or faulty tools; close to battlefields; run-down forge world; open without facilities; inclement weather.':'Примитивные или неисправные инструменты; близость к полю боя; захудалый мир-кузница; открытая местность без укрытий; непогода.',
'Ruined forge world; storms, blizzards or sandstorms; insect swarms; under bombardment; primitive locale.':'Разрушенный мир-кузница; штормы, метели или песчаные бури; рои насекомых; обстрел; примитивная местность.',
'Insignificant':'Незначительный',
'Minor Disruption':'Небольшие помехи',
'Major Disruption':'Сильные помехи',
'Dead Zone':'Мёртвая зона',
'Prolonged Dead Zone':'Длительная мёртвая зона',
'Amorphous':'Аморфный',
'Auto-stabilised':'Автостабилизация',
'Brutal Charge':'Сокрушительный натиск',
'Burrower':'Землекоп',
'Crawler':'Ползун',
'Deadly Natural Weapons':'Смертоносное естественное оружие',
'Flyer':'Летун',
'From Beyond':'Из-за граней',
'Hoverer':'Парящий',
'Incorporeal':'Бестелесный',
'Machine':'Машина',
'Natural Armour':'Естественная броня',
'Nauseating':'Тошнотворный',
'Quadruped':'Четвероногий',
'Sanctioned':'Санкционированный',
'Sonar Sense':'Эхолокация',
'Soul Bound':'Связанный душой',
'Touched by the Fates':'Отмеченный Судьбой',
'Undying':'Неумирающий',
'Unnatural Characteristic':'Сверхъестественная характеристика',
'Unnatural Senses':'Сверхъестественные чувства',
'Warp Weapons':'Оружие Варпа',
'Natural Weapons':'Естественное оружие',
'Hectin Autocarriage':'Хектен',
'Glassteed':'Стеклянный скакун',
'Veloxic Bike':'Велоксик',
'Chimera Armoured Transport':'Бронетранспортёр «Химера»',
'Hectin Autocarriage (Gang Wheels)':'«Хектен» (бандитские колёса)',
'Hectin Autocarriage (Hectins from the Dawn)':'«Хектен» (Хектены с рассвета)',
'Veloxic Bike (Armed Bikers)':'«Велоксик» (вооружённые байкеры)',
'Luminen Shock':'Люминенный шок',
'Luminen Blast':'Люминенный взрыв',
'Dark Heresy Item':'Предмет Dark Heresy',
'Dark Heresy 2E [Apex Edition] V2':'Dark Heresy 2E [Apex Edition] — лист V2',
}

# Prefer original Russian book translations already present in Babele whenever a
# source item name is unambiguous. Manually reviewed overrides take precedence.
labels={}
for source in sources:
    if source in MANUAL:labels[source]=MANUAL[source];continue
    candidate=pack_names.get(source,set())
    if len(candidate)==1:
        labels[source]=next(iter(candidate));continue
    option=localized.get(source,set())
    if len(option)==1:labels[source]=next(iter(option));continue
for source,translation in MANUAL.items():labels[source]=translation

fear_src=(SRC/'rolls/dh2e-fear.mjs').read_text('utf8')

def section(table):
    return fear_src.split(f'export const DH2E_{table} = Object.freeze([',1)[1].split('].map(Object.freeze)',1)[0]

def values(table,field):
    # All scalar table text is written as a JS double-quoted literal in v0.1.10.
    part=section(table)
    return [json.loads(raw) for raw in re.findall(r'(?:"'+field+r'"|\b'+field+r')\s*:\s*("(?:\\.|[^"\\])*")',part)]

SHOCK_SUMMARIES_RU=[
'Вздрогнул: в следующий ход только одно полудействие',
'Дрожь: −10 ко всем проверкам до конца столкновения',
'Отступает от источника страха; −10 ко всем проверкам',
'Оцепенение: не действует, пока не придёт в себя; затем −10',
'Паника: убегает; если удержан, только полудействия со штрафом −20',
'Обморок: без сознания 1к5 раундов; затем штраф −10',
'Потрясение на 1к5 раундов: роняет всё, что держал; затем одно полудействие за ход',
'Истерика: атакует всех вокруг, пока не придёт в себя',
'Нервный срыв на 1к5+1 раундов; затем −20 ко всем проверкам',
'Кататония: без сознания 1к5 часов',
'Остановка сердца: проверка Выносливости или смерть; при успехе без сознания 1к5 часов',
]
SHOCK_EFFECTS_RU=[
'Персонаж сильно напуган. В следующий ход он может совершить только одно полудействие, после чего действует как обычно.',
'Страх охватывает персонажа, вызывая сильную дрожь. До конца столкновения он получает штраф −10 ко всем проверкам, если только не сумеет прийти в себя (см. «Шок и восстановление самообладания», стр. 286).',
'Потрясённый персонаж отступает от источника страха. Он не может добровольно приближаться к нему, но в остальном действует как обычно, получая штраф −10 ко всем проверкам до конца столкновения.',
'Персонаж застывает от ужаса и не может действовать, пока не возьмёт себя в руки (см. стр. 286). После этого до конца столкновения все его проверки получают штраф −10.',
'Персонажа охватывает паника. Если возможно, он должен как можно быстрее бежать от источника страха. Если бежать не удаётся, ему доступны лишь полудействия, а все проверки получают штраф −20. Оказавшись в безопасности, он должен успешно восстановить самообладание (см. стр. 286).',
'Персонаж падает в обморок и остаётся без сознания на 1к5 раундов. Придя в себя, он продолжает испытывать потрясение и получает штраф −10 ко всем проверкам до конца столкновения.',
'Персонаж кричит и неудержимо блюёт на протяжении 1к5 раундов. Всё это время он не может действовать и роняет всё, что держал. После этого до конца столкновения ему доступно лишь одно полудействие за ход.',
'Персонаж истерически хохочет и в припадке безумия атакует всех, кто находится рядом: беспорядочно стреляет или размахивает первым попавшимся оружием. Эффект длится, пока он не восстановит самообладание (см. стр. 286), не потеряет сознание или не будет иным образом обезврежен.',
'Персонаж падает на землю и 1к5+1 раундов рыдает, бормочет бессвязные слова и терзает собственную плоть, не имея возможности делать что-либо ещё. Даже придя в себя, до конца столкновения он получает штраф −20 ко всем проверкам.',
'Разум персонажа не выдерживает. Он впадает в кататонию на 1к5 часов: всё это время находится без сознания, и привести его в чувство невозможно.',
'Ужас настолько велик, что сердце персонажа останавливается. Он должен успешно пройти Заурядную (+0) проверку Выносливости или умереть. При успехе он всё равно теряет сознание на 1к5 часов, и привести его в чувство в это время невозможно.',
]
TRAUMAS_RU=[
'Персонаж замыкается в себе и становится молчаливым. На 3к10 часов он получает штраф −10 ко всем проверкам Общительности.',
'Персонаж вынужден постоянно повторять навязчивое действие (например, лихорадочно молиться или бесконечно чистить оружие), почти не обращая внимания ни на что другое. Он получает штраф −10 ко всем проверкам Интеллекта, Общительности и Восприятия на 3к10 часов.',
'Персонаж повсюду видит опасность и вздрагивает от любого шороха. В течение следующих 1к5 дней он получает бонус +10 к проверкам Восприятия и штраф −10 к проверкам Силы воли.',
'У персонажа развивается временная тяжёлая фобия (см. «Получение психических расстройств», стр. 287). Эффект длится 1к5 дней.',
'Малейшее напряжение вызывает у персонажа сильное возбуждение. Перед любой задачей, требующей проверки, он должен пройти проверку Силы воли; при провале сама проверка получает штраф −10. Во время боя штраф −10 применяется ко всем проверкам. Эффект длится 1к5 дней.',
'Во сне персонажа мучают яркие кошмары. На следующий день и ещё на 1к10 дней он изнурён недосыпанием и получает один уровень Усталости.',
'Персонаж теряет дар речи и не может говорить в течение 1к5 дней.',
'Персонаж полностью подавлен и не способен сосредоточиться; он отказывается от еды и питья и выглядит крайне истощённым. Все его характеристики уменьшаются на 10 (но не ниже 1) на 1к10 дней.',
'У персонажа начинается приступ истерии, и он временно слепнет или глохнет на 1к10 дней.',
'Психическая травма делает персонажа почти невосприимчивым к происходящему. Он не может самостоятельно начинать действия, но его можно осторожно вести за собой. Эффект длится 1к10 дней.',
]
# Five mental-disorder groups and their nine official example descriptions
# appear in the source outside the 9 regular Babele pack text files.
DISORDER_EFFECTS_RU=[
'Персонаж испытывает глубокий страх перед определённым предметом или обстоятельством. Чтобы взаимодействовать с источником своей фобии, он должен успешно пройти проверку Силы воли. Принудительное или чрезмерное столкновение с причиной страха может потребовать проверку Страха.',
'Персонаж испытывает стойкий страх и отвращение к трупам и мертвецам и не может долго находиться рядом с ними. Возможно, причина в том, что некоторые из них не желают оставаться мёртвыми — или отдают свою плоть чужим сущностям…',
'Шуршащие панцирные твари со множеством лап преследуют персонажа в кошмарах наяву. Они безликие, бесчисленные и голодные — вечно голодные.',
'Персонаж одержим определённой идеей или испытывает непреодолимую тягу к повторению какого-либо действия. Чтобы не поддаться навязчивому порыву или не последовать за своей одержимостью при удобном случае, он должен пройти проверку Силы воли.',
'При первой возможности персонаж испытывает непреодолимое желание украсть мелкие предметы. Часто украденное не имеет для него никакой ценности: важно само действие.',
'Персонаж ощущает потребность регулярно бичевать и истязать собственную плоть, чтобы искупить грехи поступков страданием. Навязчивость может быть связана с определённым событием, например убийством или нечестивыми мыслями.',
'Персонаж винит ограничения собственного тела во всех неудачах и бедах. Его всё сильнее поглощает идея хирургических изменений и замены плоти бионическими протезами.',
'Персонаж видит то, чего не существует, и слышит голоса, недоступные другим. При острой форме расстройства видения могут полностью поглотить его сознание.',
'Персонажу слышится голос давно погибшего товарища — возможно, другого аколита, которого он не смог спасти или который пожертвовал собой ради него. При тяжёлой форме расстройства он может увидеть этого друга, а при острой — даже беседовать с ним.',
'Персонаж вновь и вновь переживает травмирующие эпизоды своей жизни, нередко особенно жестокие схватки с культистами. Продолжительность и яркость этих воспоминаний зависят от тяжести расстройства.',
'Персонаж придерживается ложного убеждения и действует так, будто оно истинно, вопреки здравому смыслу и любым доказательствам обратного.',
'Персонаж верит, что никогда не получит серьёзных ран — благодаря удаче или божественному провидению. Чтобы не броситься на заведомо превосходящие силы вместо разумной осторожности, он должен пройти проверку Силы воли.',
'Персонаж убеждён, что его решения всегда правильны и оправданны, какой бы ни была их цена. Он может безжалостно посылать союзников на верную смерть, продолжая безнадёжный штурм, даже когда все обстоятельства требуют изменить тактику.',
'Персонажа терзают яркие повторяющиеся кошмары: отказ поля Геллера или собственное расчленение людьми в масках, пока он беспомощен. После каждого напряжённого дня он должен пройти проверку Силы воли, чтобы спокойно спать. При провале на следующий день он получает один уровень Усталости (стр. 233).',
]

SEVERITY_EFFECTS_RU=[
'Проявления расстройства редки, а навязчивые побуждения сравнительно слабы. Проверки на подавление расстройства получают бонус +10.',
'Расстройство выражено сильнее и может проявляться регулярно. Проверки на подавление расстройства выполняются без модификатора.',
'Расстройство крайне тяжёлое и срабатывает при малейшем раздражителе. Проверки на подавление расстройства получают штраф −10.',
]

sanity={}
for table,field,translations in [
    ('SHOCK','summary',SHOCK_SUMMARIES_RU),
    ('SHOCK','effect',SHOCK_EFFECTS_RU),
    ('MENTAL_TRAUMAS','effect',TRAUMAS_RU),
    ('MENTAL_DISORDERS','effect',DISORDER_EFFECTS_RU),
    ('DISORDER_SEVERITIES','effect',SEVERITY_EFFECTS_RU),
]:
    originals=values(table,field)
    assert len(originals)==len(translations),f'{table}.{field} expected {len(translations)}, got {len(originals)}'
    for en,ru in zip(originals,translations):
        assert en not in sanity or sanity[en]==ru, en
        sanity[en]=ru

# Malignancies and mutations carry the official Russian rule descriptions in
# the already translated character-creation compendium. Reuse those 37 texts.
for table in ('MALIGNANCIES','MUTATIONS'):
    originals=values(table,'effect')
    for en in originals:
        name,sep,rest=en.partition(': ')
        assert sep and name in pack_entries, f'{table}: no Russian compendium entry for {name}'
        record=pack_entries[name]
        russian_name=record['name']
        russian_description=strip_tags(record.get('description',''))
        assert russian_description and re.search('[А-Яа-яЁё]',russian_description),(name,record)
        sanity[en]=f'{russian_name}: {russian_description}'

# Other display-only book facts/standalone labels are translated by an exact
# source match. This is not a general machine translation of arbitrary text.
for key,value in MANUAL.items():
    if key in ('Unsettled','Deranged','Terminally Insane—Character retires from play. Your service will be remembered.') or key in sources:
        labels[key]=value

meta={
 'schemaVersion':1,'systemId':'dark-heresy-2e-apex', 'sourceSystemVersion':'0.1.10',
 'locale':'ru','note':'Only display text from source-owned runtime UI; no IDs/formulas/data modified.'
}
result={'_meta':meta,'labels':dict(sorted(labels.items())),'sanity':dict(sorted(sanity.items()))}
p=(ROOT/'data/runtime-literals.ru.json')
p.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
js=(ROOT/'scripts/runtime-literals.mjs')
js.write_text('// Generated by tools/build-runtime-literals-v012.py. Display-only dictionary.\nexport default '+json.dumps(result,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
remaining=sorted(x for x in sources if x not in labels)
report={
 'source_system_version':'0.1.10','source_literal_candidates':sum(map(len,sources.values())),
 'unique_literal_candidates':len(sources), 'translated_source_literal_candidates':len(sources)-len(remaining),
 'unmapped_source_literal_candidates':remaining,
 'sanity_display_strings':len(sanity),
 'shock_summaries':len(SHOCK_SUMMARIES_RU), 'shock_effects':len(SHOCK_EFFECTS_RU),
 'mental_trauma_effects':len(TRAUMAS_RU), 'mental_disorder_example_effects':len(DISORDER_EFFECTS_RU), 'mental_disorder_severity_effects':len(SEVERITY_EFFECTS_RU),
 'malignancy_mutation_effects':len(values('MALIGNANCIES','effect'))+len(values('MUTATIONS','effect')),
 'scope':'Static dictionary: visibility in actual Foundry VTT still requires runtime verification.'
}
(ROOT/'docs/runtime-literals-v0.12-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({key:report[key] for key in ('source_literal_candidates','unique_literal_candidates','translated_source_literal_candidates','sanity_display_strings','unmapped_source_literal_candidates')},ensure_ascii=False,indent=2))
