"""Monobank Acquiring API integration service."""
import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

MONOBANK_API_URL = "https://api.monobank.ua/api/merchant"


class MonobankError(Exception):
    """Monobank API error."""
    def __init__(self, message: str, status_code: int = 0):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def _make_request(
    method: str,
    path: str,
    token: str,
    json: dict = None,
    params: dict = None,
) -> dict:
    """Make a request to Monobank API."""
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method,
            f"{MONOBANK_API_URL}{path}",
            json=json,
            params=params,
            headers={"X-Token": token},
            timeout=15.0,
        )

    if response.status_code != 200:
        logger.error(f"Monobank {path} failed: {response.status_code} {response.text}")
        raise MonobankError(
            f"Monobank API error: {response.text}",
            status_code=response.status_code,
        )

    return response.json()


# ============================================================
# Platform billing (uses platform MONOBANK_TOKEN)
# ============================================================

async def create_invoice(
    amount: int,
    reference: str,
    destination: str,
    redirect_url: str,
    webhook_url: str,
    save_card_data: Optional[dict] = None,
    ccy: int = 980,  # UAH
) -> dict:
    """
    Create a Monobank payment invoice for platform subscription.

    Args:
        amount: Amount in kopecks (e.g., 29900 = 299.00 UAH)
        reference: Unique payment reference
        destination: Payment description shown to user
        redirect_url: URL to redirect after payment
        webhook_url: URL for payment status callbacks
        save_card_data: Optional dict for tokenized card saving
        ccy: Currency code (980 = UAH)

    Returns:
        dict with 'invoiceId' and 'pageUrl'
    """
    if not settings.MONOBANK_TOKEN:
        raise MonobankError("Platform Monobank token not configured")

    payload = {
        "amount": amount,
        "ccy": ccy,
        "merchantPaymInfo": {
            "reference": reference,
            "destination": destination,
        },
        "redirectUrl": redirect_url,
        "webHookUrl": webhook_url,
    }

    # Enable card tokenization for recurring payments
    if save_card_data:
        payload["saveCardData"] = save_card_data

    data = await _make_request("POST", "/invoice/create", settings.MONOBANK_TOKEN, json=payload)
    logger.info(f"Monobank invoice created: {data.get('invoiceId')} for ref={reference}")
    return data


async def get_invoice_status(invoice_id: str) -> dict:
    """Get the status of a Monobank invoice (platform token)."""
    if not settings.MONOBANK_TOKEN:
        raise MonobankError("Platform Monobank token not configured")

    return await _make_request(
        "GET", "/invoice/status",
        settings.MONOBANK_TOKEN,
        params={"invoiceId": invoice_id},
    )


# ============================================================
# Client payments (uses company's own monobank_token)
# ============================================================

async def create_client_invoice(
    merchant_token: str,
    amount: int,
    reference: str,
    destination: str,
    redirect_url: str,
    webhook_url: str,
    ccy: int = 980,
) -> dict:
    """
    Create a Monobank invoice for a client payment (service payment).
    Uses the company's own Monobank merchant token.

    Args:
        merchant_token: Company's Monobank Acquiring token
        amount: Amount in kopecks
        reference: Payment reference (e.g., "apt_123")
        destination: Description (e.g., service name)
        redirect_url: Redirect URL after payment
        webhook_url: Webhook URL for status updates

    Returns:
        dict with 'invoiceId' and 'pageUrl'
    """
    payload = {
        "amount": amount,
        "ccy": ccy,
        "merchantPaymInfo": {
            "reference": reference,
            "destination": destination,
        },
        "redirectUrl": redirect_url,
        "webHookUrl": webhook_url,
        "validity": 3600,  # 1 hour validity
    }

    data = await _make_request("POST", "/invoice/create", merchant_token, json=payload)
    logger.info(f"Client invoice created: {data.get('invoiceId')} for ref={reference}")
    return data


async def get_client_invoice_status(merchant_token: str, invoice_id: str) -> dict:
    """Get status of a client payment invoice."""
    return await _make_request(
        "GET", "/invoice/status",
        merchant_token,
        params={"invoiceId": invoice_id},
    )


# ============================================================
# Tokenized / Recurring payments
# ============================================================

async def charge_by_token(
    card_token: str,
    amount: int,
    reference: str,
    destination: str,
    webhook_url: str,
    ccy: int = 980,
) -> dict:
    """
    Charge a saved card using its token (recurring payment).

    Uses POST /api/merchant/wallet/payment
    """
    if not settings.MONOBANK_TOKEN:
        raise MonobankError("Platform Monobank token not configured")

    payload = {
        "cardToken": card_token,
        "amount": amount,
        "ccy": ccy,
        "merchantPaymInfo": {
            "reference": reference,
            "destination": destination,
        },
        "webHookUrl": webhook_url,
    }

    data = await _make_request("POST", "/wallet/payment", settings.MONOBANK_TOKEN, json=payload)
    logger.info(f"Token charge: {data.get('invoiceId')} for ref={reference}")
    return data
