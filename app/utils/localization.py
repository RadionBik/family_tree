# -*- coding: utf-8 -*-
"""
Basic localization module for Russian text strings.
"""

# Dictionary to hold translations. Can be expanded later.
# Keys are identifiers, values are Russian strings.
translations = {
    # General
    "hello": "Привет",
    "error_occurred": "Произошла ошибка",
    "success": "Успешно",
    "not_found": "Не найдено",
    "invalid_input": "Неверный ввод",

    # API Specific
    "api_welcome": "Привет, Семейное Древо! API работает.",
    "health_check_ok": "Сервис работает нормально.",

    # Family Tree
    "family_tree_retrieved": "Семейное древо успешно получено.",

    # Birthdays
    "upcoming_birthdays_retrieved": "Предстоящие дни рождения успешно получены.",
    "no_upcoming_birthdays": "В ближайшее время дней рождения нет.",

    # Subscriptions
    "subscription_successful": "Вы успешно подписались на уведомления.",
    "email_already_subscribed": "Этот email уже подписан.",
    "invalid_email": "Неверный формат email.",
    "unsubscribed_successfully": "Вы успешно отписались.",
    "subscription_not_found": "Подписка не найдена.",
    "confirmation_email_sent": "Письмо с подтверждением отправлено на ваш email.",
    "error_sending_email": "Ошибка при отправке email.",

    # Authentication
    "auth_user_not_found": "Пользователь с таким именем не найден.",
    "auth_user_inactive": "Учетная запись пользователя неактивна.",
    "auth_invalid_credentials": "Неверное имя пользователя или пароль.",
    "auth_successful": "Аутентификация прошла успешно.",
    "auth_token_invalid": "Недействительный или просроченный токен.",
    "auth_unauthorized": "Требуется аутентификация.",
    "auth_forbidden": "Доступ запрещен.",

    # Add more translations as needed...
}

def get_text(key: str, default: str = "Translation missing") -> str:
    """
    Retrieves a translated string for the given key.

    Args:
        key: The identifier for the translation string.
        default: The string to return if the key is not found.

    Returns:
        The translated Russian string or the default value.
    """
    return translations.get(key, default)

# Example usage:
# from .localization import get_text
# message = get_text("api_welcome")