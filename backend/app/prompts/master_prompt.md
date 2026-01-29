# 🎨 МАСТЕР-ПРОМПТ: Генерация сайтов по визуальному референсу

## Версия: 1.0
## Технологии: Tailwind CSS, Google Fonts
## Основан на: 6+ референсов, 50+ итераций исправлений

---

# ЧАСТЬ 1: ФИЛОСОФИЯ И КРИТИЧЕСКИЕ ПРАВИЛА

## 1.1 Почему AI ошибается в деталях дизайна

AI (включая Claude) использует **pattern matching** и склонен к ошибкам:

| Что AI "видит" | Что AI думает | Реальность |
|----------------|---------------|------------|
| Наклонный текст | "Это italic serif" | Это SCRIPT (рукописный) шрифт |
| Круглый элемент | "Это круг" | Это вертикальный PILL (h > w) |
| Светлая линия на фото | "Ничего важного" | Это белая ОБВОДКА border-4 |
| Волнистый край | "Синий вгрызается в оранжевый" | Оранжевый ВЫСТУПАЕТ в синий |
| Карточки в ряд | "Все одинаковые" | Разные формы: овал, круг, прямоугольник |
| Скругление углов | "rounded-lg хватит" | Нужно rounded-[2.5rem] или больше |

## 1.2 Золотое правило

```
⚠️ НИКОГДА НЕ ПИШИ КОД ПОКА НЕ СДЕЛАЛ КРОПЫ И НЕ ИЗУЧИЛ ИХ ЧЕРЕЗ VIEW TOOL
```

Это не рекомендация — это **обязательный шаг**. Без него ошибки гарантированы.

## 1.3 Workflow (СТРОГО СОБЛЮДАТЬ)

```
1. Получить референс
2. Определить размер изображения (PIL)
3. Вырезать 5-10 кропов ключевых секций
4. КАЖДЫЙ кроп просмотреть через view tool
5. Записать наблюдения по каждому элементу
6. Составить дизайн-систему
7. ТОЛЬКО ТЕПЕРЬ писать код
8. Итеративно исправлять по фидбеку
```

---

# ЧАСТЬ 2: ТЕХНИКА АНАЛИЗА РЕФЕРЕНСА

## 2.1 Начальный анализ с PIL

```python
from PIL import Image

img = Image.open('/mnt/user-data/uploads/reference.png')
w, h = img.size
print(f"Размер: {w}x{h}")

# ВАЖНО: Часто референс содержит несколько экранов
# или пустое пространство справа (презентация)
# Определи реальную ширину контента!
```

## 2.2 Стратегия кропов

### Что ОБЯЗАТЕЛЬНО кропить:
1. **Header** — логотип, навигация
2. **Hero секция** — заголовок, кнопки, фото
3. **Карточки/Products** — формы, обводки, тени
4. **Текстовые блоки** — шрифты, размеры
5. **Кнопки** — форма, заливка vs обводка
6. **Декоративные элементы** — волны, линии, иконки
7. **Footer** — структура, размер логотипа

### Код для кропов:
```python
from PIL import Image

img = Image.open('/mnt/user-data/uploads/reference.png')
print(f"Размер: {img.size}")

# Кропы с примерными координатами (ПОДСТРОЙ ПОД СВОЙ РЕФЕРЕНС!)

# Header
header = img.crop((0, 0, 600, 80))
header.save('/home/claude/crop_header.png')

# Hero полностью
hero = img.crop((0, 80, 600, 400))
hero.save('/home/claude/crop_hero.png')

# Увеличенный логотип
logo = img.crop((20, 20, 150, 60))
logo_big = logo.resize((logo.width * 3, logo.height * 3), Image.LANCZOS)
logo_big.save('/home/claude/crop_logo_big.png')

# Увеличенная кнопка
button = img.crop((x1, y1, x2, y2))
button_big = button.resize((button.width * 3, button.height * 3), Image.LANCZOS)
button_big.save('/home/claude/crop_button_big.png')

# И так далее для КАЖДОЙ важной секции...

print("Готово — N кропов")
```

## 2.3 Просмотр и анализ кропов

```
view /home/claude/crop_header.png
```

**Что ЗАПИСЫВАТЬ при просмотре каждого кропа:**

### Для логотипа:
- Тип шрифта: serif / sans-serif / script / rounded-sans
- Вес: light / regular / medium / bold / black
- Цвет: точный или примерный HEX
- Особенности: italic, uppercase, tracking

### Для заголовков:
- Тип шрифта
- Есть ли MIX шрифтов? (часто: sans + script в одном заголовке)
- Какие слова каким шрифтом?
- Размер: примерный text-?xl

### Для кнопок:
- Форма: pill (rounded-full) / rounded-lg / rounded-xl / острые углы
- Стиль: заливка (bg-color) / обводка (border) / прозрачная с border
- Текст: uppercase? tracking-wider? размер?
- Стрелка или иконка внутри?

### Для карточек:
- Форма: прямоугольник / круг / овал / pill (вертикальный)
- Скругление: точное значение
- Обводка: есть/нет, цвет, толщина
- Тень: есть/нет, интенсивность
- Расположение текста: внутри / снаружи / overlay

### Для фото:
- Скругление углов
- Обводка
- Наложенные элементы (стикеры, карточки, текст)

