import csv
import io
import logging
import os
from datetime import date, datetime
from pathlib import Path

from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("google_sheets_utils")

# Load environment variables
load_dotenv()


def parse_sheet_date(date_str: str) -> date | None:
    """Parse date string from various formats into date object"""
    if not date_str:
        return None

    # Try different date formats
    formats = [
        "%Y-%m-%d",  # ISO format (preferred)
        "%d/%m/%Y",  # 19/04/1953
        "%m/%d/%Y",  # 04/19/1953 (US format)
        "%d-%m-%Y",  # 19-04-1953
        "%d %b %Y",  # 19 Apr 1953
        "%d %B %Y",  # 19 April 1953
        "%Y/%m/%d",  # 1953/04/19
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    logger.warning(f"Invalid date format: {date_str}")
    return None


def get_family_data_from_sheet():
    """Download Google Sheet as CSV using service account credentials"""
    try:
        service_account_file_name = os.getenv("GOOGLE_SERVICE_ACCOUNT_FILE")
        SPREADSHEET_ID = os.getenv("GOOGLE_SPREADSHEET_ID")
        SHEET_NAME = os.getenv("GOOGLE_SHEET_NAME", "Family Data")

        if not service_account_file_name or not SPREADSHEET_ID:
            logger.error("Google Sheets credentials not configured")
            return None

        # Construct an absolute path to the credentials file from the project root
        project_root = Path(__file__).parent.parent
        service_account_path = project_root / service_account_file_name

        if not service_account_path.is_file():
            logger.error(f"Service account file not found at: {service_account_path}")
            return None

        creds = Credentials.from_service_account_file(service_account_path)
        scoped_creds = creds.with_scopes(
            [
                "https://www.googleapis.com/auth/drive.readonly",
                "https://www.googleapis.com/auth/spreadsheets.readonly",
            ]
        )

        # Build Google Sheets API client
        service = build("sheets", "v4", credentials=scoped_creds)

        # Get sheet data
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=SPREADSHEET_ID, range=SHEET_NAME)
            .execute()
        )

        # Convert to CSV
        values = result.get("values", [])
        if not values:
            logger.error("No data found in sheet")
            return None

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(values)
        return output.getvalue()

    except Exception as e:
        logger.error(f"Error downloading sheet: {str(e)}")
        return None
