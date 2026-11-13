# Переводы компендиумов через Babele

Для языка `ru` модуль регистрирует этот каталог через событие `babele.init`.

- `dark-heresy-2e-apex.dh2e-equipment.json` — **Снаряжение**, 273 документа, 18 папок.
- `dark-heresy-2e-apex.dh2e-character.json` — **Создание персонажа**, 224 документа, 14 папок; одноимённые документы «Psyker» различаются по `_id`.
- `dark-heresy-2e-apex.dh2e-psychic-powers.json` — **Психосилы**, 45 документов, 5 папок.
- `dark-heresy-2e-apex.dh2e-bestiary.json` — **Бестиарий**, 72 NPC, 15 папок, 814 вложенных элементов.
- `dark-heresy-2e-apex.dh2e-vehicles.json` — **Транспорт**, 7 записей, 4 вложенных предмета.
- `dark-heresy-2e-apex.dh2e-critical-tables.json` — **Таблицы критических эффектов**, 20 RollTable, 200 строк.
- `dark-heresy-2e-apex.dh2e-critical-effects.json` — **Критические эффекты и травмы**, 217 документов, 26 папок.
- `dark-heresy-2e-apex.dh2e-warp-tables.json` — **Таблицы Варпа**, 2 RollTable, 44 строки.
- `dark-heresy-2e-apex.dh2e-warp-effects.json` — **Эффекты Варпа**, 44 документа, 2 папки, 27 примечаний автоматики, 6 названий состояний, 1 подпись модификатора.

В библиотеке предметов поле `description` сопоставляется с `system.description`. В бестиарии также обрабатываются `prototypeToken.name` и вложенные `items` через Babele. В RollTable переведены подписи строк `results` по `_id`; связи `documentUuid` ведут к исходным документам системных библиотек с наложенной русской локализацией.

В `dh2e-warp-effects` используется встроенный `structured`-конвертер Babele: меняются только строки `text`, `name` и `label` в `system.dh2e.steps`, остальные параметры действий, бросков и результатов остаются исходными. По замыслу локализация не изменяет исходные UUID, числовые значения, формулы, таблицы или данные в игровом мире.