---

# ЧАСТЬ 3: КАТАЛОГ ТИПИЧНЫХ ОШИБОК

## 3.1 ОШИБКА: Script vs Serif Italic

### Как выглядит ошибка:
```html
<!-- НЕПРАВИЛЬНО -->
<span class="font-serif italic">Beautiful Skin</span>
```

### Как должно быть:
```html
<!-- ПРАВИЛЬНО -->
<span class="font-script">Beautiful Skin</span>
```

### Как отличить на кропе:

**Serif Italic:**
- Буквы наклонены, но сохраняют свою форму
- 'a' выглядит как обычная 'a', только под углом
- 'g' имеет стандартную форму
- Буквы НЕ соединены между собой

**Script (рукописный):**
- Буквы "текут" друг в друга
- Петли, завитки, каллиграфические элементы
- 'a' может выглядеть как рукописная
- Буквы часто СОЕДИНЕНЫ или почти соединены

### Популярные Script шрифты для Google Fonts:
```
Pacifico        — жирный, дружелюбный, beach vibes
Dancing Script  — элегантный, средний вес
Caveat          — как handwriting, casual
Great Vibes     — формальный, свадебный
Sacramento      — тонкий, элегантный
Satisfy         — ретро, 50s style
Lobster         — жирный, ретро
Kaushan Script  — brush script
```

### Tailwind config:
```javascript
fontFamily: {
    'script': ['Pacifico', 'cursive'],
    // или
    'script': ['Dancing Script', 'cursive'],
}
```

## 3.2 ОШИБКА: Круг vs Вертикальный Pill

### Как выглядит ошибка:
```html
<!-- НЕПРАВИЛЬНО: думал что это круг -->
<div class="w-72 h-72 rounded-full">
```

### Как должно быть:
```html
<!-- ПРАВИЛЬНО: это вертикальный pill (высота > ширины) -->
<div class="w-48 h-72 rounded-full">
```

### Правило определения:
- Если **ширина = высоте** и `rounded-full` → это **КРУГ**
- Если **высота > ширины** и `rounded-full` → это **ВЕРТИКАЛЬНЫЙ PILL**
- Если **ширина > высоты** и `rounded-full` → это **ГОРИЗОНТАЛЬНЫЙ PILL** (кнопка)

### Визуальная подсказка на референсе:
Вертикальные pill-карточки часто **обрезаются по краям экрана** — видно только центральную часть, а боковые "выезжают" за границы.

## 3.3 ОШИБКА: Забытые белые обводки

### Как выглядит ошибка:
```html
<!-- НЕПРАВИЛЬНО: нет обводки -->
<div class="rounded-full overflow-hidden shadow-xl">
    <img src="...">
</div>
```

### Как должно быть:
```html
<!-- ПРАВИЛЬНО: есть белая обводка -->
<div class="rounded-full overflow-hidden shadow-xl border-4 border-white">
    <img src="...">
</div>
```

### Почему AI пропускает обводки:
- Белая обводка на светлом фоне почти не видна
- AI "упрощает" картинку и игнорирует мелкие детали
- На маленьком референсе обводка сливается

### Как обнаружить:
1. Сделай кроп карточки
2. Увеличь в 2-3 раза через PIL
3. Посмотри через view tool
4. Ищи тонкую светлую линию между фото и фоном

## 3.4 ОШИБКА: Неправильное направление Scallop Edge

### Контекст:
Scallop edge — это волнистый край из полукругов, часто между двумя цветными секциями.

### Как выглядит ошибка:
"Синие полукруги вгрызаются в оранжевую секцию"

### Как определить правильно:
1. Смотри какой цвет **ВЫПУКЛЫЙ** (выступает)
2. Смотри какой цвет **ВОГНУТЫЙ** (имеет "укусы")

### Пример:
- Сверху синяя секция
- Снизу оранжевая секция
- Между ними scallop

**Если оранжевые полукруги ВЫСТУПАЮТ ВВЕРХ в синий:**
```css
.scallop-top-out::before {
    content: '';
    position: absolute;
    top: -30px;  /* МИНУС = выступает вверх */
    left: 0;
    right: 0;
    height: 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23F26B5B'/%3E%3C/svg%3E");
    background-size: 80px 40px;
    background-repeat: repeat-x;
}
```

**Если синие полукруги ВЫСТУПАЮТ ВНИЗ в оранжевый:**
```css
.scallop-bottom-out::after {
    content: '';
    position: absolute;
    bottom: -30px;  /* МИНУС = выступает вниз */
    /* cy='0' вместо cy='40' */
}
```

## 3.5 ОШИБКА: Недостаточное скругление

### Как выглядит ошибка:
```html
<!-- НЕПРАВИЛЬНО: скругление слишком маленькое -->
<div class="rounded-lg">  <!-- 8px -->
```

### Как должно быть:
```html
<!-- ПРАВИЛЬНО: современные дизайны используют большие скругления -->
<div class="rounded-3xl">  <!-- 24px -->
<!-- или -->
<div class="rounded-[2rem]">  <!-- 32px -->
<!-- или -->
<div class="rounded-[2.5rem]">  <!-- 40px -->
```

