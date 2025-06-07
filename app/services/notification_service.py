import logging
import os
import smtplib
from email.mime.text import MIMEText

from config import config  # Import the config dictionary

logger = logging.getLogger(__name__)


def _get_russian_years_string(age: int) -> str:
    """Returns the correct Russian word for 'year(s)' based on age."""
    if 11 <= age % 100 <= 19:
        return "лет"
    last_digit = age % 10
    if last_digit == 1:
        return "год"
    elif 2 <= last_digit <= 4:
        return "года"
    else:
        return "лет"


def format_birthday_email(name: str, age: int) -> tuple[str, str]:
    """
    Formats the birthday notification email subject and body in Russian.

    Args:
        name: The name of the person celebrating their birthday.
        age: The age the person is turning.

    Returns:
        A tuple containing the email subject and body.
    """
    logger.debug(f"Formatting birthday email for {name}, age {age}")
    years_str = _get_russian_years_string(age)
    subject = f"🎉 С Днем Рождения, {name}!"
    body = (
        f"Привет!\n\n"
        f"Сегодня особенный день! Нашему дорогому члену семьи, {name}, исполняется {age} {years_str}!\n\n"
        f"Давайте все вместе поздравим {name} и пожелаем здоровья, счастья и всего наилучшего!\n\n"
        f"С наилучшими пожеланиями,\n"
        f"Ваше Семейное Древо"
    )
    logger.debug(f"Formatted email - Subject: {subject}")
    return subject, body


def send_email(subject: str, body: str, recipients: list[str], app_config=None) -> bool:
    """
    Sends an email using SMTP configuration.

    Args:
        subject: The email subject.
        body: The email body (plain text).
        recipients: A list of recipient email addresses.
        app_config: The application configuration object. If None, loads default config.

    Returns:
        True if the email was sent successfully to all recipients, False otherwise.
    """
    if app_config is None:
        config_name = os.getenv("APP_ENV", "development")
        app_config = config[config_name]
        logger.info(f"Loaded '{config_name}' configuration for email sending.")

    if not app_config.MAIL_SERVER:
        logger.error("Mail server not configured. Cannot send email.")
        return False

    sender = app_config.MAIL_DEFAULT_SENDER
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)

    logger.info(f"Attempting to send email. Subject: '{subject}', To: {recipients}")

    try:
        if app_config.MAIL_PORT == 465:
            server = smtplib.SMTP_SSL(
                app_config.MAIL_SERVER, app_config.MAIL_PORT, timeout=10
            )
            logger.debug(
                f"Connecting via SMTP_SSL to {app_config.MAIL_SERVER}:{app_config.MAIL_PORT}"
            )
        else:
            server = smtplib.SMTP(
                app_config.MAIL_SERVER, app_config.MAIL_PORT, timeout=10
            )
            logger.debug(
                f"Connecting via SMTP to {app_config.MAIL_SERVER}:{app_config.MAIL_PORT}"
            )
            if app_config.MAIL_USE_TLS:
                logger.debug("Starting TLS...")
                server.starttls()
                logger.debug("TLS started.")

        if app_config.MAIL_USERNAME and app_config.MAIL_PASSWORD:
            logger.debug(f"Logging in as {app_config.MAIL_USERNAME}...")
            server.login(app_config.MAIL_USERNAME, app_config.MAIL_PASSWORD)
            logger.debug("Login successful.")

        logger.debug("Sending email...")
        server.sendmail(sender, recipients, msg.as_string())
        logger.info(f"Email sent successfully to {recipients}.")
        server.quit()
        return True
    except smtplib.SMTPException as e:
        logger.error(f"SMTP Error sending email: {e}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Failed to send email: {e}", exc_info=True)
        return False
