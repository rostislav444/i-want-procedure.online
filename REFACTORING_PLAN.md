# План рефакторинга системы ролей и профилей

## Текущая проблема
- Переусложнённая система с `role`, `user_roles`, `specialist_profiles`, `manager_profiles`
- Не понятно как разграничить роли
- ФОП не может быть одновременно владельцем, менеджером и специалистом

## Целевая архитектура

### 1. Таблица `users` (упростить)

**Убрать:**
- `role` (enum поле)
- `company_id` (устаревшее)

**Оставить:**
- `is_superadmin: bool` - админ платформы (доступ к /superadmin)
- Все остальные поля (telegram_id, email, name, google_* и т.д.)

### 2. Новая таблица `company_members` (вместо specialist_profiles + manager_profiles)

```python
class CompanyMember(Base):
    __tablename__ = "company_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"))
    position_id: Mapped[int | None] = mapped_column(ForeignKey("positions.id"), nullable=True)

    # Роли в компании (булевые)
    is_owner: Mapped[bool] = mapped_column(default=False)      # владелец/ФОП
    is_manager: Mapped[bool] = mapped_column(default=False)    # менеджер
    is_specialist: Mapped[bool] = mapped_column(default=False) # специалист/мастер

    # Дополнительные поля специалиста
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Уникальность: один user в одной company только один раз
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_user_company'),
    )
```

### 3. Таблица `member_services` (связь специалист ↔ услуги)

```python
class MemberService(Base):
    __tablename__ = "member_services"

    id: Mapped[int] = mapped_column(primary_key=True)
    member_id: Mapped[int] = mapped_column(ForeignKey("company_members.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))

    # Опционально: кастомная цена/длительность для этого специалиста
    custom_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    custom_duration: Mapped[int | None] = mapped_column(nullable=True)

    is_active: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (
        UniqueConstraint('member_id', 'service_id', name='uq_member_service'),
    )
```

### 4. Специальности = категории услуг

Таблица `service_categories` уже есть - это и есть "специальности" в рамках компании.

```
services.category_id → service_categories.id
```

Категории создаются для каждой компании отдельно.

### 5. Логика назначения услуг

**Для клиники (несколько специалистов):**
- Менеджер создаёт услуги
- Менеджер назначает каждому специалисту список услуг через `member_services`

**Для ФОП (один человек = владелец + специалист):**
- При создании услуги автоматически добавляется в `member_services` для владельца
- Или: если `is_owner=true AND is_specialist=true` → все услуги компании доступны

## Таблицы для удаления

1. `user_roles` - не нужна
2. `specialist_profiles` - заменяется на `company_members`
3. `manager_profiles` - заменяется на `company_members`
4. `client_profiles` - не нужна (клиенты в отдельной таблице `clients`)
5. `specialist_services` - заменяется на `member_services`

## Миграция данных

```sql
-- 1. Создать company_members из specialist_profiles
INSERT INTO company_members (user_id, company_id, position_id, is_specialist, bio, is_active)
SELECT user_id, company_id, position_id, true, bio, is_active
FROM specialist_profiles;

-- 2. Обновить is_manager из manager_profiles
UPDATE company_members cm
SET is_manager = true
FROM manager_profiles mp
WHERE cm.user_id = mp.user_id AND cm.company_id = mp.company_id;

-- 3. Добавить недостающих менеджеров
INSERT INTO company_members (user_id, company_id, is_manager)
SELECT mp.user_id, mp.company_id, true
FROM manager_profiles mp
WHERE NOT EXISTS (
    SELECT 1 FROM company_members cm
    WHERE cm.user_id = mp.user_id AND cm.company_id = mp.company_id
);

-- 4. Перенести member_services из specialist_services
INSERT INTO member_services (member_id, service_id, custom_price, custom_duration, is_active)
SELECT cm.id, ss.service_id, ss.custom_price, ss.custom_duration_minutes, ss.is_active
FROM specialist_services ss
JOIN specialist_profiles sp ON ss.specialist_profile_id = sp.id
JOIN company_members cm ON cm.user_id = sp.user_id AND cm.company_id = sp.company_id;

-- 5. Установить is_owner для владельцев компаний
UPDATE company_members cm
SET is_owner = true
FROM companies c
WHERE cm.company_id = c.id
AND cm.user_id = (SELECT user_id FROM specialist_profiles WHERE company_id = c.id ORDER BY created_at LIMIT 1);
```

## Изменения в API

### auth.py
- Убрать `role` из ответа `/auth/me`
- Добавить `companies: list[CompanyMemberInfo]` с ролями в каждой компании

### companies.py
- Использовать `company_members` вместо `specialist_profiles`

### appointments.py
- Заменить `specialist_profile_id` на `member_id`

### Боты
- doctor_bot: создавать `CompanyMember` вместо отдельных профилей
- client_bot: без изменений

## Изменения в Frontend

### Авторизация
- После логина получать список компаний пользователя
- Если несколько компаний → показать выбор
- Сохранять `current_company_id` в localStorage

### Админ-панель
- Страница "Команда" работает с `company_members`
- Страница "Услуги" - назначение услуг специалистам

## Порядок выполнения

1. [ ] Создать новые модели (`company_members`, `member_services`)
2. [ ] Создать миграцию Alembic
3. [ ] Обновить API endpoints
4. [ ] Обновить doctor_bot регистрацию
5. [ ] Обновить frontend
6. [ ] Удалить старые таблицы

## Примечания

- `positions` - оставить как есть (должности в компании)
- `specialties` + `user_specialties` - можно удалить или оставить для профиля пользователя (его квалификации)
- `clients` - отдельная сущность, не трогаем
- `client_companies` - оставить (связь клиент ↔ компания)