### Таблица скруглений Tailwind:
```
rounded-sm    = 2px
rounded       = 4px
rounded-md    = 6px
rounded-lg    = 8px
rounded-xl    = 12px
rounded-2xl   = 16px
rounded-3xl   = 24px
rounded-full  = 9999px (полный круг/pill)

rounded-[2rem]   = 32px (кастомное)
rounded-[2.5rem] = 40px (кастомное)
rounded-[3rem]   = 48px (кастомное)
```

### Когда какое использовать:
- **Кнопки:** rounded-full (pill) или rounded-xl
- **Карточки:** rounded-2xl, rounded-3xl, rounded-[2rem]
- **Фото:** зависит от стиля, часто rounded-3xl
- **Hero блоки:** rounded-[3rem] или больше
- **Инпуты:** rounded-full (pill) или rounded-xl

## 3.6 ОШИБКА: Заливка вместо обводки (и наоборот)

### Как выглядит ошибка:
```html
<!-- НЕПРАВИЛЬНО: залитая кнопка -->
<button class="bg-black text-white">Click</button>
```

### Как должно быть:
```html
<!-- ПРАВИЛЬНО: кнопка с обводкой -->
<button class="border border-black text-black bg-transparent hover:bg-black hover:text-white">
    Click
</button>
```

### Как определить на референсе:
- **Залитая кнопка:** сплошной цвет, текст контрастный
- **Кнопка с обводкой:** видна тонкая линия по краю, фон прозрачный или очень светлый

## 3.7 ОШИБКА: Все карточки одинаковой формы

### Как выглядит ошибка:
```html
<!-- НЕПРАВИЛЬНО: все карточки одинаковые -->
<div class="rounded-2xl">...</div>
<div class="rounded-2xl">...</div>
<div class="rounded-2xl">...</div>
```

### Как должно быть (стиль "Pretty"):
```html
<!-- ПРАВИЛЬНО: разные формы -->
<div class="rounded-[50%]">...</div>  <!-- Овал -->
<div class="rounded-3xl">...</div>     <!-- Прямоугольник -->
<div class="rounded-full border-dashed">...</div>  <!-- Круг с пунктиром -->
```

### Виды форм карточек:
1. **Овал:** `rounded-[50%]` на прямоугольнике
2. **Круг:** `rounded-full` при w=h
3. **Pill вертикальный:** `rounded-full` при h>w
4. **Прямоугольник скруглённый:** `rounded-2xl`, `rounded-3xl`
5. **С пунктирной обводкой:** `border-2 border-dashed border-color`

---

# ЧАСТЬ 4: КАТАЛОГ UI ПАТТЕРНОВ

## 4.1 Watermark текст (огромные буквы на фоне)

### Вариант 1: За контентом
```html
<section class="relative overflow-hidden">
    <!-- Watermark -->
    <div class="absolute inset-0 flex items-center justify-start pointer-events-none select-none overflow-hidden">
        <span class="text-[20vw] font-semibold text-neutral-100/80 uppercase tracking-tighter leading-none -ml-[5vw]">
            СИЯНИЕ
        </span>
    </div>
    
    <!-- Контент поверх -->
    <div class="relative z-10">
        <!-- ... -->
    </div>
</section>
```

### Вариант 2: Два слова разным цветом (Stacey Edgar стиль)
```html
<div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
    <span class="text-[15vw] font-bold uppercase tracking-tight leading-none">
        <span class="text-pink-200">STACEY</span>
        <span class="text-amber-200">EDGAR</span>
    </span>
</div>
```

### Вариант 3: В футере как финальный элемент
```html
<div class="text-center py-16">
    <span class="text-[12vw] font-serif text-cream leading-none tracking-tight">
        СИЯНИЕ
    </span>
</div>
```

### Размеры watermark:
- `text-[10vw]` — читаемый, не агрессивный
- `text-[15vw]` — средний, заметный
- `text-[20vw]` — крупный, доминирующий
- `text-[25vw]` — огромный, может выходить за экран

## 4.2 Pill-shaped карточки с обрезкой по краям

```html
<section class="overflow-hidden">
    <div class="flex items-center justify-center gap-[-2rem]">
        <!-- Левая карточка — обрезается слева -->
        <div class="relative flex-shrink-0 -ml-20 md:-ml-10">
            <div class="w-48 h-72 md:w-64 md:h-96 rounded-full overflow-hidden shadow-xl border-4 border-white">
                <img src="..." class="w-full h-full object-cover">
            </div>
            <span class="absolute bottom-12 left-1/2 -translate-x-1/2 text-white font-bold uppercase tracking-widest drop-shadow-lg">
                Чистка
            </span>
        </div>
        
        <!-- Центральная карточка — полностью видна -->
        <div class="relative flex-shrink-0 z-20">
            <div class="w-52 h-72 md:w-72 md:h-96 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white">
                <img src="..." class="w-full h-full object-cover">
            </div>
            <span class="absolute bottom-12 left-1/2 -translate-x-1/2 text-white font-bold uppercase tracking-widest drop-shadow-lg">
                Уход
            </span>
        </div>
        
        <!-- Правая карточка — обрезается справа -->
        <div class="relative flex-shrink-0 -mr-20 md:-mr-10">
            <div class="w-48 h-72 md:w-64 md:h-96 rounded-full overflow-hidden shadow-xl border-4 border-white">
                <img src="..." class="w-full h-full object-cover">
            </div>
            <span class="absolute bottom-12 left-1/2 -translate-x-1/2 text-white font-bold uppercase tracking-widest drop-shadow-lg">
                Инъекции
            </span>
        </div>
    </div>
</section>
```

