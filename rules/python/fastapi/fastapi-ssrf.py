import urllib.request

import aiohttp
import httpx
import requests
from fastapi import APIRouter, Depends, FastAPI, Request
from pydantic import BaseModel

app = FastAPI()
router = APIRouter()

PARTNER_API = "https://partner.example.com/v1/"


class Webhook(BaseModel):
    callback_url: str


def get_settings():
    return {"status_url": "https://status.example.com/health"}


@app.get("/preview")
def preview(url: str):
    # ruleid: fastapi-ssrf
    return requests.get(url, timeout=5).text


@app.post("/webhooks/test")
async def test_webhook(hook: Webhook):
    async with httpx.AsyncClient() as client:
        # ruleid: fastapi-ssrf
        resp = await client.post(hook.callback_url, json={"ping": True})
    return {"status": resp.status_code}


@router.get("/fetch")
async def fetch_from_query(request: Request):
    target = request.query_params.get("target")
    async with aiohttp.ClientSession() as session:
        # ruleid: fastapi-ssrf
        async with session.get(target) as resp:
            return await resp.text()


@router.get("/avatar")
def avatar(image_url: str):
    # ruleid: fastapi-ssrf
    data = urllib.request.urlopen(image_url).read()
    return {"size": len(data)}


@app.get("/proxy")
def proxy(host: str, path: str):
    # ruleid: fastapi-ssrf
    return httpx.request("GET", f"http://{host}/{path}").text


@app.get("/users/{user_id}")
async def get_user(user_id: str):
    async with httpx.AsyncClient() as client:
        # ok: fastapi-ssrf
        resp = await client.get(f"https://users.example.com/api/{user_id}")
    return resp.json()


@app.get("/partner/{item_id}")
def partner_item(item_id: str):
    # ok: fastapi-ssrf
    return requests.get(PARTNER_API + item_id, timeout=5).json()


@app.get("/status")
def status(settings: dict = Depends(get_settings)):
    # ok: fastapi-ssrf
    return requests.get(settings["status_url"], timeout=5).status_code


def not_a_route(url: str):
    # ok: fastapi-ssrf
    return requests.get(url, timeout=5)
