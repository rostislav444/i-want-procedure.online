import json
from pathlib import Path
from typing import Optional

LOCALES_DIR = Path(__file__).parent / "locales"


class I18n:
    def __init__(self):
        self.translations = {}
        self.load_translations()

    def load_translations(self):
        for locale_file in LOCALES_DIR.glob("*.json"):
            lang = locale_file.stem
            with open(locale_file, "r", encoding="utf-8") as f:
                self.translations[lang] = json.load(f)

    def get(self, key: str, lang: str = "uk", **kwargs) -> str:
        """Get translation by key with optional formatting"""
        if lang not in self.translations:
            lang = "uk"

        # Support nested keys like "registration.ask_name"
        keys = key.split(".")
        value = self.translations[lang]

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return key  # Return key if translation not found

        if isinstance(value, str) and kwargs:
            return value.format(**kwargs)

        return value if isinstance(value, str) else key


i18n = I18n()


def t(key: str, lang: str = "uk", **kwargs) -> str:
    """Shortcut for getting translation"""
    return i18n.get(key, lang, **kwargs)