## 4.3 Scallop Edge (волнистый край из полукругов)

### CSS:
```css
.scallop-top-out {
    position: relative;
}

/* Оранжевые полукруги выступают ВВЕРХ */
.scallop-top-out::before {
    content: '';
    position: absolute;
    top: -30px;
    left: 0;
    right: 0;
    height: 40px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 40'%3E%3Ccircle cx='40' cy='40' r='40' fill='%23F26B5B'/%3E%3C/svg%3E");
    background-size: 80px 40px;
    background-repeat: repeat-x;
}
```

### HTML:
```html
<section class="bg-blue-500 py-20">
    <!-- Синяя секция -->
</section>

<section class="bg-coral scallop-top-out py-20">
    <!-- Оранжевая секция с полукругами, выступающими вверх -->
</section>
```

## 4.4 Диагональная бегущая строка (Marquee)

### CSS:
```css
@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.animate-marquee {
    animation: marquee 20s linear infinite;
}

.diagonal-stripe {
    transform: rotate(-3deg) scaleX(1.1);
}
```

### HTML:
```html
<section class="relative py-6 overflow-hidden">
    <div class="diagonal-stripe bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 py-4">
        <div class="flex animate-marquee whitespace-nowrap">
            <span class="text-white font-bold text-xl md:text-2xl uppercase tracking-wider mx-8">
                Красота ✦ Забота ✦ Профессионализм ✦ Качество ✦
            </span>
            <!-- ОБЯЗАТЕЛЬНО дублируй для бесшовной анимации -->
            <span class="text-white font-bold text-xl md:text-2xl uppercase tracking-wider mx-8">
                Красота ✦ Забота ✦ Профессионализм ✦ Качество ✦
            </span>
        </div>
    </div>
</section>
```

## 4.5 Фото на цветном квадрате с offset

```html
<div class="relative">
    <!-- Цветной квадрат СЗАДИ -->
    <div class="absolute top-4 left-4 w-full h-full bg-coral rounded-2xl"></div>
    
    <!-- Фото СВЕРХУ -->
    <img 
        src="..." 
        alt="..."
        class="relative z-10 rounded-2xl w-full"
    >
</div>
```

### Вариации offset:
- `top-4 left-4` — смещение вправо-вниз
- `top-4 right-4` — смещение влево-вниз
- `-top-4 -left-4` — смещение влево-вверх
- `top-6 left-6` — больший offset

## 4.6 Плавающая карточка поверх фото

```html
<div class="relative">
    <img src="..." class="w-full rounded-3xl">
    
    <!-- Карточка в углу -->
    <div class="absolute bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-[200px]">
        <div class="w-10 h-10 bg-beige rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        </div>
        <div>
            <p class="text-sm font-medium text-neutral-800">Широкий спектр</p>
            <p class="text-xs text-neutral-400">услуг для вас</p>
        </div>
    </div>
</div>
```

### Позиции карточки:
- `bottom-6 left-6` — левый нижний угол
- `bottom-6 right-6` — правый нижний угол
- `top-6 right-6` — правый верхний угол
- `-bottom-6 left-10` — выступает за границу фото

## 4.7 Карточка продукта (как в LAB/Pretty)

```html
<div class="absolute bottom-8 right-8 bg-white shadow-xl p-4 min-w-[180px]">
    <p class="text-[9px] uppercase tracking-widest text-neutral-400 mb-2">Увлажняющий крем</p>
    <div class="flex items-center justify-between gap-4">
        <div class="w-14 h-14 bg-neutral-50 flex items-center justify-center border border-neutral-100">
            <span class="text-[8px] font-medium tracking-wider">СИЯНИЕ</span>
        </div>
        <span class="font-medium">3500₽</span>
    </div>
</div>
```

## 4.8 Кнопка с обводкой + hover

```html
<a href="#" class="inline-block border border-black text-black text-xs uppercase tracking-widest px-8 py-3 hover:bg-black hover:text-white transition-colors">
    Получить гид
</a>
```

### Вариации:
```html
<!-- Белая обводка на тёмном фоне -->
<a href="#" class="border border-white text-white hover:bg-white hover:text-black">

<!-- Цветная обводка -->
<a href="#" class="border-2 border-coral text-coral hover:bg-coral hover:text-white">
```

## 4.9 Кнопка "SEE MORE" с линиями по бокам

```html
<div class="flex items-center mt-12">
    <div class="flex-1 h-px bg-neutral-200"></div>
    <a href="#" class="px-10 text-xs uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
        Смотреть все
    </a>
    <div class="flex-1 h-px bg-neutral-200"></div>
</div>
```

## 4.10 Маленькие круглые фото в заголовке (Pretty стиль)

```html
<h1 class="font-serif text-5xl text-neutral-800 leading-tight">
    Заботьтесь о коже
    <span class="text-gold">✕</span>
    <span class="inline-flex items-center gap-2">
        <img src="..." class="w-8 h-8 rounded-full inline" alt="">
        с натуральными
    </span>
    ингредиентами
    <img src="..." class="w-8 h-8 rounded-full inline ml-2" alt="">
</h1>
```

