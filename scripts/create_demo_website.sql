-- Update company with nice info
UPDATE companies SET
    industry_theme = 'cosmetology',
    description = 'Професійний догляд за вашою шкірою. Індивідуальний підхід, сучасні методики та преміальна косметика для вашої краси.',
    specialization = 'Косметолог-естетист',
    address = 'м. Київ, вул. Хрещатик, 22, оф. 305',
    phone = '+380 67 123 45 67',
    working_hours = 'Пн-Пт: 10:00-20:00, Сб: 10:00-18:00'
WHERE id = 2;

-- Delete existing sections
DELETE FROM website_sections WHERE company_id = 2;

-- Hero section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'hero', 0, true, '{"title": "Олена Коваленко", "subtitle": "Професійний косметолог-естетист з 10-річним досвідом. Допоможу вам виглядати та почуватися чудово!", "cta_text": "Записатися на консультацію", "variant": "gradient", "image_url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80"}'::jsonb, NOW(), NOW());

-- About section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'about', 1, true, '{"title": "Про мене", "text": "Вітаю! Я Олена — сертифікований косметолог з понад 10 років досвіду у сфері естетичної косметології.\n\nМоя місія — допомогти кожній жінці розкрити свою природну красу та почуватися впевнено. Я постійно вдосконалюю свої навички, відвідуючи міжнародні конференції та майстер-класи.\n\nВикористовую тільки сертифіковану косметику преміум-класу від провідних світових брендів: Dermalogica, Thalgo, Holy Land.", "image_url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80"}'::jsonb, NOW(), NOW());

-- Services section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'services', 2, true, '{"title": "Мої послуги", "subtitle": "Комплексний догляд за обличчям та тілом з використанням найсучасніших методик", "display_mode": "cards", "show_prices": true, "show_duration": true}'::jsonb, NOW(), NOW());

-- Benefits section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'benefits', 3, true, '{"title": "Чому обирають мене", "items": [{"icon": "award", "title": "Досвід та кваліфікація", "description": "10+ років практики, міжнародні сертифікати"}, {"icon": "heart", "title": "Індивідуальний підхід", "description": "Персональна програма для кожного клієнта"}, {"icon": "shield", "title": "Безпека та стерильність", "description": "Одноразові інструменти, сертифікована косметика"}, {"icon": "sparkles", "title": "Видимий результат", "description": "Ефект вже після першої процедури"}]}'::jsonb, NOW(), NOW());

-- Gallery section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'gallery', 4, true, '{"title": "Мої роботи", "subtitle": "Результати процедур", "images": [{"url": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80", "alt": "Чистка обличчя"}, {"url": "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&q=80", "alt": "Догляд за шкірою"}, {"url": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80", "alt": "Масаж обличчя"}, {"url": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80", "alt": "Косметологія"}, {"url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80", "alt": "Результат"}, {"url": "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80", "alt": "Доглянута шкіра"}]}'::jsonb, NOW(), NOW());

-- Testimonials section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'testimonials', 5, true, '{"title": "Відгуки клієнтів", "items": [{"name": "Марія К.", "text": "Олена — справжній професіонал! Після курсу процедур моя шкіра просто сяє. Дуже вдячна за індивідуальний підхід.", "rating": 5}, {"name": "Анна П.", "text": "Ходжу до Олени вже 3 роки. Завжди задоволена результатом. Рекомендую всім подругам!", "rating": 5}, {"name": "Катерина М.", "text": "Нарешті знайшла свого косметолога! Олена дуже уважна, все пояснює, підбирає догляд індивідуально.", "rating": 5}]}'::jsonb, NOW(), NOW());

-- Contact section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'contact', 6, true, '{"title": "Контакти", "subtitle": "Запишіться на консультацію або задайте питання", "show_phone": true, "show_telegram": true, "show_address": true, "show_working_hours": true}'::jsonb, NOW(), NOW());

-- Map section
INSERT INTO website_sections (company_id, section_type, "order", is_visible, content, created_at, updated_at)
VALUES (2, 'map', 7, true, '{"title": "Як нас знайти", "address": "м. Київ, вул. Хрещатик, 22, оф. 305", "coordinates": {"lat": 50.4501, "lng": 30.5234}, "zoom": 16}'::jsonb, NOW(), NOW());
