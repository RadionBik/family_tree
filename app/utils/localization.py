"""
Basic localization module for Russian text strings.
"""

# Dictionary to hold translations. Can be expanded later.
# Keys are identifiers, values are Russian strings.
translations = {
    # General
    "error_occurred": "Произошла ошибка",
    "invalid_input": "Неверный ввод",
    # API Specific
    "api_welcome": "Привет, Семейное Древо! API работает.",
    # Birthdays
    # Subscriptions
    "subscription_successful": "Вы успешно подписались на уведомления.",
    "email_already_subscribed": "Этот email уже подписан.",
    # Authentication
    "auth_user_not_found": "Пользователь с таким именем не найден.",
    "auth_user_inactive": "Учетная запись пользователя неактивна.",
    "auth_invalid_credentials": "Неверное имя пользователя или пароль.",
    "auth_token_invalid": "Недействительный или просроченный токен.",
    # Relationship Errors
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
        return text.format(**kwargs)
    except KeyError as e:
        print(f"Warning: Missing format key '{e}' for translation key '{key}'")
        return text