## 4.11 Пунктирная дуга над фото (Pretty стиль)

```html
<div class="relative">
    <!-- SVG дуга -->
    <svg class="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-12" viewBox="0 0 200 50" fill="none">
        <path d="M10 40 Q 100 0, 190 40" stroke="#C9A96E" stroke-width="1" stroke-dasharray="5 5" fill="none"/>
    </svg>
    
    <img src="..." class="w-full rounded-3xl">
</div>
```

## 4.12 Огромный логотип в футере с декором

```html
<section class="py-16 text-center">
    <h2 class="font-serif text-[12vw] text-cream leading-none tracking-tight relative inline-block">
        СИЯНИЕ
        <!-- Декоративный цветочек -->
        <span class="absolute -top-4 -right-8 text-coral text-5xl">✿</span>
    </h2>
</section>
```

## 4.13 Testimonial карточка с сердечками (Inter-K стиль)

```html
<div class="bg-cream rounded-3xl p-6">
    <div class="flex items-center gap-3 mb-4">
        <img src="..." class="w-12 h-12 rounded-full" alt="Аватар">
        <div>
            <p class="font-medium">Мария К.</p>
            <p class="text-sm text-neutral-400">Клиент</p>
        </div>
    </div>
    <p class="text-neutral-600 mb-4">"Прекрасный сервис и результат!"</p>
    <div class="flex gap-1 text-red-400">
        ❤ ❤ ❤ ❤ ❤
    </div>
</div>
```

## 4.14 Декоративные SVG линии (Inter-K стиль)

```html
<!-- Волнистая линия -->
<svg class="absolute top-20 right-10 w-32 h-20 text-cream/30" viewBox="0 0 100 50" fill="none">
    <path d="M0 25 Q 25 0, 50 25 T 100 25" stroke="currentColor" stroke-width="2"/>
</svg>

<!-- Звёздочка -->
<span class="text-cream text-2xl">✦</span>

<!-- Цветок -->
<span class="text-coral text-3xl">✿</span>

<!-- Крестик -->
<span class="text-gold text-4xl font-light">✕</span>
```

---

# ЧАСТЬ 5: ГОТОВЫЕ ДИЗАЙН-СИСТЕМЫ

## 5.1 Стиль "Glossier" (минималистичный beauty)

### Цвета:
```javascript
colors: {
    'red': '#C41230',
    'pink': '#FAD4D4',
    'cream': '#FDF6F4',
    'pink-light': '#FFF0F0',
}
```

### Шрифты:
```javascript
fontFamily: {
    'sans': ['Apercu', 'Inter', 'Helvetica Neue', 'sans-serif'],
    'script': ['Pacifico', 'cursive'],
}
```

### Характеристики:
- Много белого пространства
- Розовые акценты
- Script шрифт для отдельных слов в заголовках
- Pill-shaped кнопки с квадратными скобками `[ Shop All ]`
- Фото со скруглёнными углами
- Минималистичные иконки

### Типичные элементы:
- Метки "Bestsellers" в скруглённой рамке
- Секции с розовым фоном
- Красные CTA блоки
- Script текст: "Into The Gloss", "be built by you"

## 5.2 Стиль "The Queen" (yoga/wellness)

### Цвета:
```javascript
colors: {
    'sky': '#9BC8D9',
    'coral': '#E8683A',
    'peach': '#FADCD4',
    'blue-block': '#6B9DB8',
    'cream': '#FDF8F5',
}
```

### Шрифты:
```javascript
fontFamily: {
    'sans': ['Nunito', 'Quicksand', 'sans-serif'],  // Rounded!
    'script': ['Caveat', 'Pacifico', 'cursive'],
}
```

### Характеристики:
- Rounded sans-serif (буквы со скруглёнными краями)
- MIX шрифтов в заголовках: "Virtual" (script) + "Pilates" (sans)
- Очень скруглённые формы (rounded-[3rem])
- Pill-вертикальные карточки с обрезкой по краям
- Оранжевые полоски-акценты
- Watermark текст на фоне

### Типичные элементы:
- Карточки "круг-прямоугольник-круг"
- Оранжевые CTA секции
- Синие блоки с белым текстом
- Текст на фото (подписи внизу карточек)

## 5.3 Стиль "Stacey Edgar" (bold personal brand)

### Цвета:
```javascript
colors: {
    'hot-pink': '#E84B8A',
    'light-pink': '#F5A0B8',
    'gold': '#D4A843',
    'coral-red': '#E15A4A',
    'burnt-orange': '#C65D3B',
    'cream': '#FDF6F0',
}
```

### Шрифты:
```javascript
fontFamily: {
    'serif': ['Playfair Display', 'Georgia', 'serif'],
    'sans': ['Inter', 'sans-serif'],
}
```

### Характеристики:
- Огромный watermark текст двумя цветами
- Bold serif заголовки
- Фото на цветных квадратах с offset
- Яркие контрастные цвета
- Uppercase текст с широким tracking

### Типичные элементы:
- "STACEY" розовым + "EDGAR" золотым (watermark)
- Фото смещены относительно цветных блоков
- Крупные serif заголовки
- Минималистичный футер

## 5.4 Стиль "Inter-K" (яркий современный)

