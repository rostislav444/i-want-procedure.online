"""
Seed script to populate inventory for a cosmetology clinic.
Usage: python seed_inventory.py
Requires: the backend server running at localhost:8000
"""
import asyncio
import httpx

BASE_URL = "http://localhost:8000/api/v1"

# First, we need to login to get a token
async def login(email: str, password: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password,
        })
        if resp.status_code != 200:
            # Try form login
            resp = await client.post(f"{BASE_URL}/auth/login", data={
                "username": email,
                "password": password,
            })
        if resp.status_code != 200:
            raise Exception(f"Login failed: {resp.status_code} {resp.text}")
        data = resp.json()
        return data.get("access_token") or data.get("token")


async def seed():
    # Login
    token = await login("rostislav.nikolaiev@gmail.com", "admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(base_url=BASE_URL, headers=headers, timeout=30) as client:
        # Get company info
        me_resp = await client.get("/users/me")
        if me_resp.status_code != 200:
            me_resp = await client.get("/auth/me")
        print(f"User: {me_resp.json()}")

        # ==================== BRANDS ====================
        brands_data = [
            {"name": "Dermalogica", "slug": "dermalogica", "description": "Професійна косметика для догляду за шкірою", "website": "https://www.dermalogica.com", "order": 1},
            {"name": "Holy Land", "slug": "holy-land", "description": "Ізраїльська професійна косметика", "website": "https://www.holyland.co.il", "order": 2},
            {"name": "Medik8", "slug": "medik8", "description": "Британська космецевтика з науковим підходом", "website": "https://www.medik8.com", "order": 3},
            {"name": "Bioderma", "slug": "bioderma", "description": "Французька дерматологічна косметика", "website": "https://www.bioderma.com", "order": 4},
            {"name": "Mesoestetic", "slug": "mesoestetic", "description": "Іспанська космецевтика для мезотерапії", "website": "https://www.mesoestetic.com", "order": 5},
            {"name": "GERnétic", "slug": "gernetic", "description": "Французька клітинна косметика", "website": "https://www.gernetic.com", "order": 6},
        ]

        brand_ids = {}
        for b in brands_data:
            resp = await client.post("/inventory/brands", json=b)
            if resp.status_code in (200, 201):
                brand_ids[b["slug"]] = resp.json()["id"]
                print(f"  Brand created: {b['name']} -> ID {brand_ids[b['slug']]}")
            else:
                print(f"  Brand error: {b['name']} -> {resp.status_code} {resp.text}")

        # ==================== COLLECTIONS ====================
        collections_data = {
            "dermalogica": [
                {"name": "AGE Smart", "slug": "age-smart", "description": "Антивікова лінія", "order": 1},
                {"name": "UltraCalming", "slug": "ultracalming", "description": "Для чутливої шкіри", "order": 2},
                {"name": "Active Clearing", "slug": "active-clearing", "description": "Для проблемної шкіри", "order": 3},
            ],
            "holy-land": [
                {"name": "C the SUCCESS", "slug": "c-the-success", "description": "Лінія з вітаміном С", "order": 1},
                {"name": "ABR Peeling", "slug": "abr-peeling", "description": "Пілінги", "order": 2},
                {"name": "Juvelast", "slug": "juvelast", "description": "Зволожуюча лінія", "order": 3},
            ],
            "medik8": [
                {"name": "CSA Philosophy", "slug": "csa-philosophy", "description": "Вітамін С + Сонцезахист + Ретинол", "order": 1},
                {"name": "Peel", "slug": "peel", "description": "Професійні пілінги", "order": 2},
            ],
            "mesoestetic": [
                {"name": "Mesopeel", "slug": "mesopeel", "description": "Хімічні пілінги", "order": 1},
                {"name": "Mesoéclat", "slug": "mesoeclat", "description": "Відновлення сяйва", "order": 2},
            ],
        }

        collection_ids = {}
        for brand_slug, collections in collections_data.items():
            if brand_slug not in brand_ids:
                continue
            for c in collections:
                resp = await client.post(f"/inventory/brands/{brand_ids[brand_slug]}/collections", json=c)
                if resp.status_code in (200, 201):
                    collection_ids[c["slug"]] = resp.json()["id"]
                    print(f"  Collection created: {c['name']} -> ID {collection_ids[c['slug']]}")
                else:
                    print(f"  Collection error: {c['name']} -> {resp.status_code} {resp.text}")

        # ==================== CATEGORIES ====================
        categories_data = [
            {"name": "Засоби для обличчя", "description": "Професійна косметика для обличчя", "order": 1},
            {"name": "Засоби для тіла", "description": "Догляд за тілом", "order": 2},
            {"name": "Ін'єкційна косметологія", "description": "Препарати для ін'єкцій", "order": 3},
            {"name": "Апаратна косметологія", "description": "Витратні матеріали для апаратних процедур", "order": 4},
            {"name": "Одноразові матеріали", "description": "Одноразові витратні матеріали", "order": 5},
        ]

        cat_ids = {}
        for c in categories_data:
            resp = await client.post("/inventory/categories", json=c)
            if resp.status_code in (200, 201):
                cat_ids[c["name"]] = resp.json()["id"]
                print(f"  Category created: {c['name']} -> ID {cat_ids[c['name']]}")
            else:
                print(f"  Category error: {c['name']} -> {resp.status_code} {resp.text}")

        # Subcategories
        subcategories = {
            "Засоби для обличчя": [
                {"name": "Очищення", "description": "Очищуючі засоби", "order": 1},
                {"name": "Тоніки та лосьйони", "description": "Тонізуючі засоби", "order": 2},
                {"name": "Сироватки", "description": "Активні сироватки", "order": 3},
                {"name": "Креми", "description": "Креми для обличчя", "order": 4},
                {"name": "Маски", "description": "Маски для обличчя", "order": 5},
                {"name": "Пілінги", "description": "Пілінги та ексфоліанти", "order": 6},
                {"name": "Сонцезахист", "description": "SPF засоби", "order": 7},
            ],
            "Ін'єкційна косметологія": [
                {"name": "Філери", "description": "Дермальні філери на основі гіалуронової кислоти", "order": 1},
                {"name": "Ботулотоксин", "description": "Препарати ботулотоксину", "order": 2},
                {"name": "Біоревіталізанти", "description": "Препарати для біоревіталізації", "order": 3},
                {"name": "Мезококтейлі", "description": "Мезотерапевтичні препарати", "order": 4},
            ],
            "Одноразові матеріали": [
                {"name": "Рукавички", "description": "Одноразові рукавички", "order": 1},
                {"name": "Серветки та ватні диски", "description": "Серветки, ватні диски", "order": 2},
                {"name": "Шприци та голки", "description": "Шприци, голки, канюлі", "order": 3},
            ],
        }

        subcat_ids = {}
        for parent_name, subs in subcategories.items():
            if parent_name not in cat_ids:
                continue
            for s in subs:
                s["parent_id"] = cat_ids[parent_name]
                resp = await client.post("/inventory/categories", json=s)
                if resp.status_code in (200, 201):
                    subcat_ids[s["name"]] = resp.json()["id"]
                    print(f"    Subcategory created: {s['name']} -> ID {subcat_ids[s['name']]}")
                else:
                    print(f"    Subcategory error: {s['name']} -> {resp.status_code} {resp.text}")

        # ==================== INVENTORY ITEMS ====================
        # Helper to get category/brand/collection IDs
        def get_cat(name): return subcat_ids.get(name) or cat_ids.get(name)
        def get_brand(slug): return brand_ids.get(slug)
        def get_col(slug): return collection_ids.get(slug)

        items_data = [
            # === Очищення ===
            {
                "name": "Daily Microfoliant",
                "category_id": get_cat("Очищення"),
                "brand_id": get_brand("dermalogica"),
                "sku": "DRM-001",
                "description": "Щоденний мікрофоліант з рисовими ензимами. Делікатно відлущує, освітлює шкіру.",
                "usage_type": "both",
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Dermalogica",
                "variants": [
                    {"name": "13g", "sku": "DRM-001-13", "purchase_price": 450, "sale_price": 750, "initial_stock": 8, "is_default": True, "order": 1},
                    {"name": "74g", "sku": "DRM-001-74", "purchase_price": 1200, "sale_price": 1950, "initial_stock": 5, "order": 2},
                ],
            },
            {
                "name": "Міцелярна вода Sensibio H2O",
                "category_id": get_cat("Очищення"),
                "brand_id": get_brand("bioderma"),
                "sku": "BIO-001",
                "description": "Міцелярна вода для чутливої шкіри. М'яко очищує без пересушування.",
                "usage_type": "both",
                "unit": "шт",
                "min_stock_level": 5,
                "manufacturer": "Bioderma",
                "variants": [
                    {"name": "250 мл", "sku": "BIO-001-250", "purchase_price": 320, "sale_price": 520, "initial_stock": 12, "is_default": True, "order": 1},
                    {"name": "500 мл", "sku": "BIO-001-500", "purchase_price": 480, "sale_price": 780, "initial_stock": 6, "order": 2},
                ],
            },
            {
                "name": "UltraCalming Cleanser",
                "category_id": get_cat("Очищення"),
                "brand_id": get_brand("dermalogica"),
                "collection_id": get_col("ultracalming"),
                "sku": "DRM-UC-001",
                "description": "Ніжний очищуючий гель для чутливої, реактивної шкіри.",
                "usage_type": "internal",
                "purchase_price": 850,
                "sale_price": 1400,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Dermalogica",
                "initial_stock": 6,
            },

            # === Тоніки ===
            {
                "name": "Multi-Active Toner",
                "category_id": get_cat("Тоніки та лосьйони"),
                "brand_id": get_brand("dermalogica"),
                "sku": "DRM-002",
                "description": "Легкий тонік-спрей з алое та лавандою. Зволожує та освіжає.",
                "usage_type": "both",
                "purchase_price": 680,
                "sale_price": 1100,
                "unit": "шт",
                "min_stock_level": 4,
                "manufacturer": "Dermalogica",
                "initial_stock": 10,
            },
            {
                "name": "Face Lotion C the SUCCESS",
                "category_id": get_cat("Тоніки та лосьйони"),
                "brand_id": get_brand("holy-land"),
                "collection_id": get_col("c-the-success"),
                "sku": "HL-CS-001",
                "description": "Лосьйон з вітаміном С для сяйва шкіри.",
                "usage_type": "internal",
                "purchase_price": 520,
                "sale_price": 850,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Holy Land",
                "initial_stock": 7,
            },

            # === Сироватки ===
            {
                "name": "Crystal Retinal",
                "category_id": get_cat("Сироватки"),
                "brand_id": get_brand("medik8"),
                "collection_id": get_col("csa-philosophy"),
                "sku": "MED-001",
                "description": "Стабілізований ретинальдегід для оновлення шкіри. Антивіковий ефект без подразнення.",
                "usage_type": "both",
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Medik8",
                "variants": [
                    {"name": "Crystal Retinal 1 (0.01%)", "sku": "MED-001-1", "purchase_price": 1100, "sale_price": 1800, "initial_stock": 4, "order": 1},
                    {"name": "Crystal Retinal 3 (0.03%)", "sku": "MED-001-3", "purchase_price": 1200, "sale_price": 1950, "initial_stock": 5, "is_default": True, "order": 2},
                    {"name": "Crystal Retinal 6 (0.06%)", "sku": "MED-001-6", "purchase_price": 1300, "sale_price": 2100, "initial_stock": 3, "order": 3},
                    {"name": "Crystal Retinal 10 (0.1%)", "sku": "MED-001-10", "purchase_price": 1400, "sale_price": 2300, "initial_stock": 2, "order": 4},
                ],
            },
            {
                "name": "C-Tetra Luxe",
                "category_id": get_cat("Сироватки"),
                "brand_id": get_brand("medik8"),
                "collection_id": get_col("csa-philosophy"),
                "sku": "MED-002",
                "description": "Ліпідна сироватка з вітаміном С та сквалану. Антиоксидантний захист та живлення.",
                "usage_type": "both",
                "purchase_price": 1500,
                "sale_price": 2400,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Medik8",
                "initial_stock": 6,
            },
            {
                "name": "Super Serum Advance+",
                "category_id": get_cat("Сироватки"),
                "brand_id": get_brand("holy-land"),
                "sku": "HL-002",
                "description": "Мультиактивна сироватка з гіалуроновою кислотою та пептидами.",
                "usage_type": "internal",
                "purchase_price": 780,
                "sale_price": 1250,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Holy Land",
                "initial_stock": 5,
            },

            # === Креми ===
            {
                "name": "AGE Smart MAP-15 Regenerator",
                "category_id": get_cat("Креми"),
                "brand_id": get_brand("dermalogica"),
                "collection_id": get_col("age-smart"),
                "sku": "DRM-AS-001",
                "description": "Потужний антиоксидант з вітаміном С (MAP) для регенерації шкіри.",
                "usage_type": "both",
                "purchase_price": 2100,
                "sale_price": 3400,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Dermalogica",
                "initial_stock": 4,
            },
            {
                "name": "Advanced Night Restore",
                "category_id": get_cat("Креми"),
                "brand_id": get_brand("medik8"),
                "sku": "MED-003",
                "description": "Нічний відновлювальний крем з мульті-керамідним комплексом.",
                "usage_type": "both",
                "purchase_price": 1300,
                "sale_price": 2100,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Medik8",
                "initial_stock": 7,
            },
            {
                "name": "Juvelast Nourishing Cream",
                "category_id": get_cat("Креми"),
                "brand_id": get_brand("holy-land"),
                "collection_id": get_col("juvelast"),
                "sku": "HL-JV-001",
                "description": "Живильний крем для сухої та дегідратованої шкіри.",
                "usage_type": "internal",
                "purchase_price": 680,
                "sale_price": 1100,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Holy Land",
                "initial_stock": 8,
            },

            # === Маски ===
            {
                "name": "Multivitamin Power Recovery Masque",
                "category_id": get_cat("Маски"),
                "brand_id": get_brand("dermalogica"),
                "sku": "DRM-003",
                "description": "Відновлювальна маска з вітамінами А, С, Е. Живить та захищає шкіру.",
                "usage_type": "internal",
                "purchase_price": 1100,
                "sale_price": 1800,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Dermalogica",
                "initial_stock": 5,
            },
            {
                "name": "Mesoéclat Mask",
                "category_id": get_cat("Маски"),
                "brand_id": get_brand("mesoestetic"),
                "collection_id": get_col("mesoeclat"),
                "sku": "MSE-001",
                "description": "Маска для миттєвого сяйва шкіри з гліколевою та молочною кислотою.",
                "usage_type": "internal",
                "purchase_price": 950,
                "sale_price": 1550,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Mesoestetic",
                "initial_stock": 4,
            },

            # === Пілінги ===
            {
                "name": "Mesopeel Jessner",
                "category_id": get_cat("Пілінги"),
                "brand_id": get_brand("mesoestetic"),
                "collection_id": get_col("mesopeel"),
                "sku": "MSE-PL-001",
                "description": "Модифікований пілінг Джесснера. Для жирної та проблемної шкіри.",
                "usage_type": "internal",
                "purchase_price": 1800,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Mesoestetic",
                "initial_stock": 3,
            },
            {
                "name": "Mesopeel TCA 15%",
                "category_id": get_cat("Пілінги"),
                "brand_id": get_brand("mesoestetic"),
                "collection_id": get_col("mesopeel"),
                "sku": "MSE-PL-002",
                "description": "Середній пілінг на основі трихлороцтової кислоти. Вирівнює тон та текстуру.",
                "usage_type": "internal",
                "purchase_price": 2200,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 1,
                "manufacturer": "Mesoestetic",
                "initial_stock": 2,
            },
            {
                "name": "ABR Peel Holy Land",
                "category_id": get_cat("Пілінги"),
                "brand_id": get_brand("holy-land"),
                "collection_id": get_col("abr-peeling"),
                "sku": "HL-ABR-001",
                "description": "Альфа-бета-ретинол пілінг. Комплексний пілінг для всіх типів шкіри.",
                "usage_type": "internal",
                "purchase_price": 1500,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Holy Land",
                "initial_stock": 4,
            },
            {
                "name": "Even Better Clinical Peel",
                "category_id": get_cat("Пілінги"),
                "brand_id": get_brand("medik8"),
                "collection_id": get_col("peel"),
                "sku": "MED-PL-001",
                "description": "Професійний пілінг з азелаїновою та мандельовою кислотами.",
                "usage_type": "internal",
                "purchase_price": 1900,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Medik8",
                "initial_stock": 3,
            },

            # === Сонцезахист ===
            {
                "name": "Dynamic Skin Recovery SPF50",
                "category_id": get_cat("Сонцезахист"),
                "brand_id": get_brand("dermalogica"),
                "collection_id": get_col("age-smart"),
                "sku": "DRM-SPF-001",
                "description": "Антивіковий крем з SPF50. Захист від UVA/UVB та вільних радикалів.",
                "usage_type": "both",
                "purchase_price": 1400,
                "sale_price": 2300,
                "unit": "шт",
                "min_stock_level": 4,
                "manufacturer": "Dermalogica",
                "initial_stock": 10,
            },
            {
                "name": "Advanced Day Total Protect SPF30",
                "category_id": get_cat("Сонцезахист"),
                "brand_id": get_brand("medik8"),
                "collection_id": get_col("csa-philosophy"),
                "sku": "MED-SPF-001",
                "description": "Денний крем з SPF30. Антиоксидантний захист + зволоження.",
                "usage_type": "both",
                "purchase_price": 1200,
                "sale_price": 1950,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Medik8",
                "initial_stock": 8,
            },

            # === Засоби для тіла ===
            {
                "name": "Body Hydrating Cream",
                "category_id": cat_ids.get("Засоби для тіла"),
                "brand_id": get_brand("dermalogica"),
                "sku": "DRM-BODY-001",
                "description": "Зволожуючий крем для тіла з гіалуроновою кислотою та маслом ши.",
                "usage_type": "both",
                "purchase_price": 750,
                "sale_price": 1200,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Dermalogica",
                "initial_stock": 6,
            },
            {
                "name": "Thermoactive Body Firming Cream",
                "category_id": cat_ids.get("Засоби для тіла"),
                "brand_id": get_brand("gernetic"),
                "sku": "GRN-001",
                "description": "Термоактивний зміцнюючий крем для тіла. Покращує пружність шкіри.",
                "usage_type": "internal",
                "purchase_price": 1600,
                "sale_price": 2600,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "GERnétic",
                "initial_stock": 3,
            },

            # === Філери ===
            {
                "name": "Juvederm Ultra 3",
                "category_id": get_cat("Філери"),
                "sku": "JUV-001",
                "description": "Дермальний філер на основі гіалуронової кислоти для корекції зморшок та збільшення об'єму губ.",
                "usage_type": "internal",
                "purchase_price": 4500,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Allergan",
                "initial_stock": 8,
            },
            {
                "name": "Juvederm Voluma",
                "category_id": get_cat("Філери"),
                "sku": "JUV-002",
                "description": "Волюмізуючий філер для моделювання контурів обличчя. Тривалий ефект до 18 місяців.",
                "usage_type": "internal",
                "purchase_price": 5200,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 2,
                "manufacturer": "Allergan",
                "initial_stock": 5,
            },
            {
                "name": "Restylane Lidocaine",
                "category_id": get_cat("Філери"),
                "sku": "RST-001",
                "description": "Філер з лідокаїном для корекції носогубних складок та зморшок.",
                "usage_type": "internal",
                "purchase_price": 3800,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Galderma",
                "initial_stock": 6,
            },

            # === Ботулотоксин ===
            {
                "name": "Botox (Ботулотоксин типу А)",
                "category_id": get_cat("Ботулотоксин"),
                "sku": "BTX-001",
                "description": "Ботулінічний токсин типу А 100 ОД. Для корекції мімічних зморшок.",
                "usage_type": "internal",
                "purchase_price": 3200,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 5,
                "manufacturer": "Allergan",
                "initial_stock": 12,
            },
            {
                "name": "Dysport 500 ОД",
                "category_id": get_cat("Ботулотоксин"),
                "sku": "DSP-001",
                "description": "Ботулінічний токсин типу А 500 ОД. Для великих зон корекції.",
                "usage_type": "internal",
                "purchase_price": 5500,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "Ipsen",
                "initial_stock": 6,
            },

            # === Біоревіталізанти ===
            {
                "name": "Teosyal RHA 1",
                "category_id": get_cat("Біоревіталізанти"),
                "sku": "TEO-001",
                "description": "Біоревіталізант з гіалуроновою кислотою для глибокого зволоження шкіри.",
                "usage_type": "internal",
                "purchase_price": 2800,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 4,
                "manufacturer": "Teoxane",
                "initial_stock": 10,
            },
            {
                "name": "Profhilo H+L",
                "category_id": get_cat("Біоревіталізанти"),
                "sku": "PRF-001",
                "description": "Біоремоделянт з високою та низькою молекулярною вагою гіалуронової кислоти.",
                "usage_type": "internal",
                "purchase_price": 4200,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 3,
                "manufacturer": "IBSA",
                "initial_stock": 6,
            },

            # === Мезококтейлі ===
            {
                "name": "NCTF 135HA",
                "category_id": get_cat("Мезококтейлі"),
                "sku": "NCT-001",
                "description": "Мезотерапевтичний коктейль з гіалуроновою кислотою, вітамінами та амінокислотами.",
                "usage_type": "internal",
                "purchase_price": 1800,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 5,
                "manufacturer": "Filorga",
                "initial_stock": 15,
            },
            {
                "name": "Dermaheal HSR",
                "category_id": get_cat("Мезококтейлі"),
                "sku": "DH-001",
                "description": "Мезококтейль для зволоження та відновлення шкіри з пептидами та гіалуроновою кислотою.",
                "usage_type": "internal",
                "purchase_price": 1200,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 5,
                "manufacturer": "Dermaheal",
                "initial_stock": 10,
            },

            # === Апаратна косметологія ===
            {
                "name": "Гель для УЗ-чистки",
                "category_id": cat_ids.get("Апаратна косметологія"),
                "sku": "APR-001",
                "description": "Контактний гель для ультразвукової чистки обличчя.",
                "usage_type": "internal",
                "purchase_price": 180,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 5,
                "initial_stock": 10,
            },
            {
                "name": "Контактний гель для RF-ліфтингу",
                "category_id": cat_ids.get("Апаратна косметологія"),
                "sku": "APR-002",
                "description": "Контактний гель для радіочастотного ліфтингу.",
                "usage_type": "internal",
                "purchase_price": 250,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 3,
                "initial_stock": 6,
            },
            {
                "name": "Розчин для гідропілінгу",
                "category_id": cat_ids.get("Апаратна косметологія"),
                "sku": "APR-003",
                "description": "Розчин АНА/ВНА кислот для апаратного гідропілінгу.",
                "usage_type": "internal",
                "unit": "шт",
                "min_stock_level": 3,
                "variants": [
                    {"name": "AHA розчин", "sku": "APR-003-AHA", "purchase_price": 600, "initial_stock": 4, "order": 1, "is_default": True},
                    {"name": "BHA розчин", "sku": "APR-003-BHA", "purchase_price": 650, "initial_stock": 4, "order": 2},
                    {"name": "Зволожуючий розчин", "sku": "APR-003-HYD", "purchase_price": 550, "initial_stock": 5, "order": 3},
                ],
            },

            # === Рукавички ===
            {
                "name": "Рукавички нітрилові",
                "category_id": get_cat("Рукавички"),
                "sku": "DSP-GLV-001",
                "description": "Нітрилові рукавички без пудри. Гіпоалергенні.",
                "usage_type": "internal",
                "unit": "упак",
                "min_stock_level": 10,
                "variants": [
                    {"name": "Розмір S", "sku": "DSP-GLV-001-S", "purchase_price": 180, "initial_stock": 20, "order": 1},
                    {"name": "Розмір M", "sku": "DSP-GLV-001-M", "purchase_price": 180, "initial_stock": 25, "is_default": True, "order": 2},
                    {"name": "Розмір L", "sku": "DSP-GLV-001-L", "purchase_price": 180, "initial_stock": 15, "order": 3},
                ],
            },

            # === Серветки ===
            {
                "name": "Ватні диски косметичні",
                "category_id": get_cat("Серветки та ватні диски"),
                "sku": "DSP-CTN-001",
                "description": "Безворсові ватні диски для косметичних процедур. 100 шт в упаковці.",
                "usage_type": "internal",
                "purchase_price": 85,
                "sale_price": None,
                "unit": "упак",
                "min_stock_level": 10,
                "quantity_in_pack": 100,
                "initial_stock": 20,
            },
            {
                "name": "Серветки безворсові",
                "category_id": get_cat("Серветки та ватні диски"),
                "sku": "DSP-NWP-001",
                "description": "Безворсові серветки зі спанлейсу для процедур. 100 шт.",
                "usage_type": "internal",
                "purchase_price": 120,
                "sale_price": None,
                "unit": "упак",
                "min_stock_level": 8,
                "quantity_in_pack": 100,
                "initial_stock": 15,
            },

            # === Шприци та голки ===
            {
                "name": "Шприци 1 мл інсулінові",
                "category_id": get_cat("Шприци та голки"),
                "sku": "DSP-SYR-001",
                "description": "Шприци інсулінові 1 мл з голкою 30G для мезотерапії та біоревіталізації.",
                "usage_type": "internal",
                "purchase_price": 8,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 50,
                "initial_stock": 200,
            },
            {
                "name": "Канюлі 25G x 50мм",
                "category_id": get_cat("Шприци та голки"),
                "sku": "DSP-CAN-001",
                "description": "Канюлі для контурної пластики. Мінімізують ризик гематом.",
                "usage_type": "internal",
                "purchase_price": 65,
                "sale_price": None,
                "unit": "шт",
                "min_stock_level": 20,
                "initial_stock": 50,
            },
            {
                "name": "Голки мезотерапевтичні 30G x 4мм",
                "category_id": get_cat("Шприци та голки"),
                "sku": "DSP-NDL-001",
                "description": "Голки для мезотерапії 30G. 100 шт в упаковці.",
                "usage_type": "internal",
                "purchase_price": 250,
                "sale_price": None,
                "unit": "упак",
                "min_stock_level": 5,
                "quantity_in_pack": 100,
                "initial_stock": 10,
            },
        ]

        created_count = 0
        for item in items_data:
            resp = await client.post("/inventory/items", json=item)
            if resp.status_code in (200, 201):
                created_count += 1
                item_data = resp.json()
                print(f"  Item created: {item['name']} (ID: {item_data['id']})")
            else:
                print(f"  Item error: {item['name']} -> {resp.status_code} {resp.text}")

        print(f"\n=== DONE ===")
        print(f"Brands: {len(brand_ids)}")
        print(f"Collections: {len(collection_ids)}")
        print(f"Categories: {len(cat_ids)}")
        print(f"Subcategories: {len(subcat_ids)}")
        print(f"Items: {created_count}")

        # Get stats
        stats_resp = await client.get("/inventory/stats")
        if stats_resp.status_code == 200:
            stats = stats_resp.json()
            print(f"\nInventory Stats:")
            print(f"  Total items: {stats['total_items']}")
            print(f"  Low stock: {stats['low_stock_items']}")
            print(f"  Total value: {stats['total_value']}")
            print(f"  For sale: {stats['items_for_sale']}")
            print(f"  Internal: {stats['items_internal']}")


if __name__ == "__main__":
    asyncio.run(seed())
