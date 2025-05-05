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

    # Family Member CRUD Errors
    "error_creating_member": "Ошибка при создании члена семьи.",
    "error_member_not_found": "Член семьи не найден.",
    "error_fetching_member": "Ошибка при получении данных члена семьи.",
    "error_updating_member": "Ошибка при обновлении члена семьи.",
    "error_deleting_member": "Ошибка при удалении члена семьи.",
    "error_member_not_found_detail": "Член семьи с ID {member_id} не найден.",

    # Relationship Errors
    "error_creating_relation": "Ошибка при создании связи.",
    "error_deleting_relation": "Ошибка при удалении связи.",
    "error_relation_not_found_detail": "Связь с ID {relation_id} не найдена.",
    "error_relation_self": "Нельзя создать связь члена семьи с самим собой.",
    "error_relation_invalid_type": "Недопустимый тип связи: {type}.",
    "error_listing_members": "Ошибка при получении списка членов семьи.",

    # Batch Operations
    "error_batch_delete_empty_list": "Список ID для удаления не может быть пустым.",
    "success_batch_delete": "Успешно удалено {count} членов семьи.",
    "error_batch_delete_failed": "Ошибка во время массового удаления членов семьи.",

    # Add more translations as needed...
}

def get_text(key: str, default: str = "Translation missing", **kwargs) -> str:
    """
    Retrieves a translated string for the given key and formats it
    with the provided keyword arguments.

    Args:
        key: The identifier for the translation string.
        default: The string to return if the key is not found.
        **kwargs: Keyword arguments for formatting the string (e.g., member_id=1).

    Returns:
        The translated and formatted Russian string or the default value.
    """
    text = translations.get(key, default)
    try:
        # Use .format() for simple placeholder replacement
        return text.format(**kwargs)
    except KeyError as e:
        # Handle cases where a placeholder exists in the string but wasn't provided in kwargs
        print(f"Warning: Missing format key '{e}' for translation key '{key}'")
        return text # Return the unformatted string

# Example usage:
# from .localization import get_text
# message = get_text("api_welcome")