### Цвета:
```javascript
colors: {
    'bright-blue': '#3B7DD8',
    'coral': '#F26B5B',
    'cream': '#FFF5E6',
    'purple': '#A855F7',
    'pink': '#EC4899',
}
```

### Шрифты:
```javascript
fontFamily: {
    'serif': ['DM Serif Display', 'Georgia', 'serif'],
    'sans': ['Inter', 'sans-serif'],
}
```

### Характеристики:
- Scalloped edges между секциями
- Диагональная бегущая строка (marquee)
- Градиенты purple→pink
- Testimonial карточки с сердечками
- Декоративные элементы: ✦ звёзды, ✿ цветы
- Огромный логотип в футере (text-[12vw])

### Типичные элементы:
- Оранжевые полукруги выступают в синий
- Анимированная полоса "COLLABORATION ✦"
- Карточки отзывов с аватарами
- SVG декоративные линии

## 5.5 Стиль "Pretty" (элегантный spa)

### Цвета:
```javascript
colors: {
    'gold': '#C9A96E',
    'gold-dark': '#A68B5B',
    'cream': '#FDF8F3',
    'beige': '#F5EBE0',
    'warm': '#FAF6F1',
}
```

### Шрифты:
```javascript
fontFamily: {
    'serif': ['Cormorant Garamond', 'Georgia', 'serif'],
    'sans': ['Inter', 'sans-serif'],
}
```

### Характеристики:
- Serif italic для заголовков
- Маленькие круглые фото в тексте заголовков
- Декоративные элементы: ✕, волнистые линии
- Карточки разных форм: овал, круг с пунктиром, прямоугольник
- Плавающие карточки продуктов
- Золотые pill кнопки

### Типичные элементы:
- `<img class="w-8 h-8 rounded-full inline">` в заголовке
- Пунктирная дуга над фото
- Карточки услуг с иконками в бежевых квадратах
- Бежевый градиент слева

## 5.6 Стиль "LAB" (корейский минимализм)

### Цвета:
```javascript
colors: {
    'cream': '#F5F0EB',
    // Остальное — стандартные neutral из Tailwind
}
```

### Шрифты:
```javascript
fontFamily: {
    'sans': ['Inter', 'sans-serif'],
    'serif': ['Playfair Display', 'serif'],  // Только для Newsletter
}
```

### Характеристики:
- Максимальный минимализм
- Огромный watermark "KOREAN" / "СИЯНИЕ"
- Маленькие uppercase заголовки секций (11px, tracking-widest)
- Кнопки с тонкой обводкой
- Чёрные залитые кнопки
- Карточки с рамкой (border), не заливкой
- Input без рамки (только border-bottom)

### Типичные элементы:
- `text-[11px] uppercase tracking-widest font-medium`
- Кнопка "SEE MORE" с линиями по бокам
- Карточка "Персональный гид" с border
- Newsletter с минималистичным input
- Огромный watermark внизу страницы

---

# ЧАСТЬ 6: СТРУКТУРА ТИПИЧНЫХ СЕКЦИЙ

## 6.1 Header

### Минималистичный (LAB):
```html
<header class="px-6 md:px-12 py-5 border-b border-neutral-100">
    <nav class="flex items-center justify-between max-w-7xl mx-auto">
        <a href="#" class="text-xl font-semibold tracking-tight">СИЯНИЕ</a>
        <div class="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-wider text-neutral-500">
            <a href="#" class="hover:text-black">Каталог</a>
            <a href="#" class="hover:text-black">О нас</a>
        </div>
        <button class="w-8 h-8">
            <svg><!-- search icon --></svg>
        </button>
    </nav>
</header>
```

### С активным элементом (Pretty):
```html
<header class="px-6 md:px-12 py-5">
    <nav class="flex items-center justify-between">
        <a href="#" class="font-serif text-3xl italic text-neutral-800">Сияние</a>
        <div class="hidden md:flex items-center gap-8 text-sm">
            <a href="#" class="text-gold border-b border-gold pb-1">Главная</a>
            <a href="#" class="text-neutral-500 hover:text-gold">О нас</a>
        </div>
    </nav>
</header>
```

## 6.2 Hero секция

### Два столбца с карточкой продукта (Pretty/LAB):
```html
<section class="px-6 md:px-12 py-16 relative overflow-hidden">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
        <!-- Текст слева -->
        <div>
            <h1 class="font-serif text-5xl leading-tight mb-6">
                Заголовок с <span class="font-script">акцентом</span>
            </h1>
            <p class="text-neutral-500 mb-8">Описание...</p>
            <a href="#" class="bg-gold text-white px-8 py-4 rounded-full">
                Записаться →
            </a>
        </div>
        
        <!-- Фото справа с карточкой -->
        <div class="relative">
            <img src="..." class="w-full rounded-bl-[100px]">
            
            <!-- Плавающая карточка -->
            <div class="absolute bottom-20 left-0 bg-white rounded-2xl shadow-xl p-4">
                <!-- содержимое карточки -->
            </div>
        </div>
    </div>
    
    <!-- Градиент фона -->
    <div class="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-beige to-transparent -z-10"></div>
</section>
```

