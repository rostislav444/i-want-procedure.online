"""
Seed script: тестові освітні матеріали по косметології.
Створює educator-компанію, курси, матеріали, консультації та події.
Реєструє rostislav.nikolaiev@gmail.com на одну з подій.

Run: python seed_education.py
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.company import Company, CompanyType, IndustryTheme, generate_slug, generate_invite_code
from app.models.user import User
from app.models.education import (
    EducatorOffering, OfferingType, EducatorEvent,
    EventTicketType, EventRegistration, RegistrationStatus,
)
import json
import secrets
import re

try:
    import transliterate
    def to_slug(name: str) -> str:
        slug = transliterate.translit(name, 'uk', reversed=True)
        slug = slug.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        return slug.strip('-') or 'offering'
except ImportError:
    def to_slug(name: str) -> str:
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9а-яіїє]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        return slug.strip('-') or 'offering'


# ─── дані спікера ──────────────────────────────────────────────────────────────

EDUCATOR = {
    "name": "Академія косметології ProBeauty",
    "slug": "probeauty-academy",
    "type": CompanyType.EDUCATOR,
    "industry_theme": IndustryTheme.COSMETOLOGY,
    "educator_tagline": "Навчання практичної косметології від провідних фахівців України",
    "bio": (
        "ProBeauty Academy — провідна школа косметології в Україні. "
        "З 2015 року ми готуємо фахових косметологів, майстрів з ін'єкційних технік "
        "та лазерних процедур. Наші курси поєднують сучасну теорію з інтенсивною практикою. "
        "Більше 3 000 випускників успішно працюють у косметологічних клініках, "
        "салонах краси та приватній практиці."
    ),
    "educator_credentials": (
        "• Ліцензія МОЗ України на освітню діяльність\n"
        "• Член Асоціації косметологів України\n"
        "• Партнер міжнародних брендів: Juvederm, Restylane, Botox\n"
        "• Більше 50 сертифікованих викладачів\n"
        "• Акредитовані програми CPD"
    ),
    "students_count": 3247,
    "telegram": "@probeauty_academy",
    "instagram_url": "https://instagram.com/probeauty.academy",
    "youtube_url": "https://youtube.com/@probeautyacademy",
}

# ─── курси (Offerings) ────────────────────────────────────────────────────────

OFFERINGS = [
    # --- COURSE 1: базовий курс косметології
    {
        "type": OfferingType.COURSE,
        "title": "Базовий курс косметолога з нуля",
        "short_description": "Повна підготовка косметолога за 3 місяці: від анатомії шкіри до апаратних процедур",
        "description": (
            "Комплексна програма для початківців, яка охоплює всі ключові аспекти косметології. "
            "Ви отримаєте теоретичну базу і відпрацюєте кожну техніку на практиці під керівництвом "
            "досвідчених майстрів. Після курсу ви будете готові до самостійної роботи."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800",
        "price": 1800000,  # 18 000 ₴
        "language": "uk",
        "level": "beginner",
        "certificate_included": True,
        "duration_hours": 120,
        "learning_outcomes": json.dumps([
            "Анатомія та фізіологія шкіри",
            "Діагностика типів шкіри та підбір догляду",
            "Класичне чищення та пілінги",
            "Масаж обличчя: класичний, скульптурний",
            "Апаратні методики (мікрострум, кавітація, RF-ліфтинг)",
            "Депіляція та корекція брів",
            "Нормативно-правова база косметологічної діяльності",
            "Побудова клієнтської бази та просування в соцмережах",
        ]),
        "target_audience": (
            "Курс ідеально підходить для тих, хто хоче змінити професію або розпочати "
            "власну справу у сфері краси. Попередній досвід не потрібен."
        ),
        "what_includes": json.dumps([
            "120 годин навчання (очно + практика)",
            "Доступ до відеозаписів лекцій на 12 місяців",
            "Роздаткові матеріали та чек-листи",
            "Набір навчальних косметичних засобів",
            "Державно визнаний сертифікат",
            "Підтримка у закритому Telegram-чаті",
            "Допомога у пошуку роботи",
        ]),
        "curriculum": json.dumps([
            {
                "section_title": "Модуль 1: Основи дерматології",
                "lessons": [
                    {"title": "Будова та функції шкіри", "duration_min": 90, "type": "video"},
                    {"title": "Типи та стани шкіри", "duration_min": 60, "type": "video"},
                    {"title": "Фотостаріння та його корекція", "duration_min": 45, "type": "text"},
                    {"title": "Практика: діагностика клієнта", "duration_min": 120, "type": "practice"},
                ]
            },
            {
                "section_title": "Модуль 2: Чищення та пілінги",
                "lessons": [
                    {"title": "Ультразвукове чищення", "duration_min": 60, "type": "video"},
                    {"title": "Механічне чищення: техніка", "duration_min": 90, "type": "practice"},
                    {"title": "Хімічні пілінги: AHA, BHA, PHA", "duration_min": 75, "type": "video"},
                    {"title": "Протоколи пілінгів для різних типів шкіри", "duration_min": 60, "type": "text"},
                    {"title": "Практика: повне чищення з пілінгом", "duration_min": 180, "type": "practice"},
                ]
            },
            {
                "section_title": "Модуль 3: Масаж обличчя",
                "lessons": [
                    {"title": "Класичний масаж: рухи та техніки", "duration_min": 90, "type": "video"},
                    {"title": "Скульптурний масаж Жаке", "duration_min": 75, "type": "video"},
                    {"title": "Буккальний масаж", "duration_min": 60, "type": "video"},
                    {"title": "Практика: комплексний масаж", "duration_min": 240, "type": "practice"},
                ]
            },
            {
                "section_title": "Модуль 4: Апаратна косметологія",
                "lessons": [
                    {"title": "Мікрострумова терапія", "duration_min": 60, "type": "video"},
                    {"title": "RF-ліфтинг: технологія та протоколи", "duration_min": 75, "type": "video"},
                    {"title": "Кавітація та ліполіз", "duration_min": 60, "type": "video"},
                    {"title": "Фотоомолодження (IPL)", "duration_min": 45, "type": "text"},
                    {"title": "Практика: апаратні процедури", "duration_min": 300, "type": "practice"},
                ]
            },
        ]),
    },

    # --- COURSE 2: ін'єкційна косметологія
    {
        "type": OfferingType.COURSE,
        "title": "Ін'єкційна косметологія: ботулотоксин та філери",
        "short_description": "Поглиблений курс для практикуючих косметологів: техніки введення ботоксу та дермальних філерів",
        "description": (
            "Практичний курс для косметологів та медичних фахівців. "
            "Ви освоїте сучасні техніки роботи з ботулотоксином та гіалуроновими філерами, "
            "навчитесь уникати ускладнень та коригувати результат."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800",
        "price": 2500000,  # 25 000 ₴
        "language": "uk",
        "level": "intermediate",
        "certificate_included": True,
        "duration_hours": 40,
        "learning_outcomes": json.dumps([
            "Анатомія обличчя: м'язи, судини, нерви — зони ризику",
            "Техніки ін'єкцій ботулотоксину (лоб, міжбрів'я, периорбітальна зона)",
            "Контурна пластика губ та носогубних складок",
            "Філери для об'єму щік та скронь",
            "Профілактика та корекція ускладнень",
            "Комбіновані протоколи омолодження",
        ]),
        "target_audience": "Косметологи та лікарі з базовою медичною освітою, які хочуть освоїти ін'єкційні методики.",
        "what_includes": json.dumps([
            "40 годин навчання (теорія + практика на манекенах і волонтерах)",
            "Атлас анатомії небезпечних зон",
            "Протоколи процедур у PDF",
            "Сертифікат про підвищення кваліфікації",
            "Closed Telegram-канал з оновленнями",
        ]),
        "curriculum": json.dumps([
            {
                "section_title": "Блок 1: Анатомія та безпека",
                "lessons": [
                    {"title": "М'язова анатомія обличчя 3D", "duration_min": 90, "type": "video"},
                    {"title": "Судинна анатомія: зони ризику", "duration_min": 75, "type": "video"},
                    {"title": "Протокол надання першої допомоги", "duration_min": 45, "type": "text"},
                ]
            },
            {
                "section_title": "Блок 2: Ботулотоксин",
                "lessons": [
                    {"title": "Фармакологія ботулотоксину", "duration_min": 60, "type": "video"},
                    {"title": "Техніки введення у верхній третині обличчя", "duration_min": 120, "type": "video"},
                    {"title": "Нижня третина та шия (Nefertiti lift)", "duration_min": 90, "type": "video"},
                    {"title": "Практика на манекенах", "duration_min": 240, "type": "practice"},
                    {"title": "Практика на волонтерах", "duration_min": 360, "type": "practice"},
                ]
            },
            {
                "section_title": "Блок 3: Дермальні філери",
                "lessons": [
                    {"title": "Реологія гіалуронових філерів", "duration_min": 45, "type": "text"},
                    {"title": "Губи: техніки збільшення та корекції форми", "duration_min": 90, "type": "video"},
                    {"title": "Носогубні складки та марионеточні лінії", "duration_min": 75, "type": "video"},
                    {"title": "Об'ємне моделювання щік", "duration_min": 60, "type": "video"},
                    {"title": "Практика: комплексний протокол", "duration_min": 480, "type": "practice"},
                ]
            },
        ]),
    },

    # --- GUIDE: атлас зон ін'єкцій
    {
        "type": OfferingType.GUIDE,
        "title": "Атлас небезпечних зон ін'єкцій: PDF-посібник",
        "short_description": "Детальна ілюстрована карта судин та нервів обличчя для практикуючих косметологів",
        "description": (
            "60-сторінковий ілюстрований PDF-атлас з детальним описом анатомічних зон ризику "
            "при ін'єкційних процедурах. Включає схеми кровопостачання, іннервації та "
            "рекомендовані точки введення препаратів."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1576671081837-49000212a370?w=800",
        "price": 49900,  # 499 ₴
        "is_digital": True,
        "language": "uk",
        "what_includes": json.dumps([
            "60 сторінок кольорових ілюстрацій",
            "Схеми 3D-анатомії обличчя",
            "Таблиці зон ризику по процедурах",
            "Чек-лист безпеки перед ін'єкцією",
            "Довічний доступ до PDF",
        ]),
    },

    # --- GUIDE: протоколи догляду
    {
        "type": OfferingType.GUIDE,
        "title": "50 готових протоколів косметологічних процедур",
        "short_description": "Шаблони протоколів для клієнтської картки: пілінги, масажі, апаратні процедури",
        "description": (
            "Збірник 50 готових протоколів, які ви можете одразу використовувати у роботі. "
            "Кожен протокол містить показання, протипоказання, покроковий алгоритм та рекомендації щодо догляду."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
        "price": 79900,  # 799 ₴
        "is_digital": True,
        "language": "uk",
        "what_includes": json.dumps([
            "50 протоколів у форматі Word + PDF",
            "Готові шаблони для клієнтських карток",
            "Можливість редагування під свій бренд",
            "Безкоштовні оновлення протягом року",
        ]),
    },

    # --- CONSULTATION: підбір обладнання
    {
        "type": OfferingType.CONSULTATION,
        "title": "Консультація: оснащення косметологічного кабінету",
        "short_description": "1 год особисто або онлайн — допоможу підібрати обладнання та косметику під ваш бюджет",
        "description": (
            "Якщо ви відкриваєте кабінет або хочете розширити спектр послуг — я допоможу "
            "скласти список обладнання, порекомендую перевірених постачальників та розрахую "
            "орієнтовний бюджет. Консультація проходить у форматі відеодзвінка або особисто у Києві."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1614289371518-722f2615943d?w=800",
        "price": 150000,  # 1 500 ₴
        "language": "uk",
        "duration_hours": 1,
        "what_includes": json.dumps([
            "1 година індивідуальної консультації",
            "Персональний план оснащення кабінету",
            "Список постачальників зі знижками",
            "Запис відеодзвінка",
        ]),
    },

    # --- CONSULTATION: розбір складних випадків
    {
        "type": OfferingType.CONSULTATION,
        "title": "Супервізія: розбір складних клієнтських випадків",
        "short_description": "Онлайн-консультація для практикуючих косметологів — аналіз протоколів і вирішення проблем",
        "description": (
            "Маєте складний клієнтський випадок або не впевнені у виборі протоколу? "
            "Надішліть фото та опис — разом розберемо ситуацію та складемо план дій."
        ),
        "cover_image_url": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800",
        "price": 200000,  # 2 000 ₴
        "language": "uk",
        "duration_hours": 1,
        "what_includes": json.dumps([
            "1 год відеоконсультація",
            "Письмові рекомендації після сесії",
            "Підбір протоколу лікування",
            "1 безкоштовне follow-up питання протягом тижня",
        ]),
    },
]

# ─── події ────────────────────────────────────────────────────────────────────

def future(days: int, hour: int = 10) -> datetime:
    dt = datetime.now(timezone.utc) + timedelta(days=days)
    return dt.replace(hour=hour, minute=0, second=0, microsecond=0)


EVENTS = [
    {
        "title": "Майстер-клас: ботулотоксин — практика на волонтерах",
        "description": (
            "Практичний майстер-клас в малих групах (до 6 учасників). "
            "Кожен учасник самостійно проведе процедуру під наглядом викладача. "
            "Включено набір препаратів на одного пацієнта."
        ),
        "start_at_offset": 14,  # days from now
        "end_at_offset": 14,
        "start_hour": 10,
        "end_hour": 18,
        "is_online": False,
        "venue_name": "ProBeauty Academy, Київ",
        "venue_address": "вул. Велика Васильківська, 72, Київ",
        "is_published": True,
        "max_participants": 6,
        "tickets": [
            {"name": "Стандарт", "price": 350000, "quantity": 4, "description": "Місце в групі, препарати включено"},
            {"name": "VIP", "price": 550000, "quantity": 2, "description": "Індивідуальна увага викладача, відеозапис практики"},
        ],
    },
    {
        "title": "Онлайн-інтенсив: діагностика шкіри та підбір ексфоліантів",
        "description": (
            "Дводенний онлайн-інтенсив для практикуючих косметологів. "
            "День 1: теоретична база та класифікація пілінгів. "
            "День 2: розбір клінічних випадків та питання-відповіді."
        ),
        "start_at_offset": 7,
        "end_at_offset": 8,
        "start_hour": 18,
        "end_hour": 21,
        "is_online": True,
        "is_multi_day": True,
        "is_published": True,
        "max_participants": None,
        "tickets": [
            {"name": "Запис вебінару", "price": 49900, "quantity": None, "description": "Доступ до запису після ефіру"},
            {"name": "Онлайн-участь", "price": 149900, "quantity": None, "description": "Live + Q&A + запис"},
            {"name": "З розбором кейсу", "price": 299900, "quantity": 10, "description": "Live + розбір вашого клієнтського кейсу + запис"},
        ],
    },
    {
        "title": "Щорічна конференція косметологів ProBeauty Forum 2026",
        "description": (
            "Найбільша профільна конференція косметологів в Україні. "
            "12 спікерів, 8 годин контенту, нетворкінг, виставка брендів. "
            "Теми: антивікові протоколи, біоревіталізація нового покоління, "
            "комбінована терапія, бізнес у косметології."
        ),
        "start_at_offset": 45,
        "end_at_offset": 45,
        "start_hour": 9,
        "end_hour": 20,
        "is_online": False,
        "venue_name": "Готель Fairmont, Київ",
        "venue_address": "вул. Архітектора Городецького, 1, Київ",
        "is_published": True,
        "max_participants": 300,
        "early_bird_price": 99900,  # 999 ₴ (замість 1999)
        "early_bird_offset": 30,    # закінчується через 30 днів
        "tickets": [
            {"name": "Онлайн-трансляція", "price": 49900, "quantity": None, "description": "Стрімінг усіх доповідей"},
            {"name": "Стандарт", "price": 199900, "quantity": 200, "description": "Вхід на конференцію, обід, матеріали"},
            {"name": "VIP", "price": 399900, "quantity": 50, "description": "VIP-зона, нетворкінг-вечеря, пам'ятний подарунок"},
            {"name": "PRO (з майстер-класом)", "price": 699900, "quantity": 20, "description": "Вхід + вечірній майстер-клас від запрошеного спікера"},
        ],
    },
    {
        "title": "Вебінар: акне — комплексний підхід у 2026",
        "description": (
            "Безкоштовний освітній вебінар про сучасні підходи до лікування акне. "
            "Розглянемо косметологічні та медичні аспекти, протоколи комбінованої терапії."
        ),
        "start_at_offset": 5,
        "end_at_offset": 5,
        "start_hour": 19,
        "end_hour": 21,
        "is_online": True,
        "is_published": True,
        "max_participants": None,
        "tickets": [
            {"name": "Безкоштовна участь", "price": 0, "quantity": None, "description": "Реєстрація обов'язкова"},
        ],
    },
]

# ─── seed ──────────────────────────────────────────────────────────────────────

async def seed():
    async with async_session_maker() as session:
        # 1. Знайти або створити educator-компанію
        result = await session.execute(
            select(Company).where(Company.slug == EDUCATOR["slug"])
        )
        company = result.scalar_one_or_none()

        if company:
            print(f"✓ Компанія вже існує: {company.name} (id={company.id})")
        else:
            company = Company(
                name=EDUCATOR["name"],
                slug=EDUCATOR["slug"],
                type=EDUCATOR["type"],
                industry_theme=EDUCATOR["industry_theme"],
                educator_tagline=EDUCATOR["educator_tagline"],
                bio=EDUCATOR["bio"],
                educator_credentials=EDUCATOR["educator_credentials"],
                students_count=EDUCATOR["students_count"],
                telegram=EDUCATOR["telegram"],
                instagram_url=EDUCATOR["instagram_url"],
                youtube_url=EDUCATOR["youtube_url"],
                invite_code=generate_invite_code(),
                team_invite_code=generate_invite_code(),
            )
            session.add(company)
            await session.flush()
            print(f"✓ Створено компанію: {company.name} (id={company.id})")

        # 2. Знайти місто Київ
        from app.models.city import City
        city_result = await session.execute(
            select(City).where(City.name == "Київ").limit(1)
        )
        kyiv = city_result.scalar_one_or_none()
        kyiv_id = kyiv.id if kyiv else None
        if kyiv_id:
            print(f"✓ Місто Київ: id={kyiv_id}")

        # 3. Створити offerings
        existing_slugs_res = await session.execute(
            select(EducatorOffering.slug).where(EducatorOffering.company_id == company.id)
        )
        existing_slugs = set(existing_slugs_res.scalars().all())

        created_offerings = []
        for i, data in enumerate(OFFERINGS):
            base_slug = to_slug(data["title"])[:150]
            slug = base_slug
            counter = 2
            while slug in existing_slugs:
                slug = f"{base_slug}-{counter}"
                counter += 1
            existing_slugs.add(slug)

            offering = EducatorOffering(
                company_id=company.id,
                type=data["type"],
                title=data["title"],
                slug=slug,
                short_description=data.get("short_description"),
                description=data.get("description"),
                cover_image_url=data.get("cover_image_url"),
                price=data.get("price", 0),
                currency="UAH",
                is_digital=data.get("is_digital", False),
                language=data.get("language", "uk"),
                level=data.get("level"),
                certificate_included=data.get("certificate_included", False),
                duration_hours=data.get("duration_hours"),
                learning_outcomes=data.get("learning_outcomes"),
                target_audience=data.get("target_audience"),
                what_includes=data.get("what_includes"),
                curriculum=data.get("curriculum"),
                is_active=True,
                order=i,
            )
            session.add(offering)
            await session.flush()
            created_offerings.append(offering)
            print(f"  + Offering: {offering.title[:50]}... (id={offering.id})")

        # 4. Створити events
        for i, ev_data in enumerate(EVENTS):
            start_at = future(ev_data["start_at_offset"], ev_data.get("start_hour", 10))
            end_at = future(ev_data["end_at_offset"], ev_data.get("end_hour", 18))

            event = EducatorEvent(
                company_id=company.id,
                title=ev_data["title"],
                description=ev_data.get("description"),
                start_at=start_at,
                end_at=end_at,
                is_multi_day=ev_data.get("is_multi_day", False),
                is_online=ev_data.get("is_online", False),
                venue_name=ev_data.get("venue_name"),
                venue_address=ev_data.get("venue_address"),
                city_id=kyiv_id if not ev_data.get("is_online") else None,
                price=ev_data.get("early_bird_price", 0) if ev_data.get("tickets") else ev_data.get("price", 0),
                early_bird_price=ev_data.get("early_bird_price"),
                early_bird_until=future(ev_data["early_bird_offset"]) if ev_data.get("early_bird_offset") else None,
                max_participants=ev_data.get("max_participants"),
                is_published=ev_data.get("is_published", False),
            )
            session.add(event)
            await session.flush()
            print(f"  + Event: {event.title[:50]}... (id={event.id})")

            # Ticket types
            for j, ticket_data in enumerate(ev_data.get("tickets", [])):
                ticket = EventTicketType(
                    event_id=event.id,
                    name=ticket_data["name"],
                    description=ticket_data.get("description"),
                    price=ticket_data["price"],
                    quantity=ticket_data.get("quantity"),
                    sold_count=0,
                    is_active=True,
                    order=j,
                )
                session.add(ticket)

            await session.flush()

        # 5. Зареєструвати rostislav.nikolaiev@gmail.com на першу відкриту подію
        target_email = "rostislav.nikolaiev@gmail.com"
        user_res = await session.execute(
            select(User).where(User.email == target_email)
        )
        target_user = user_res.scalar_one_or_none()

        # Знайти конференцію (найбільш цікаву подію)
        events_res = await session.execute(
            select(EducatorEvent)
            .where(EducatorEvent.company_id == company.id, EducatorEvent.is_published == True)
            .order_by(EducatorEvent.start_at)
        )
        events_list = events_res.scalars().all()

        if events_list:
            # Реєструємо на конференцію (3-я подія) та на безкоштовний вебінар
            for ev in events_list:
                # Перевірити чи вже зареєстрований
                existing_reg = await session.execute(
                    select(EventRegistration).where(
                        EventRegistration.event_id == ev.id,
                        EventRegistration.email == target_email,
                    )
                )
                if existing_reg.scalar_one_or_none():
                    print(f"  ~ Вже зареєстрований на: {ev.title[:50]}")
                    continue

                # Знайти перший активний тип квитка
                ticket_res = await session.execute(
                    select(EventTicketType).where(
                        EventTicketType.event_id == ev.id,
                        EventTicketType.is_active == True,
                    ).order_by(EventTicketType.order).limit(1)
                )
                first_ticket = ticket_res.scalar_one_or_none()

                reg = EventRegistration(
                    event_id=ev.id,
                    user_id=target_user.id if target_user else None,
                    ticket_type_id=first_ticket.id if first_ticket else None,
                    ticket_count=1,
                    full_name="Ростислав Ніколаєв",
                    email=target_email,
                    phone="+380991234567",
                    telegram="@rostislav",
                    status=RegistrationStatus.CONFIRMED,
                    amount_paid=first_ticket.price if first_ticket else 0,
                )
                session.add(reg)

                if first_ticket:
                    first_ticket.sold_count += 1

                print(f"  ✓ Зареєстровано {target_email} на: {ev.title[:50]}")

        await session.commit()
        print("\n✅ Seed завершено успішно!")


if __name__ == "__main__":
    asyncio.run(seed())