### С watermark (The Queen/Stacey):
```html
<section class="relative min-h-[80vh] overflow-hidden">
    <!-- Watermark -->
    <div class="absolute inset-0 flex items-center pointer-events-none">
        <span class="text-[20vw] font-bold text-neutral-100 uppercase">СИЯНИЕ</span>
    </div>
    
    <!-- Контент -->
    <div class="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <!-- ... -->
    </div>
</section>
```

## 6.3 Секция услуг/продуктов

### Grid карточек (LAB):
```html
<section class="px-6 md:px-12 py-20">
    <div class="max-w-7xl mx-auto">
        <div class="flex justify-between mb-12">
            <h2 class="text-[11px] uppercase tracking-widest font-medium">Бестселлеры</h2>
            <p class="text-[11px] text-neutral-400 max-w-[200px] text-right">
                Описание справа
            </p>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
            <!-- Карточки -->
            <div class="group">
                <div class="aspect-square bg-neutral-50 mb-4 flex items-center justify-center">
                    <img src="..." class="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform">
                </div>
                <p class="font-medium mb-1">Название</p>
                <p class="text-[11px] text-neutral-400">Подзаголовок</p>
            </div>
            <!-- ... -->
        </div>
        
        <!-- Кнопка с линиями -->
        <div class="mt-16 flex items-center">
            <div class="flex-1 h-px bg-neutral-200"></div>
            <a href="#" class="px-10 text-[10px] uppercase tracking-widest text-neutral-400">
                Смотреть все
            </a>
            <div class="flex-1 h-px bg-neutral-200"></div>
        </div>
    </div>
</section>
```

### Pill карточки с обрезкой (The Queen):
```html
<section class="overflow-hidden py-20">
    <div class="flex items-center justify-center">
        <!-- Левая (обрезана) -->
        <div class="-ml-20">
            <div class="w-48 h-72 rounded-full overflow-hidden border-4 border-white">
                <img src="...">
            </div>
        </div>
        
        <!-- Центральная -->
        <div class="z-20">
            <div class="w-72 h-96 rounded-[2.5rem] overflow-hidden border-4 border-white">
                <img src="...">
            </div>
        </div>
        
        <!-- Правая (обрезана) -->
        <div class="-mr-20">
            <div class="w-48 h-72 rounded-full overflow-hidden border-4 border-white">
                <img src="...">
            </div>
        </div>
    </div>
</section>
```

## 6.4 About/Philosophy секция

### С карточкой-рамкой (LAB):
```html
<section class="px-6 md:px-12 py-20 bg-neutral-50">
    <div class="max-w-7xl mx-auto">
        <h2 class="text-[11px] uppercase tracking-widest font-medium mb-8">О нас</h2>
        
        <p class="text-neutral-600 leading-relaxed max-w-3xl mb-12">
            Текст о компании...
        </p>
        
        <!-- Карточка с рамкой -->
        <div class="border border-neutral-200 bg-white p-10 grid md:grid-cols-2 gap-10 items-center">
            <div>
                <h3 class="font-medium mb-4">Заголовок карточки</h3>
                <p class="text-sm text-neutral-500 mb-8">Описание...</p>
                <a href="#" class="border border-black px-8 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                    Кнопка
                </a>
            </div>
            <img src="..." class="w-full">
        </div>
    </div>
</section>
```

## 6.5 CTA секция

### Яркая (Inter-K):
```html
<section class="bg-coral py-20 relative scallop-top-out">
    <div class="max-w-3xl mx-auto text-center px-6">
        <h2 class="font-serif text-4xl text-white mb-6">
            Готовы к преображению?
        </h2>
        <p class="text-white/80 mb-8">
            Описание...
        </p>
        <a href="#" class="inline-block bg-white text-coral px-10 py-4 rounded-full font-medium">
            Записаться →
        </a>
    </div>
</section>
```

### Минималистичная (LAB):
```html
<section class="px-6 md:px-12 py-20">
    <div class="max-w-lg mx-auto text-center">
        <h2 class="font-serif text-3xl mb-10">Подпишитесь на рассылку</h2>
        <div class="mb-6">
            <label class="text-[10px] uppercase tracking-widest text-neutral-400 block text-left mb-2">
                Email
            </label>
            <input type="email" class="w-full border-b border-neutral-300 pb-3 focus:outline-none focus:border-black">
        </div>
        <button class="border border-black px-10 py-3 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
            Подписаться
        </button>
    </div>
</section>
```

## 6.6 Footer

### Минималистичный (LAB):
```html
<footer class="px-6 md:px-12 py-12 border-t border-neutral-100">
    <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
                <a href="#" class="text-lg font-semibold">СИЯНИЕ</a>
            </div>
            <div>
                <ul class="space-y-3 text-[11px] text-neutral-500">
                    <li><a href="#">Каталог</a></li>
                    <li><a href="#">О нас</a></li>
                </ul>
            </div>
            <div>
                <ul class="space-y-3 text-[11px] text-neutral-500">
                    <li><a href="#">Instagram</a></li>
                    <li><a href="#">Telegram</a></li>
                </ul>
            </div>
            <div class="text-[11px] text-neutral-500">
                <p>hello@siyanie.ru</p>
                <p class="mt-2">+7 (495) 123-45-67</p>
            </div>
        </div>
        
        <div class="pt-8 border-t border-neutral-100 text-[10px] text-neutral-400 flex justify-between">
            <span>© 2024 Сияние</span>
            <a href="#">Политика конфиденциальности</a>
        </div>
    </div>
</footer>
```

### С огромным логотипом (Inter-K):
```html
<footer class="bg-bright-blue text-cream">
    <!-- Основной футер -->
    <div class="px-6 md:px-12 py-12">
        <!-- контент -->
    </div>
    
    <!-- Огромный логотип -->
    <div class="text-center pb-8">
        <span class="text-[12vw] font-serif leading-none relative inline-block">
            СИЯНИЕ
            <span class="absolute -top-4 -right-8 text-coral text-5xl">✿</span>
        </span>
    </div>
</footer>
```

---

# ЧАСТЬ 7: ЧЕКЛИСТ ПЕРЕД ОТПРАВКОЙ

## Шрифты
- [ ] Правильно определён тип: serif / sans / script / rounded-sans?
- [ ] Google Fonts подключены в `<head>`?
- [ ] `fontFamily` настроен в `tailwind.config`?
- [ ] Script шрифт используется для правильных элементов?
- [ ] Нет путаницы serif italic vs script?

## Цвета
- [ ] Кастомные цвета добавлены в `tailwind.config`?
- [ ] Цвета близки к референсу?
- [ ] Градиенты правильные (направление, цвета)?
- [ ] Прозрачности правильные (text-white/80 и т.д.)?

## Формы и скругления
- [ ] Скругления достаточно большие (не rounded-lg для современных дизайнов)?
- [ ] Pill vs круг vs прямоугольник — правильно определены?
- [ ] Вертикальные pill имеют h > w?
- [ ] Кастомные скругления через `rounded-[Xrem]` где нужно?

## Обводки и тени
- [ ] Белые обводки на карточках где нужно?
- [ ] Толщина обводки правильная (border-2, border-4)?
- [ ] Тени где нужны (shadow-lg, shadow-xl)?
- [ ] Кнопки: заливка vs обводка — правильно?

## Расположение
- [ ] Grid/Flex структура соответствует референсу?
- [ ] Отступы пропорциональны (px-6, py-20 и т.д.)?
- [ ] Выравнивание элементов (center/start/end)?
- [ ] Max-width контейнеров правильный?

## Декоративные элементы
- [ ] Watermark если есть — правильный размер и цвет?
- [ ] Декор (✕, ✿, линии) на месте?
- [ ] Плавающие карточки позиционированы правильно?
- [ ] Scallop edges правильного направления?

## Особые эффекты
- [ ] Marquee анимация работает?
- [ ] Hover эффекты добавлены?
- [ ] Переходы (transition-colors, transition-transform)?

## Responsive
- [ ] Проверен на мобильных размерах?
- [ ] Скрытые элементы через `hidden md:flex`?
- [ ] Размеры адаптивны (text-3xl md:text-5xl)?

---

# ЧАСТЬ 8: ИТЕРАТИВНЫЙ ПРОЦЕСС ИСПРАВЛЕНИЙ

## Типичные замечания пользователя и как их решать:

### "Не тот шрифт"
1. Сделай кроп текстового элемента
2. Увеличь в 2-3 раза
3. Посмотри через view tool
4. Определи точно: serif / sans / script / rounded-sans
5. Исправь fontFamily в config

### "Карточки должны быть другой формы"
1. Сделай кроп карточек
2. Определи: круг / овал / pill / прямоугольник
3. Проверь соотношение сторон
4. Исправь rounded-* и размеры

### "Нет обводки / Лишняя обводка"
1. Сделай увеличенный кроп элемента
2. Посмотри есть ли тонкая линия по краю
3. Добавь / убери `border-* border-color`

### "Направление волны неправильное"
1. Определи какой цвет ВЫПУКЛЫЙ
2. Исправь position (top vs bottom)
3. Исправь cy в SVG (cy='40' vs cy='0')

### "Скругления слишком маленькие/большие"
1. Посмотри на референс
2. Подбери: rounded-xl / rounded-2xl / rounded-3xl / rounded-[Xrem]

### "Цвет не тот"
1. Попробуй извлечь точный HEX из референса
2. Или подбери близкий из палитры

---

# ЗАКЛЮЧЕНИЕ

## Главные уроки (запомни навсегда):

1. **КРОПЫ ОБЯЗАТЕЛЬНЫ** — без них будешь ошибаться в 90% случаев
2. **Script ≠ Serif Italic** — это РАЗНЫЕ шрифты, не путай
3. **Pill ≠ Circle** — смотри на соотношение сторон
4. **Детали решают** — обводка, скругление, направление волны
5. **Современные дизайны = большие скругления** — rounded-lg это прошлый век
6. **Итерации нормальны** — первая версия редко идеальна

## Твой workflow:

```
Референс 
    ↓
Кропы (PIL)
    ↓
View tool (каждый кроп!)
    ↓
Записать наблюдения
    ↓
Дизайн-система
    ↓
Tailwind config
    ↓
Код секция за секцией
    ↓
Фидбек пользователя
    ↓
Кропы проблемных мест
    ↓
Точечные исправления
    ↓
Готово!
```

---

**Версия промпта:** 1.0
**Дата:** Январь 2025
**Основан на референсах:** Glossier, The Queen, Stacey Edgar, Inter-K, Pretty, LAB
